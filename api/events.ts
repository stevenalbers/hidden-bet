// api/events.ts
import type { VercelResponse } from "@vercel/node";
import { getRedisClient } from "./_lib/redis";
import { sessionMiddleware } from "./_lib/middleware";
import { RequestWithSession } from "./_lib/types";

export default async function handler(req: RequestWithSession, res: VercelResponse) {
  await sessionMiddleware(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const redis = getRedisClient();
  if (!req.session) return res.status(500).json({ error: "No session" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const clientId = req.session.id;
  await redis.sadd("connected_clients", clientId);

  // Send initial state
  const submissions = await redis.hgetall("submissions");
  const lastSubmitter = await redis.get("lastSubmitter");
  const count = await redis.hlen("submissions");
  const isAll = count >= 3;

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
    redis.srem("connected_clients", clientId);
  });
}
