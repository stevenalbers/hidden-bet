import React, { useEffect, useState } from "react";

// Enhanced horse race animation component (copied from AdminPage)
export function HorseRaceAnimation({ winner, finished }: { winner: 'Horse A' | 'Horse B' | null, finished?: boolean }) {
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);

  // Detect dark mode
  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
        <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>40e</span>
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
        <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>40e</span>
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
export function ConfettiExplosion() {
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
