export const API_BASE_URL =
  window.location.hostname === "localhost" ? "http://localhost:3001" : "https://hidden-bet-api.onrender.com";
export const WS_URL =
  window.location.hostname === "localhost" ? "ws://localhost:3001" : `wss://hidden-bet-api.onrender.com`;

export const TOTAL_PLAYERS = 10;

export const horseMap: Record<string, string> = {
  "Horse A": "Seabiscuit",
  "Horse B": "War Admiral",
};
