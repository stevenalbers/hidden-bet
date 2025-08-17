import React, { useEffect, useState } from "react";
import { HorseRaceAnimation, ConfettiExplosion } from "./HorseRaceAnimation";
import { Submission, useSubmissions } from "./SubmissionsContext";
import { API_BASE_URL } from "../consts";

export default function PlayerPage() {
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number | "">("");
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const { allSubmissions, results } = useSubmissions();

  // --- Race Animation State ---
  const [racing, setRacing] = useState(false);
  const [raceWinner, setRaceWinner] = useState<"Horse A" | "Horse B" | null>(null);

  // Start race animation when results arrive (i.e., admin triggers race)
  useEffect(() => {
    console.log("results", results);

    if (results && results[0] && (results[0].horse === "Horse A" || results[0].horse === "Horse B")) {
      setRacing(true);
      setRaceWinner(results[0].horse as "Horse A" | "Horse B");
      // End race after 10s (match admin)
      const timeout = setTimeout(() => {
        setRacing(false);
      }, 10000);
      return () => clearTimeout(timeout);
    } else {
      setRacing(false);
      setRaceWinner(null);
    }
  }, [results]);

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
        (sub) => sub.name === mySubmission.name && sub.horse === mySubmission.horse && sub.wager === mySubmission.wager
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
  // Accordion state for All Submissions
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Show race animation if racing or race just finished
  const showRace =
    racing || (results && results[0] && (results[0].horse === "Horse A" || results[0].horse === "Horse B"));

  const allSubmitted = allSubmissions && Object.keys(allSubmissions).length >= 2;
  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "1rem" }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="name" style={{ display: "block", marginBottom: 4 }}>
            Your name:
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!mySubmission}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Your horse:</label>
          <div style={{ display: "flex", gap: 12 }}>
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
          <label htmlFor="wager" style={{ display: "block", marginBottom: 4 }}>
            Your wager (0-100):
          </label>
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
          />
        </div>
        <button
          type="submit"
          disabled={
            !!mySubmission || !name.trim() || !horse || wager === "" || Number(wager) < 0 || Number(wager) > 100
          }
          style={{
            padding: 10,
            fontWeight: 700,
            fontSize: 18,
            borderRadius: 8,
            border: "none",
            background: "var(--submit-bg, #222)",
            color: "var(--submit-fg, #fff)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
            cursor: "pointer",
            marginTop: 8,
            transition: "background 0.2s, color 0.2s",
          }}
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
      {/* Show only one section depending on submission state */}
      {!allSubmitted ? (
        <div
          style={{
            padding: "1rem",
            color: "var(--accordion-fg, #fff)",
            background: "var(--accordion-bg, #222)",
            border: "1px solid var(--accordion-border, #444)",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: 0.5,
            textAlign: "center",
            transition: "background 0.2s, color 0.2s",
            marginBottom: 16,
          }}
        >
          Bets submitted: {allSubmissions ? Object.keys(allSubmissions).length : 0}/2
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setAccordionOpen((open) => !open)}
            style={{
              textAlign: "left",
              fontWeight: 700,
              fontSize: 18,
              background: "var(--accordion-bg, #eee)",
              color: "var(--accordion-fg, #222)",
              border: "1px solid var(--accordion-border, #ccc)",
              borderRadius: 8,
              padding: "0.75rem 1rem",
              cursor: "pointer",
              marginBottom: 0,
              outline: "none",
              transition: "background 0.2s, color 0.2s",
            }}
            aria-expanded={accordionOpen}
          >
            The bets are in
            <span style={{ float: "right", fontWeight: 400 }}>{accordionOpen ? "▲" : "▼"}</span>
          </button>
          {/* Contrast theme styles for accordion and submit button */}
          <style>{`
            @media (prefers-color-scheme: dark) {
              :root {
                --accordion-bg: #222;
                --accordion-fg: #fff;
                --accordion-border: #444;
                --submit-bg: #fff;
                --submit-fg: #222;
              }
            }
            @media (prefers-color-scheme: light) {
              :root {
                --accordion-bg: #fff;
                --accordion-fg: #222;
                --accordion-border: #ccc;
                --submit-bg: #222;
                --submit-fg: #fff;
              }
            }
          `}</style>
          {accordionOpen && allSubmissions && Object.keys(allSubmissions).length >= 2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
                flexWrap: "wrap",
                border: "1px solid var(--accordion-border, #ccc)",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: "1rem",
                background: "var(--accordion-bg, #fafafa)",
                color: "var(--accordion-fg, #222)",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {/* Horse A Column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: "inherit" }}>Horse A</h4>
                <ul style={{ paddingLeft: 16 }}>
                  {Object.values(allSubmissions)
                    .filter((sub) => sub.horse === "Horse A")
                    .sort((a, b) => b.wager - a.wager)
                    .map((submission, idx) => (
                      <li
                        key={submission.name + submission.wager + idx}
                        style={{ wordBreak: "break-word", color: "inherit" }}
                      >
                        {submission.name}, Wager: {submission.wager}
                      </li>
                    ))}
                </ul>
              </div>
              {/* Horse B Column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: "inherit" }}>Horse B</h4>
                <ul style={{ paddingLeft: 16 }}>
                  {Object.values(allSubmissions)
                    .filter((sub) => sub.horse === "Horse B")
                    .sort((a, b) => b.wager - a.wager)
                    .map((submission, idx) => (
                      <li
                        key={submission.name + submission.wager + idx}
                        style={{ wordBreak: "break-word", color: "inherit" }}
                      >
                        {submission.name}, Wager: {submission.wager}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Race Animation and Results Section */}
      {showRace && (
        <>
          <hr />
          <div
            style={{
              position: "relative",
              height: 160,
              margin: "2rem 0",
              background: "var(--race-bg, #fff)",
              borderRadius: 8,
              overflow: "hidden",
              border: "2px solid #222",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <HorseRaceAnimation winner={raceWinner} finished={!racing && !!raceWinner} />
            {/* Finish line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: "100%",
                background: "repeating-linear-gradient(180deg, #fff 0 8px, #222 8px 16px)",
                zIndex: 2,
              }}
            />
          </div>
          {/* Show winner below animation after race */}
          {!racing && raceWinner && (
            <>
              <div style={{ position: "relative", margin: "1rem 0", textAlign: "center" }}>
                <ConfettiExplosion />
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 32,
                    color: "#fff",
                    background: "#222",
                    padding: "0.5rem 1.5rem",
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    display: "inline-block",
                    marginTop: 8,
                  }}
                >
                  Winner: {raceWinner}!
                </span>
              </div>
              <h3>Declared Winner Results</h3>
              <ol style={{ paddingLeft: 20 }}>
                {results &&
                  results.map((r, idx) => (
                    <li key={r.name + r.result + idx} style={{ wordBreak: "break-word" }}>
                      {r.name}, Result: {r.result}
                    </li>
                  ))}
              </ol>
            </>
          )}
        </>
      )}
    </div>
  );
}
