
console.log("=== SERVER STARTED ===");

import express from "express";
import session from "express-session";
import cors from "cors";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import bodyParser from "body-parser";

interface SessionWebSocket extends WebSocket {
  sessionId?: string | null;
}


const PORT = process.env.PORT || 3001;
const app = express();

const submissions: { [sessionId: string]: string } = {};
let lastSubmitterSessionId: string | null = null;


app.use(
  cors({
    origin: true, // Allow all origins for Render deployment
    credentials: true,
  })
);


app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(bodyParser.json());

// Get my submission
app.get("/my-submission", (req, res) => {
  if (!req.session) return res.sendStatus(500);
  const text = submissions[req.session.id] || null;
  res.json({ text });
});

// Submit text
app.post("/submit", (req, res) => {
  const { text } = req.body;
  if (!req.session) return res.sendStatus(500);
  submissions[req.session.id] = text;
  console.log("sending text:", text);
  lastSubmitterSessionId = req.session.id;
  res.json({ success: true });
  broadcastSubmissions();
});

// Clear all submissions
app.post("/clear-submissions", (_req, res) => {
  for (const key in submissions) {
    delete submissions[key];
  }
  lastSubmitterSessionId = null;
  res.json({ success: true });

  console.log("Broadcasting CLEAR to all clients:", wss.clients.size);

  wss.clients.forEach((client: SessionWebSocket) => {
    if (client.readyState === 1) {
      console.log("Sending CLEAR to client", client.sessionId);
      client.send(JSON.stringify({ type: "clear" }));
    }
  });
});

// --- WebSocket setup ---

const server = createServer(app);
const wss = new WebSocketServer({ server });

// Helper to parse session ID from cookie
function getSessionIdFromCookie(cookie: string | undefined) {
  if (!cookie) return null;
  const match = cookie.match(/connect\.sid=s%3A([^.;]+)/);
  return match ? match[1] : null;
}

function allSubmitted() {
  // Change this threshold as needed
  return Object.keys(submissions).length >= 2;
}

// Attach sessionId to each ws connection
wss.on("connection", function connection(ws, req) {
  console.log("WebSocket connection established");

  const sessionId = getSessionIdFromCookie(req.headers.cookie);
  (ws as SessionWebSocket).sessionId = sessionId;

  // On connect, send current state
  if (allSubmitted() || (sessionId && sessionId === lastSubmitterSessionId)) {
    ws.send(
      JSON.stringify({
        type: "all-submissions",
        submissions: allSubmitted() ? submissions : null,
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        type: "all-submissions",
        submissions: null,
      })
    );
  }
});

function broadcastSubmissions() {
  wss.clients.forEach((client: SessionWebSocket) => {
    console.log("submit", client.sessionId);

    if (allSubmitted() || client.sessionId === lastSubmitterSessionId) {
      client.send(
        JSON.stringify({
          type: "all-submissions",
          submissions: allSubmitted() ? submissions : null,
        })
      );
    } else if (client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "all-submissions",
          submissions: null,
        })
      );
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
