// api/my-submission.ts
import type { VercelResponse } from "@vercel/node";
import type { RequestWithSession } from "./_lib/types";
import { getRedisClient } from "./_lib/redis";
import { sessionMiddleware } from "./_lib/middleware";

export default async function handler(req: RequestWithSession, res: VercelResponse) {
  try {
    await sessionMiddleware(req, res);

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const redis = getRedisClient();
    if (!redis) {
      console.error('Redis client not initialized');
      return res.status(500).json({ error: "Database connection failed" });
    }

    if (!req.session) {
      console.error('No session found');
      return res.status(500).json({ error: "No session" });
    }

    console.log('Fetching submission for session:', req.session.id);
    
    const text = await redis.hget("submissions", req.session.id);
    console.log('Fetched text:', text);

    return res.json({ text: text || null });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
