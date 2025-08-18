import React, { useEffect, useState, useRef } from "react";
// Ref for the race animation container
import { HorseRaceAnimation, ConfettiExplosion } from "./HorseRaceAnimation";
import { Submission, useSubmissions } from "./SubmissionsContext";
import { API_BASE_URL, TOTAL_PLAYERS } from "../consts";

export default function PlayerPage() {
  // Ref for draft order section
  const [name, setName] = useState("");
  const [horse, setHorse] = useState<string>("");
  const [wager, setWager] = useState<number | "">("");
  const raceRef = useRef<HTMLDivElement>(null);
  const draftOrderRef = useRef<HTMLDivElement>(null);

  // Add bookieBet to mySubmission
  const [mySubmission, setMySubmission] = useState<(Submission & { bookieBet: number; totalWager: number }) | null>(
    null
  );
  const [, setBookieBet] = useState<number>(0);
  const { allSubmissions, results } = useSubmissions();

  // --- Race Animation State ---
  const [racing, setRacing] = useState(false);
  const [raceWinner, setRaceWinner] = useState<"Horse A" | "Horse B" | null>(null);

  // Auto scroll to draft order when race completes and draft order appears
  useEffect(() => {
    if (!racing && raceWinner && draftOrderRef.current) {
      draftOrderRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [racing, raceWinner]);

  // Start race animation when results arrive (i.e., admin triggers race)
  useEffect(() => {
    if (results && results[0] && (results[0].horse === "Horse A" || results[0].horse === "Horse B")) {
      setRacing(true);
      setRaceWinner(results[0].horse as "Horse A" | "Horse B");
      // Scroll race into view when race starts
      setTimeout(() => {
        raceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100); // slight delay to ensure render
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

  // Bookie bet logic: generate once per user per submission and persist in localStorage
  function getBookieBet(sub: Submission) {
    // Use a hash of name+horse+wager to seed a pseudo-random number between 0-50
    const key = `bookieBet|${sub.name}|${sub.horse}|${sub.wager}`;
    const stored = localStorage.getItem(key);
    if (stored !== null) return Number(stored);
    // Only generate if not present
    const str = `${sub.name}|${sub.horse}|${sub.wager}`;
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    const bookie = Math.abs(hash) % 51;
    localStorage.setItem(key, String(bookie));
    return bookie;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const wagerVal = wager === "" ? 0 : Number(wager);
    const payload: Submission = { name, horse, wager: wagerVal };
    // Generate Bookie bet and persist for this submission
    const bookie = getBookieBet(payload);
    setBookieBet(bookie);
    // Send to backend: only send player wager (not bookie bet)
    await fetch(`${API_BASE_URL}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    // No reload here; reload will be handled by useEffect when all bets are in
  };
  // Only reload once when all bets are submitted
  useEffect(() => {
    if (allSubmissions && Object.keys(allSubmissions).length >= TOTAL_PLAYERS) {
      // Only reload if not already reloaded in this session
      const reloadedKey = "allBetsReloaded";
      if (!sessionStorage.getItem(reloadedKey)) {
        sessionStorage.setItem(reloadedKey, "true");
        window.location.reload();
      }
    }
  }, [allSubmissions]);
  // Accordion state for All Submissions
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Show race animation if racing or race just finished
  const showRace =
    racing || (results && results[0] && (results[0].horse === "Horse A" || results[0].horse === "Horse B"));

  // Auto scroll to draft order when race completes and draft order appears
  useEffect(() => {
    if (!racing && raceWinner && draftOrderRef.current) {
      draftOrderRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [racing, raceWinner]);

  const allSubmitted = allSubmissions && Object.keys(allSubmissions).length >= TOTAL_PLAYERS;
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
            cursor: mySubmission ? "not-allowed" : "pointer",
            marginTop: 8,
            transition: "background 0.2s, color 0.2s, opacity 0.2s",
            opacity: mySubmission ? 0.5 : 1,
          }}
        >
          {mySubmission ? "Locked in" : "Lock in"}
        </button>
      </form>
      {mySubmission && (
        <div>
          <p>Your submission:</p>
          <ul>
            <li>Name: {mySubmission.name}</li>
            <li>Horse: {mySubmission.horse}</li>
            <li>My Wager: {mySubmission.wager}</li>
            <li>
              Bookie's Wager:{" "}
              {typeof mySubmission.bookieBet === "number" ? mySubmission.bookieBet : getBookieBet(mySubmission)}
            </li>
            <li>
              Total Wager:{" "}
              <b>
                {typeof mySubmission.totalWager === "number"
                  ? mySubmission.totalWager
                  : mySubmission.wager + getBookieBet(mySubmission)}
              </b>
            </li>
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
          Bets submitted: {allSubmissions ? Object.keys(allSubmissions).length : 0}/{TOTAL_PLAYERS}
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
            The bets are in!
            <span style={{ paddingLeft: ".5rem", float: "right", fontWeight: 400 }}>{accordionOpen ? "▲" : "▼"}</span>
          </button>
          <br />
          <span style={{ fontSize: 10 }}>
            (hover or tap on a <strong>player name</strong> to see their bet breakdown)
          </span>
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
          {accordionOpen && allSubmissions && Object.keys(allSubmissions).length >= TOTAL_PLAYERS && (
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
                    .map((submission, idx) => {
                      const bookie = getBookieBet(submission);
                      const total = submission.wager + bookie;
                      const tooltip = `Player: ${submission.wager}, Bookie: ${bookie}`;
                      return (
                        <li
                          key={submission.name + submission.wager + idx}
                          style={{ wordBreak: "break-word", color: "inherit", position: "relative", cursor: "pointer" }}
                          tabIndex={0}
                        >
                          <span style={{ fontWeight: 700 }}>{submission.name}:</span> <span>{total}</span>
                          <span
                            className="player-tooltip"
                            style={{
                              visibility: "hidden",
                              opacity: 0,
                              position: "absolute",
                              //   left: '15%',
                              //   bottom: '100%',
                              transform: "translateX(-50%) translateY(-30px)",
                              background: "#222",
                              color: "#fff",
                              padding: "6px 12px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              zIndex: 10,
                              fontSize: 14,
                              transition: "opacity 0.2s",
                              marginLeft: 0,
                              pointerEvents: "none",
                            }}
                          >
                            {tooltip}
                          </span>
                          <style>{`
                            li[tabindex="0"]:hover .player-tooltip,
                            li[tabindex="0"]:focus .player-tooltip,
                            li[tabindex="0"]:active .player-tooltip {
                              visibility: visible !important;
                              opacity: 1 !important;
                              pointer-events: auto;
                            }
                          `}</style>
                        </li>
                      );
                    })}
                </ul>
              </div>
              {/* Horse B Column */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: "inherit" }}>Horse B</h4>
                <ul style={{ paddingLeft: 16 }}>
                  {Object.values(allSubmissions)
                    .filter((sub) => sub.horse === "Horse B")
                    .sort((a, b) => b.wager - a.wager)
                    .map((submission, idx) => {
                      const bookie = getBookieBet(submission);
                      const total = submission.wager + bookie;
                      const tooltip = `Player: ${submission.wager}, Bookie: ${bookie}`;
                      return (
                        <li
                          key={submission.name + submission.wager + idx}
                          style={{ wordBreak: "break-word", color: "inherit", position: "relative", cursor: "pointer" }}
                          tabIndex={0}
                        >
                          <span style={{ fontWeight: 700 }}>{submission.name}:</span> <span>{total}</span>
                          <span
                            className="player-tooltip"
                            style={{
                              visibility: "hidden",
                              opacity: 0,
                              position: "absolute",
                              //   left: '100%',
                              //   top: '50%',
                              transform: "translateX(-100%) translateY(-30px)",
                              background: "#222",
                              color: "#fff",
                              padding: "6px 12px",
                              borderRadius: 6,
                              whiteSpace: "nowrap",
                              zIndex: 10,
                              fontSize: 14,
                              transition: "opacity 0.2s",
                              marginLeft: 8,
                              pointerEvents: "none",
                            }}
                          >
                            {tooltip}
                          </span>
                          <style>{`
                            li[tabindex="0"]:hover .player-tooltip,
                            li[tabindex="0"]:focus .player-tooltip,
                            li[tabindex="0"]:active .player-tooltip {
                              visibility: visible !important;
                              opacity: 1 !important;
                              pointer-events: auto;
                            }
                          `}</style>
                        </li>
                      );
                    })}
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
            ref={raceRef}
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
            <HorseRaceAnimation
              winner={raceWinner}
              finished={!racing && !!raceWinner}
              onRaceEnd={() => setRacing(false)}
            />
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
              <div ref={draftOrderRef} />
              <div ref={draftOrderRef} />
              <h3>The Draft Order!</h3>
              <ol style={{ paddingLeft: 20 }}>
                {results &&
                  (() => {
                    // Compute results with calculated result value
                    const computed = results.map((r) => {
                      const bookie = getBookieBet(r);
                      const total = r.wager + bookie;
                      const isWinner = r.horse === raceWinner;
                      const resultVal = isWinner ? 150 + total : 150 - total;
                      return { ...r, bookie, total, resultVal };
                    });
                    // Sort descending by resultVal
                    computed.sort((a, b) => b.resultVal - a.resultVal);
                    return computed.map((r, idx) => {
                      const sign = r.horse === raceWinner ? "+" : "-";
                      const placeNumber = idx + 1;
                      let placeStyle = {};
                      if (idx === 0) {
                        placeStyle = {
                          fontSize: 28,
                          fontWeight: 900,
                          color: "#FFD700",
                          marginRight: 8,
                          verticalAlign: "middle",
                        };
                      } else if (idx === 1) {
                        placeStyle = {
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#C0C0C0",
                          marginRight: 8,
                          verticalAlign: "middle",
                        };
                      } else if (idx === 2) {
                        placeStyle = {
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#CD7F32",
                          marginRight: 8,
                          verticalAlign: "middle",
                        };
                      } else {
                        placeStyle = {
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#888",
                          marginRight: 8,
                          verticalAlign: "middle",
                        };
                      }
                      return (
                        <li
                          key={r.name + r.resultVal + idx}
                          style={{ wordBreak: "break-word", display: "flex", alignItems: "center", marginBottom: 4 }}
                        >
                          <span style={placeStyle}>{placeNumber}</span>
                          <span>
                            <b>{r.name}</b>: Race result: {sign}
                            {r.total}, Grand total: <b>{r.resultVal}</b>
                          </span>
                        </li>
                      );
                    });
                  })()}
              </ol>
            </>
          )}
        </>
      )}
    </div>
  );
}
