import React, { useEffect, useState } from "react";
import { Submission, useSubmissions } from "./SubmissionsContext";
import { API_BASE_URL } from "../consts";

export default function PlayerPage() {
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number | "">("");
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const { allSubmissions, results } = useSubmissions();

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
    // Only reset mySubmission if allSubmissions is not null (i.e., after a clear),
    // and mySubmission is not present in allSubmissions
    if (mySubmission && allSubmissions !== null) {
      const stillExists = Object.values(allSubmissions).some(
        (sub) =>
          sub.name === mySubmission.name &&
          sub.horse === mySubmission.horse &&
          sub.wager === mySubmission.wager
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
    <div style={{ maxWidth: 380, margin: '0 auto', padding: '1rem' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: 4 }}>Your name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!mySubmission}
            required
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Your horse:</label>
          <div style={{ display: 'flex', gap: 12 }}>
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
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="wager" style={{ display: 'block', marginBottom: 4 }}>Your wager (0-100):</label>
          <input
            id="wager"
            type="number"
            min={0}
            max={100}
            step={1}
            pattern="[0-9]*"
            inputMode="numeric"
            value={wager}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val) && (val === "" || (Number(val) >= 0 && Number(val) <= 100))) {
                setWager(val === "" ? "" : Number(val));
              }
            }}
            disabled={!!mySubmission}
            required
            style={{ width: '100%' }}
          />
        </div>
        <button
          type="submit"
          disabled={
            !!mySubmission || !name.trim() || !horse || wager === "" || Number(wager) < 0 || Number(wager) > 100
          }
          style={{ width: '100%', padding: 8 }}
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
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Horse A Column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4>Horse A</h4>
            <ul style={{ paddingLeft: 16 }}>
              {Object.values(allSubmissions)
                .filter((sub) => sub.horse === 'Horse A')
                .sort((a, b) => b.wager - a.wager)
                .map((submission, idx) => (
                  <li key={submission.name + submission.wager + idx} style={{ wordBreak: 'break-word' }}>
                    {submission.name}, Wager: {submission.wager}
                  </li>
                ))}
            </ul>
          </div>
          {/* Horse B Column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4>Horse B</h4>
            <ul style={{ paddingLeft: 16 }}>
              {Object.values(allSubmissions)
                .filter((sub) => sub.horse === 'Horse B')
                .sort((a, b) => b.wager - a.wager)
                .map((submission, idx) => (
                  <li key={submission.name + submission.wager + idx} style={{ wordBreak: 'break-word' }}>
                    {submission.name}, Wager: {submission.wager}
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
          <ol style={{ paddingLeft: 20 }}>
            {results.map((r, idx) => (
              <li key={r.name + r.result + idx} style={{ wordBreak: 'break-word' }}>
                {r.name}, Result: {r.result}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
