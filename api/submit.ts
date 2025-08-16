// api/submit.ts
import type { VercelResponse } from "@vercel/node";
import type { RequestWithSession } from "./_lib/types";
import { getRedisClient } from "./_lib/redis";
import { sessionMiddleware } from "./_lib/middleware";

export default async function handler(req: RequestWithSession, res: VercelResponse) {
  await sessionMiddleware(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const redis = getRedisClient();
  if (!req.session) return res.status(500).json({ error: "No session" });

  const { text } = req.body;

  await redis.hset("submissions", req.session.id, text);
  await redis.set("lastSubmitter", req.session.id);

  res.json({ success: true });
}
