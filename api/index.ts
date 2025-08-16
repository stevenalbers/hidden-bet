import express from "express";
import session from "express-session";
import cors from "cors";
import bodyParser from "body-parser";
import Redis from "ioredis";

// In-memory fallback for local development
const inMemoryStore: {
  submissions: { [key: string]: string };
  lastSubmitter: string | null;
  connectedClients: Set<string>;
} = {
  submissions: {},
  lastSubmitter: null,
  connectedClients: new Set(),
};

// Initialize Redis with error handling
let redis: Redis | null = null;
try {
  console.log("redis url:", process.env.REDIS_URL);
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
    console.log("Redis connected successfully");
  } else {
    console.log("No REDIS_URL provided, using in-memory storage");
  }
} catch (error) {
  console.log("Redis connection failed, using in-memory storage:", error);
}

// Helper functions that work with both Redis and in-memory storage
async function getSubmissions() {
  if (redis) {
    const submissions = await redis.hgetall("submissions");
    return Object.keys(submissions).length > 0 ? submissions : null;
  }
  return Object.keys(inMemoryStore.submissions).length > 0 ? inMemoryStore.submissions : null;
}

async function getLastSubmitter() {
  if (redis) {
    return await redis.get("lastSubmitter");
  }
  return inMemoryStore.lastSubmitter;
}

async function clearSubmissions() {
  if (redis) {
    await redis.del("submissions", "lastSubmitter");
  } else {
    inMemoryStore.submissions = {};
    inMemoryStore.lastSubmitter = null;
  }
}

async function allSubmitted() {
  if (redis) {
    const count = await redis.hlen("submissions");
    return count >= 3;
  }
  return Object.keys(inMemoryStore.submissions).length >= 3;
}

// Shared middleware setup
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(bodyParser.json());

// API Routes
app.get("/api/events", async (req, res) => {
  if (!req.session) return res.sendStatus(500);

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const clientId = req.session.id;

  if (redis) {
    await redis.sadd("connected_clients", clientId);
  } else {
    inMemoryStore.connectedClients.add(clientId);
  }

  // Send initial state
  const [submissions, lastSubmitter, isAll] = await Promise.all([getSubmissions(), getLastSubmitter(), allSubmitted()]);

  const data = {
    type: "all-submissions",
    submissions: isAll ? submissions : null,
  };

  if (isAll || clientId === lastSubmitter) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } else {
    res.write(`data: ${JSON.stringify({ ...data, submissions: null })}\n\n`);
  }

  req.on("close", () => {
    if (redis) {
      redis.srem("connected_clients", clientId);
    } else {
      inMemoryStore.connectedClients.delete(clientId);
    }
  });
});

app.get("/api/my-submission", async (req, res) => {
  if (!req.session) return res.sendStatus(500);
  const text = redis ? await redis.hget("submissions", req.session.id) : inMemoryStore.submissions[req.session.id];
  res.json({ text: text || null });
});

app.post("/api/submit", async (req, res) => {
  const { text } = req.body;
  if (!req.session) return res.sendStatus(500);

  if (redis) {
    await redis.hset("submissions", req.session.id, text);
    await redis.set("lastSubmitter", req.session.id);
  } else {
    inMemoryStore.submissions[req.session.id] = text;
    inMemoryStore.lastSubmitter = req.session.id;
  }

  const [submissions, isAll] = await Promise.all([getSubmissions(), allSubmitted()]);

  const connectedClients = redis
    ? await redis.smembers("connected_clients")
    : Array.from(inMemoryStore.connectedClients);

  for (const clientId of connectedClients) {
    if (process.env.NODE_ENV === "development") {
      const data = {
        type: "all-submissions",
        submissions: clientId === req.session?.id || isAll ? submissions : null,
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  res.json({ success: true });
});

app.post("/api/clear-submissions", async (req, res) => {
  await clearSubmissions();

  const connectedClients = redis
    ? await redis.smembers("connected_clients")
    : Array.from(inMemoryStore.connectedClients);

  for (const clientId of connectedClients) {
    if (process.env.NODE_ENV === "development") {
      const data = { type: "clear", clientId };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  res.json({ success: true });
});

export default app;
