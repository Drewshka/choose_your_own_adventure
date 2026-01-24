import { useState } from "react";
import ThemeInput from "./ThemeInput";
import LoadingStatus from "./LoadingStatus";
import StoryGame from "./StoryGame";
import { API_BASE_URL } from "../util";

function StoryGenerator() {
  const [jobId, setJobId] = useState(null);
  const [story, setStory] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateStory = async (theme) => {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ CREATE JOB
      const createRes = await fetch(`${API_BASE_URL}/stories/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme }),
      });

      if (!createRes.ok) {
        throw new Error("Failed to create job");
      }

      const job = await createRes.json();
      setJobId(job.job_id);

      // 2️⃣ TRIGGER PROCESSING (fire-and-forget)
      fetch(`${API_BASE_URL}/stories/process/${job.job_id}`, {
        method: "POST",
        credentials: "include",
      });

      // 3️⃣ START POLLING
      pollJob(job.job_id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pollJob = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const job = await res.json();

        if (job.status === "completed") {
          clearInterval(interval);
          loadStory(job.story_id);
        }

        if (job.status === "failed") {
          clearInterval(interval);
          setError(job.error || "Story generation failed");
          setLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError("Polling failed");
        setLoading(false);
      }
    }, 2000); // every 2 seconds
  };

  const loadStory = async (storyId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/stories/${storyId}/complete`,
        { credentials: "include" }
      );

      if (!res.ok) {
        throw new Error("Failed to load story");
      }

      const storyData = await res.json();
      setStory(storyData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingStatus jobId={jobId} />;
  }

  if (story) {
    return <StoryGame story={story} />;
  }

  return <ThemeInput onSubmit={generateStory} error={error} />;
}

export default StoryGenerator;


//OLD CODE
// import {useState, useEffect} from "react"
// import {useNavigate} from "react-router-dom";
// import axios from "axios";
// import ThemeInput from "./ThemeInput.jsx";
// import LoadingStatus from "./LoadingStatus.jsx";
// import {API_BASE_URL} from "../util.js";
//
//
// function StoryGenerator() {
//     const navigate = useNavigate()
//     const [theme, setTheme] = useState("")
//     const [jobId, setJobId] = useState(null)
//     const [jobStatus, setJobStatus] = useState(null)
//     const [error, setError] = useState(null)
//     const [loading, setLoading] = useState(false)
//
//     useEffect(() => {
//         let pollInterval;
//
//         if (jobId && jobStatus === "processing") {
//             pollInterval = setInterval(() => {
//                 pollJobStatus(jobId)
//             }, 5000)
//         }
//
//         return () => {
//             if (pollInterval) {
//                 clearInterval(pollInterval)
//             }
//         }
//     }, [jobId, jobStatus])
//
//     const generateStory = async (theme) => {
//         setLoading(true)
//         setError(null)
//         setTheme(theme)
//
//         try {
//             const response = await axios.post(`${API_BASE_URL}/stories/create`, {theme})
//             const {job_id, status} = response.data
//             setJobId(job_id)
//             setJobStatus(status)
//
//             pollJobStatus(job_id)
//         } catch (e) {
//             setLoading(false)
//             setError(`Failed to generate story: ${e.message}`)
//         }
//     }
//
//     const pollJobStatus = async (id) => {
//         try {
//             const response = await axios.get(`${API_BASE_URL}/jobs/${id}`)
//             const {status, story_id, error: jobError} = response.data
//             setJobStatus(status)
//
//             if (status === "completed" && story_id) {
//                 fetchStory(story_id)
//             } else if (status === "failed" || jobError) {
//                 setError(jobError || "Failed to generate story")
//                 setLoading(false)
//             }
//         } catch (e) {
//             if (e.response?.status !== 404) {
//                 setError(`Failed to check story status: ${e.message}`)
//                 setLoading(false)
//             }
//         }
//     }
//
//     const fetchStory = async (id) => {
//         try {
//             setLoading(false)
//             setJobStatus("completed")
//             navigate(`/story/${id}`)
//         } catch (e) {
//             setError(`Failed to load story: ${e.message}`)
//             setLoading(false)
//         }
//     }
//
//     const reset = () => {
//         setJobId(null)
//         setJobStatus(null)
//         setError(null)
//         setTheme("")
//         setLoading(false)
//     }
//
//     return <div className="story-generator">
//         {error && <div className="error-message">
//             <p>{error}</p>
//             <button onClick={reset}>Try Again</button>
//         </div>}
//
//         {!jobId && !error && !loading && <ThemeInput onSubmit={generateStory}/>}
//
//         {loading && <LoadingStatus theme={theme} />}
//     </div>
// }
//
// export default StoryGenerator