// api/my-submission.ts
import type { VercelResponse } from "@vercel/node";
import type { RequestWithSession } from "./_lib/types";
import { getRedisClient } from "./_lib/redis";
import { sessionMiddleware } from "./_lib/middleware";

export default async function handler(req: RequestWithSession, res: VercelResponse) {
  await sessionMiddleware(req, res);

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const redis = getRedisClient();
  if (!req.session) return res.status(500).json({ error: "No session" });

  const text = redis ? await redis.hget("submissions", req.session.id) : null;

  res.json({ text: text || null });
}
