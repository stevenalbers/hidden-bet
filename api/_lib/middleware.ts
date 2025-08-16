// api/_lib/middleware.ts
import type { VercelResponse } from "@vercel/node";
import type { RequestWithSession } from "./types";
import session from "express-session";
import cors from "cors";

export async function sessionMiddleware(req: RequestWithSession, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    const middleware = session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: process.env.NODE_ENV === "production" },
    });

    const corsMiddleware = cors({
      origin: true,
      credentials: true,
    });

    corsMiddleware(req, res, (err) => {
      middleware(req as any, res as any, (err) => {
        if (err) return reject(err);
        if (err) return reject(err);
        resolve(undefined);
      });
    });
  });
}
