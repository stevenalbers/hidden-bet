import React, { useEffect, useRef, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === "localhost" ? "http://localhost:3001" : `https://${window.location.hostname}/api`);

export default function TextSubmissionForm() {
  const [text, setText] = useState("");
  const [mySubmission, setMySubmission] = useState<string | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<{ [key: string]: string } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Get initial submission
    fetch(`${BASE_URL}/my-submission`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMySubmission(data.text));

    // Setup SSE connection
    const eventSource = new EventSource(`${BASE_URL}/events`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse SSE message as JSON:", event.data, err);
        return;
      }
      console.log("msg received", msg);
      if (msg.type === "clear") {
        setMySubmission(null);
        setAllSubmissions(null);
        setText("");
        return;
      }
      if (msg.type === "all-submissions") {
        if (msg.submissions !== null) {
          setAllSubmissions(msg.submissions);
        } else {
          setAllSubmissions(null);
        }
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    setMySubmission(text);
    setText("");
  };

  const handleClear = async () => {
    await fetch(`${BASE_URL}/clear-submissions`, {
      method: "POST",
      credentials: "include",
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text"
          disabled={!!mySubmission}
        />
        <button type="submit" disabled={!!mySubmission || !text.trim()}>
          Submit
        </button>
      </form>
      {mySubmission && (
        <div>
          <p>Your submission: {mySubmission}</p>
          <button onClick={handleClear}>Clear All Submissions</button>
        </div>
      )}
      <hr />
      <h3>All Submissions</h3>
      {allSubmissions ? (
        <ul>
          {Object.entries(allSubmissions).map(([id, submission]) => (
            <li key={id}>{submission}</li>
          ))}
        </ul>
      ) : (
        <p>Waiting for all submissions...</p>
      )}
    </div>
  );
}
