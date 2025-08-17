import React, { useEffect, useState } from "react";

// Enhanced horse race animation component
export function HorseRaceAnimation({ winner, finished, onRaceEnd }: {
  winner: "Horse A" | "Horse B" | null;
  finished?: boolean;
  onRaceEnd?: () => void;
}) {
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [raceStarted, setRaceStarted] = useState(false);

  // Always reset progress and countdown when a new race starts, but not when finished is true
  useEffect(() => {
    if (finished) return;
    setProgressA(0);
    setProgressB(0);
    if (winner) {
      setCountdown(5);
      setRaceStarted(false);
    } else {
      setCountdown(null);
      setRaceStarted(false);
    }
  }, [winner, finished]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setRaceStarted(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Detect dark mode
  const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const horseTextColor = isDark ? "#fff" : "#111";
  const horseShadow = isDark ? "0 2px 8px #000" : "0 2px 8px #fff";

  useEffect(() => {
    if (!raceStarted || finished) return;
    let start: number | null = null;
    let raf: number;
    // Generate random lead changes (crossings)
    const crossings = 3 + Math.floor(Math.random() * 3); // 3-5 crossings
    // Each crossing is a time (ms) between 1s and 9s, sorted
    const crossingTimes = Array.from({ length: crossings }, () => 1000 + Math.random() * 8000).sort((a, b) => a - b);
    // At each crossing, the lead swaps
    let lastLead: "A" | "B" = Math.random() < 0.5 ? "A" : "B";
    const leadSchedule: { t: number; lead: "A" | "B" }[] = crossingTimes.map((t) => {
      lastLead = lastLead === "A" ? "B" : "A";
      return { t, lead: lastLead };
    });
    // Winner is in the lead at the end
    leadSchedule.push({ t: 10000, lead: winner === "Horse A" ? "A" : "B" });

    function getLeadAt(t: number) {
      let lead: "A" | "B" = leadSchedule[0]?.lead || (winner === "Horse A" ? "A" : "B");
      for (let i = 0; i < leadSchedule.length; ++i) {
        if (t >= leadSchedule[i].t) {
          lead = leadSchedule[i].lead;
        } else {
          break;
        }
      }
      return lead;
    }

    function animate(ts: number) {
      if (start === null) start = ts;
      const elapsed = ts - start;
      // Winner finishes at 10s, loser at 10.5s
      const t = Math.min(elapsed, 10500);
      const lead = getLeadAt(t);
      // Add some jitter for realism
      const jitterA = (Math.random() - 0.5) * 0.01;
      const jitterB = (Math.random() - 0.5) * 0.01;
      let pctA, pctB;
      if (lead === "A") {
        pctA = Math.min(t / 10000 + 0.01 + jitterA, 1);
        pctB = Math.min(t / 10000 - 0.01 + jitterB, 1, pctA - 0.01);
      } else {
        pctB = Math.min(t / 10000 + 0.01 + jitterB, 1);
        pctA = Math.min(t / 10000 - 0.01 + jitterA, 1, pctB - 0.01);
      }
      // Loser slows down after 10s
      if (winner === "Horse A" && t > 10000) pctB = Math.min((t - 10000) / 500 + 1, 1);
      if (winner === "Horse B" && t > 10000) pctA = Math.min((t - 10000) / 500 + 1, 1);
      setProgressA(pctA);
      setProgressB(pctB);
      if (pctA < 1 || pctB < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        // Animation finished
        if (onRaceEnd) onRaceEnd();
      }
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [raceStarted, winner, finished, onRaceEnd]);

  // Highlight the winning horse after the race
  const highlightStyle = {
    color: "#fff",
    background: "#28a745",
    borderRadius: 8,
    padding: "0.2em 0.7em",
    marginLeft: 12,
    fontWeight: 900,
    boxShadow: "0 2px 8px #222",
    border: "2px solid #fff",
    position: "relative" as const,
    zIndex: 3,
  };

  return (
    <>
      {/* Countdown overlay */}
      {countdown !== null && countdown > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            color: "#fff",
            fontWeight: 900,
            letterSpacing: 2,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {countdown}
        </div>
      )}
      {/* Horse A Name (fixed left) */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          fontSize: 24,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <span style={finished && winner === "Horse A" ? highlightStyle : {}}>
          Horse A
        </span>
      </div>
      {/* Horse A Emoji (animated) */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: `calc(${progressA * 100}% - 32px)`,
          fontSize: 48,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 1,
          transition: "left 0.1s linear",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "visible",
        }}
      >
        <span style={{ transform: "scaleX(-1)", display: "inline-block" }}>🐎</span>
        {finished && winner === "Horse A" && <ConfettiExplosion />}
      </div>
      {/* Horse B Name (fixed left) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 0,
          fontSize: 24,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        <span style={finished && winner === "Horse B" ? highlightStyle : {}}>
          Horse B
        </span>
      </div>
      {/* Horse B Emoji (animated) */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: `calc(${progressB * 100}% - 32px)`,
          fontSize: 48,
          color: horseTextColor,
          textShadow: horseShadow,
          fontWeight: 700,
          zIndex: 1,
          transition: "left 0.1s linear",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          overflow: "visible",
        }}
      >
        <span style={{ transform: "scaleX(-1)", display: "inline-block" }}>🐎</span>
        {finished && winner === "Horse B" && <ConfettiExplosion />}
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
      "#ff595e",
      "#ffca3a",
      "#8ac926",
      "#1982c4",
      "#6a4c93",
      "#fff",
      "#222",
      "#f7b801",
      "#f95738",
      "#43aa8b",
    ][Math.floor(Math.random() * 10)];
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: 10,
          height: 10,
          background: color,
          borderRadius: 2,
          transform: `rotate(${rotate}deg)`,
          opacity: 0.85,
          zIndex: 10,
          animation: "confetti-fall 1.2s ease-out",
        }}
      />
    );
  });
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
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
