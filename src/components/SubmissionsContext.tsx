import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export type Submission = { name: string; horse: string; wager: number };

type SubmissionsContextType = {
  allSubmissions: { [key: string]: Submission } | null;
  handleClear: () => void;
  wsRef: React.MutableRefObject<WebSocket | null>;
  results: { name: string; horse: string; wager: number; result: number }[] | null;
};

const SubmissionsContext = createContext<SubmissionsContextType | undefined>(undefined);

const API_BASE_URL =
  //   import.meta.env.VITE_API_URL ||
  window.location.hostname === "localhost" ? "http://localhost:3001" : "https://hidden-bet-api.onrender.com";

const WS_URL =
  //   import.meta.env.VITE_WS_URL ||
  window.location.hostname === "localhost" ? "ws://localhost:3001" : `wss://hidden-bet-api.onrender.com`;

export function SubmissionsProvider({ children }: { children: React.ReactNode }) {
  const [allSubmissions, setAllSubmissions] = useState<{ [key: string]: Submission } | null>(null);
  const [results, setResults] = useState<{ name: string; horse: string; wager: number; result: number }[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    const handleMessage = (event: MessageEvent) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.type === "all-submissions") {
        if (msg.submissions !== null) {
          setAllSubmissions(msg.submissions);
        } else {
          setAllSubmissions(null);
        }
      }
      if (msg.type === "clear") {
        setAllSubmissions(null);
      }
      if (msg.type === "results") {
        setResults(Array.isArray(msg.results) ? [...msg.results].sort((a, b) => b.result - a.result) : null);
      }
    };
    ws.addEventListener("message", handleMessage);
    return () => {
      ws.removeEventListener("message", handleMessage);
      ws.close();
    };
  }, []);

  const handleClear = async () => {
    await fetch(`${API_BASE_URL}/clear-submissions`, {
      method: "POST",
      credentials: "include",
    });
  };

  return (
    <SubmissionsContext.Provider value={{ allSubmissions, handleClear, wsRef, results }}>
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error("useSubmissions must be used within SubmissionsProvider");
  return ctx;
}
