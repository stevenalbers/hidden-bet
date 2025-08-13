import express from "express";
import session from "express-session";
import cors from "cors";

const app = express();
const PORT = 3001;

// In-memory store for all submissions
const submissions: { [sessionId: string]: string } = {};

app.use(
  cors({
    origin: "http://localhost:5173", // Vite default port
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Submit text
app.post("/submit", (req, res) => {
  const { text } = req.body;
  if (!req.session) return res.sendStatus(500);
  submissions[req.session.id] = text;
  res.json({ success: true });
});

// Get current user's submission
app.get("/my-submission", (req, res) => {
  if (!req.session) return res.sendStatus(500);
  res.json({ text: submissions[req.session.id] || null });
});

// Get all submissions (only after all have submitted)
app.get("/all-submissions", (_req, res) => {
  // For demo: reveal all if at least 2 submissions
  const allSubmitted = Object.keys(submissions).length >= 2;
  if (allSubmitted) {
    res.json({ submissions });
  } else {
    res.json({ submissions: null });
  }
});

app.post('/clear-submissions', (_req, res) => {
  for (const key in submissions) {
    delete submissions[key];
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
