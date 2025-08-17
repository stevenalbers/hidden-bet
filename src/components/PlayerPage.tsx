

import React, { useEffect, useState } from "react";
import { Submission, useSubmissions } from "./SubmissionsContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : `https://${window.location.hostname}`);


export default function PlayerPage() {
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number | "">("");
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const { allSubmissions } = useSubmissions();
  console.log("allSubmissions in PlayerPage:", allSubmissions);

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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Submission = { name, horse, wager: wager === "" ? 0 : Number(wager) };
    await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    setMySubmission(payload);
    setName("");
    setHorse("");
    setWager("");
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
              onChange={(e) => setWager(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={!!mySubmission}
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!!mySubmission || !name.trim() || !horse || wager === "" || Number(wager) < 0 || Number(wager) > 100}
        >
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
