import React, { useEffect, useRef, useState } from "react";

// Use env variable, or infer from window.location, or fallback to localhost for local dev
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ? "http://localhost:3001" : `https://${window.location.hostname}`);

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.hostname === "localhost" ? "ws://localhost:3001" : `wss://${window.location.hostname}`);

type Submission = { name: string; horse: string; wager: number };

export default function TextSubmissionForm() {
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number>(0);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Setup WebSocket connection
  useEffect(() => {
    fetch(`${API_BASE_URL}/my-submission`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.submission) {
          setMySubmission(data.submission);
        } else {
          setMySubmission(null);
        }
      });

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (err) {
        console.error("Failed to parse WebSocket message as JSON:", event.data, err);
        return;
      }
      console.log("msg received", msg);
      if (msg.type === "clear") {
        setMySubmission(null);
        setAllSubmissions(null);
        setName("");
        setHorse("");
        setWager(0);
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
      ws.close();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Submission = { name, horse, wager };
    await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    setMySubmission(payload);
    setName("");
    setHorse("");
    setWager(0);
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
        <div>
          <label>
            Your name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!!mySubmission}
              required
            />
          </label>
        </div>
        <div>
          <label>Your horse:</label>
          <label>
            <input
              type="radio"
              name="horse"
              value="Horse A"
              checked={horse === "Horse A"}
              onChange={() => setHorse("Horse A")}
              disabled={!!mySubmission}
              required
            />
            Horse A
          </label>
          <label>
            <input
              type="radio"
              name="horse"
              value="Horse B"
              checked={horse === "Horse B"}
              onChange={() => setHorse("Horse B")}
              disabled={!!mySubmission}
              required
            />
            Horse B
          </label>
        </div>
        <div>
          <label>
            Your wager (0-100):
            <input
              type="number"
              min={0}
              max={100}
              value={wager}
              onChange={(e) => setWager(Number(e.target.value))}
              disabled={!!mySubmission}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={!!mySubmission || !name.trim() || !horse || wager < 0 || wager > 100}>
          Submit
        </button>
      </form>
      {mySubmission && (
        <div>
          <p>Your submission:</p>
          <ul>
            <li>Name: {mySubmission.name}</li>
            <li>Horse: {mySubmission.horse}</li>
            <li>Wager: {mySubmission.wager}</li>
          </ul>
          <button onClick={handleClear}>Clear All Submissions</button>
        </div>
      )}
      <hr />
      <h3>All Submissions</h3>
      {allSubmissions ? (
        <ul>
          {Object.entries(allSubmissions).map(([id, submission]) => (
            <li key={id}>
              Name: {submission.name}, Horse: {submission.horse}, Wager: {submission.wager}
            </li>
          ))}
        </ul>
      ) : (
        <p>Waiting for all submissions...</p>
      )}
    </div>
  );
}
