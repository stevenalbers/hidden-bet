import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlayerPage from "./components/PlayerPage";
import AdminPage from "./components/AdminPage";
// import { useEffect, useRef, useState } from "react";
// import { Submission } from "types/api";

// const API_BASE_URL =
//   import.meta.env.VITE_API_URL ||
//   (window.location.hostname === "localhost" ? "http://localhost:3001" : `https://${window.location.hostname}`);

// const WS_URL =
//   import.meta.env.VITE_WS_URL ||
//   (window.location.hostname === "localhost" ? "ws://localhost:3001" : `wss://${window.location.hostname}`);

// function useAllSubmissions() {
//   const [allSubmissions, setAllSubmissions] = useState<{ [key: string]: Submission } | null>(null);
//   const wsRef = useRef<WebSocket | null>(null);

//   useEffect(() => {
//     const ws = new WebSocket(WS_URL);
//     wsRef.current = ws;
//     ws.onmessage = (event) => {
//       let msg;
//       try {
//         msg = JSON.parse(event.data);
//       } catch (err) {
//         console.error("Failed to parse WebSocket message as JSON:", event.data, err);
//         return;
//       }
//       if (msg.type === "all-submissions") {
//         if (msg.submissions !== null) {
//           setAllSubmissions(msg.submissions);
//         } else {
//           setAllSubmissions(null);
//         }
//       }
//       if (msg.type === "clear") {
//         setAllSubmissions(null);
//       }
//     };
//     return () => {
//       ws.close();
//     };
//   }, []);

//   const handleClear = async () => {
//     await fetch(`${API_BASE_URL}/clear-submissions`, {
//       method: "POST",
//       credentials: "include",
//     });
//   };

//   return { allSubmissions, handleClear };
// }

import React from "react";
// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import PlayerPage from "./components/PlayerPage";
// import AdminPage from "./components/AdminPage";
import { SubmissionsProvider, useSubmissions } from "./components/SubmissionsContext";

function RoutedApp() {
  const { allSubmissions, handleClear } = useSubmissions();
  return (
    <BrowserRouter>
      {/* <nav style={{ marginBottom: 20 }}> */}
      {/* <Link to="/player">Player</Link> | <Link to="/admin">Admin</Link> */}
      {/* </nav> */}
      <Routes>
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/admin" element={<AdminPage allSubmissions={allSubmissions} onClear={handleClear} />} />
        <Route path="*" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SubmissionsProvider>
      <RoutedApp />
    </SubmissionsProvider>
  );
}
