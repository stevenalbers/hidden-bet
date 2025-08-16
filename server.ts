// server.ts
import express from "express";
import { createServer } from "http";
import { getRedisClient } from "./lib/redis";
import { sessionMiddleware } from "./lib/middleware";
import type { RequestWithSession } from "./lib/types";

const app = express();
const redis = getRedisClient();
const PORT = process.env.PORT || 3001;

// Apply middleware
app.use(express.json());
app.use(sessionMiddleware);

// Import API handlers
import mySubmissionHandler from "./api/my-submission";
import submitHandler from "./api/submit";
import clearSubmissionsHandler from "./api/clear-submissions";
import eventsHandler from "./api/events";

// Route handlers
app.get("/api/my-submission", (req, res) => mySubmissionHandler(req as RequestWithSession, res));
app.post("/api/submit", (req, res) => submitHandler(req as RequestWithSession, res));
app.post("/api/clear-submissions", (req, res) => clearSubmissionsHandler(req as RequestWithSession, res));
app.get("/api/events", (req, res) => eventsHandler(req as RequestWithSession, res));

const server = createServer(app);

server.listen(PORT, () => {
  console.log(`Local development server running on http://localhost:${PORT}`);
});