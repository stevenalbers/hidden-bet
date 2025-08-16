// api/clear-submissions.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedisClient } from "../lib/redis";
import { sessionMiddleware } from "../lib/middleware";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await sessionMiddleware(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const redis = getRedisClient();
  await redis.del("submissions", "lastSubmitter");

  res.json({ success: true });
}
