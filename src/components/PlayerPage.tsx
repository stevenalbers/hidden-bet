import React, { useEffect, useState } from "react";
import { Submission, useSubmissions } from "./SubmissionsContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ? "http://localhost:3001" : `https://${window.location.hostname}`);

export default function PlayerPage() {
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number | "">("");
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const { allSubmissions, results } = useSubmissions();
  console.log("allSubmissions in PlayerPage:", allSubmissions);

  // Fetch my submission on mount
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

  // If my submission is cleared from allSubmissions, allow resubmission
  useEffect(() => {
    // If mySubmission exists, but is not present in allSubmissions (including when allSubmissions is empty/null), reset it
    if (mySubmission) {
      const stillExists =
        allSubmissions &&
        Object.values(allSubmissions).some(
          (sub) =>
            sub.name === mySubmission.name && sub.horse === mySubmission.horse && sub.wager === mySubmission.wager
        );
      if (!stillExists) {
        setMySubmission(null);
      }
    }
  }, [allSubmissions, mySubmission]);

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
          disabled={
            !!mySubmission || !name.trim() || !horse || wager === "" || Number(wager) < 0 || Number(wager) > 100
          }
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
        <div style={{ display: "flex", gap: "2rem" }}>
          {/* Horse A Column */}
          <div>
            <h4>Horse A</h4>
            <ul>
              {Object.values(allSubmissions)
                .filter((sub) => sub.horse === "Horse A")
                .sort((a, b) => b.wager - a.wager)
                .map((submission, idx) => (
                  <li key={submission.name + submission.wager + idx}>
                    Name: {submission.name}, Wager: {submission.wager}
                  </li>
                ))}
            </ul>
          </div>
          {/* Horse B Column */}
          <div>
            <h4>Horse B</h4>
            <ul>
              {Object.values(allSubmissions)
                .filter((sub) => sub.horse === "Horse B")
                .sort((a, b) => b.wager - a.wager)
                .map((submission, idx) => (
                  <li key={submission.name + submission.wager + idx}>
                    Name: {submission.name}, Wager: {submission.wager}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>Waiting for all submissions...</p>
      )}

      {/* Declared Winner Results Section */}
      {results && (
        <>
          <hr />
          <h3>Declared Winner Results</h3>
          <ul>
            {results.map((r, idx) => (
              <li key={r.name + r.result + idx}>
                Name: {r.name}, Horse: {r.horse}, Wager: {r.wager}, Result: {r.result}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
