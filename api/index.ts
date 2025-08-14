import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

const submissions: { [sessionId: string]: string } = {};
let lastSubmitterSessionId: string | null = null;

// Store SSE connections
const clients: { id: string; res: express.Response }[] = [];

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true, // true allows all origins
    credentials: true,
  })
);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(bodyParser.json());

// SSE endpoint
app.get("/events", (req, res) => {
  if (!req.session) return res.sendStatus(500);

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const clientId = req.session.id;
  clients.push({ id: clientId, res });

  // Send initial state
  sendAllSubmissions(clientId);

  req.on("close", () => {
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

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
  broadcastClear();
});

function allSubmitted() {
  return Object.keys(submissions).length >= 3;
}

function sendAllSubmissions(clientId: string) {
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;
  const all = allSubmitted();
  const data = {
    type: "all-submissions",
    submissions: all ? submissions : null,
  };
  client.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function broadcastSubmissions() {
  const all = allSubmitted();
  clients.forEach((client) => {
    if (all || client.id === lastSubmitterSessionId) {
      client.res.write(
        `data: ${JSON.stringify({
          type: "all-submissions",
          submissions: all ? submissions : null,
        })}\n\n`
      );
    } else {
      client.res.write(
        `data: ${JSON.stringify({
          type: "all-submissions",
          submissions: null,
        })}\n\n`
      );
    }
  });
}

function broadcastClear() {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify({ type: "clear" })}\n\n`);
  });
}

export default app;
