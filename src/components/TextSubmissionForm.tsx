import React, { useEffect, useRef, useState } from "react";


// Use the deployed Render backend URL for all API and WebSocket calls
const API_BASE_URL = "https://hidden-bet-api.onrender.com";
const WS_URL = "wss://hidden-bet-api.onrender.com";

export default function TextSubmissionForm() {
  const [text, setText] = useState("");
  const [mySubmission, setMySubmission] = useState<string | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<{ [key: string]: string } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
  fetch(`${API_BASE_URL}/my-submission`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setMySubmission(data.text));

  const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("msg received", msg);
      if (msg.type === "clear") {
        setMySubmission(null);
        setAllSubmissions(null);
        setText("");
        return; // <-- Ignore any further processing for this message
      }
      if (msg.type === "all-submissions") {
        // Only update if submissions is not null
        if (msg.submissions !== null) {
          setAllSubmissions(msg.submissions);
        } else {
          setAllSubmissions(null);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
    setMySubmission(text);
    setText("");
    // No need to fetch all submissions; will get update via WebSocket
  };

  const handleClear = async () => {
  await fetch(`${API_BASE_URL}/clear-submissions`, {
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
        <button type="submit" disabled={!!mySubmission || !text}>
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
