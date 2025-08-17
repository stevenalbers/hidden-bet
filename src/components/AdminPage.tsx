import { useEffect, useState } from "react";
import { API_BASE_URL } from "../consts";
import { Submission } from "types/api";

type Horse = "Horse A" | "Horse B";

async function handleDeclareWinner(horse: Horse) {
  await fetch(`${API_BASE_URL}/declare-winner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winner: horse }),
    credentials: "include",
  });
}

interface AdminPageProps {
  allSubmissions: { [key: string]: Submission } | null;
  onClear: () => void;
}

export default function AdminPage({ allSubmissions, onClear }: AdminPageProps) {
      const [racing, setRacing] = useState(false);
  const [winner, setWinner] = useState<Horse | null>(null);
  const handleClearPlayer = async (sessionId: string) => {
    await fetch(`${API_BASE_URL}/clear-submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
      credentials: "include",
    });
    // No need to manually update, context will update on broadcast
  };

  const handleRace = async () => {
    if (racing) return;
    setRacing(true);
    setWinner(null);
    // Randomly pick winner
    const chosen: Horse = Math.random() < 0.5 ? "Horse A" : "Horse B";
    setWinner(chosen);
    // Wait 10 seconds, then declare winner
    setTimeout(async () => {
      setRacing(false);
      await handleDeclareWinner(chosen);
    }, 10000);
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={onClear}>Clear All Submissions</button>
      <div style={{ margin: "1rem 0" }}>
        <button onClick={() => handleDeclareWinner("Horse A")}>Declare Horse A Winner</button>
        <button style={{ marginLeft: 8 }} onClick={() => handleDeclareWinner("Horse B")}> 
          Declare Horse B Winner
        </button>
        <button style={{ marginLeft: 8 }} onClick={handleRace} disabled={racing}>
          Race
        </button>
      </div>
      {(racing || winner) && (
        <div
          style={{
            position: 'relative',
            height: 160,
            margin: '2rem 0',
            background: 'var(--race-bg, #fff)',
            borderRadius: 8,
            overflow: 'hidden',
            border: '2px solid #222',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <HorseRaceAnimation winner={winner} finished={!racing && !!winner} />
          {/* Finish line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: '100%',
              background: 'repeating-linear-gradient(180deg, #fff 0 8px, #222 8px 16px)',
              zIndex: 2,
            }}
          />
        </div>
      )}
      {/* Show winner below animation after race */}
      {!racing && winner && (
        <div style={{ position: 'relative', margin: '1rem 0', textAlign: 'center' }}>
          <ConfettiExplosion />
          <span
            style={{
              fontWeight: 900,
              fontSize: 32,
              color: '#fff',
              background: '#222',
              padding: '0.5rem 1.5rem',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'inline-block',
              marginTop: 8,
            }}
          >
            Winner: {winner}!
          </span>
        </div>
      )}
      <hr />
      <h3>All Submissions</h3>
      {allSubmissions ? (
        <ul>
          {Object.entries(allSubmissions).map(([id, submission]) => (
            <li key={id}>
              {submission.name}
              <button style={{ marginLeft: 8 }} onClick={() => handleClearPlayer(id)}>
                Clear
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Waiting for all submissions...</p>
      )}
    </div>
  );
}

// Enhanced horse race animation component
function HorseRaceAnimation({ winner, finished }: { winner: 'Horse A' | 'Horse B' | null, finished?: boolean }) {
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);

  // Detect dark mode
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const horseTextColor = isDark ? '#fff' : '#111';
  const horseShadow = isDark ? '0 2px 8px #000' : '0 2px 8px #fff';

  useEffect(() => {
    let start: number | null = null;
    let raf: number;
    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      // Winner finishes at 10s, loser at 10.5s
      const pctA = winner === 'Horse A' ? Math.min(elapsed / 10000, 1) : Math.min(elapsed / 10500, 1);
      const pctB = winner === 'Horse B' ? Math.min(elapsed / 10000, 1) : Math.min(elapsed / 10500, 1);
      setProgressA(pctA);
      setProgressB(pctB);
      if (pctA < 1 || pctB < 1) {
        raf = requestAnimationFrame(animate);
      }
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [winner]);

  // Highlight the winning horse after the race
  const highlightStyle = {
    color: '#fff',
    background: '#28a745',
    borderRadius: 8,
    padding: '0.2em 0.7em',
    marginLeft: 12,
    fontWeight: 900,
    boxShadow: '0 2px 8px #222',
    border: '2px solid #fff',
    position: 'relative' as const,
    zIndex: 3,
  };

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 30,
          left: `calc(${progressA * 90}% - 32px)`,
          fontSize: 48,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 1,
          transition: 'left 0.1s linear',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'visible',
        }}
      >
        <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🐎</span>
        <span
          style={
            finished && winner === 'Horse A'
              ? highlightStyle
              : { marginLeft: 12 }
          }
        >
          Horse A
        </span>
        {finished && winner === 'Horse A' && <ConfettiExplosion />}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: `calc(${progressB * 90}% - 32px)`,
          fontSize: 48,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 1,
          transition: 'left 0.1s linear',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          overflow: 'visible',
        }}
      >
        <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>🐎</span>
        <span
          style={
            finished && winner === 'Horse B'
              ? highlightStyle
              : { marginLeft: 12 }
          }
        >
          Horse B
        </span>
        {finished && winner === 'Horse B' && <ConfettiExplosion />}
      </div>
    </>
  );
}

// Simple confetti explosion animation
function ConfettiExplosion() {
  // Render 30 confetti pieces with random positions/colors
  const confetti = Array.from({ length: 30 }).map((_, i) => {
    const left = Math.random() * 80 + 10;
    const top = Math.random() * 40 + 10;
    const rotate = Math.random() * 360;
    const color = [
      '#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#fff', '#222', '#f7b801', '#f95738', '#43aa8b'
    ][Math.floor(Math.random() * 10)];
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: 10,
          height: 10,
          background: color,
          borderRadius: 2,
          transform: `rotate(${rotate}deg)`,
          opacity: 0.85,
          zIndex: 10,
          animation: 'confetti-fall 1.2s ease-out',
        }}
      />
    );
  });
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {confetti}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-30px) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(60px) scale(1.2) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
