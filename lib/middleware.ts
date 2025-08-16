// api/_lib/middleware.ts
import type { VercelResponse } from "@vercel/node";
import type { RequestWithSession } from "./types";
import session from "express-session";
import cors from "cors";

export async function sessionMiddleware(req: RequestWithSession, res: VercelResponse) {
  return new Promise<void>((resolve, reject) => {
    try {
      const middleware = session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: process.env.NODE_ENV === "production",
          sameSite: "none",
        },
      });

      const corsMiddleware = cors({
        origin: true,
        credentials: true,
      });

      corsMiddleware(req, res, (err) => {
        if (err) {
          console.error("CORS middleware error:", err);
          return reject(err);
        }
        middleware(req as any, res as any, (err) => {
          if (err) {
            console.error("Session middleware error:", err);
            return reject(err);
          }
          resolve();
        });
      });
    } catch (error) {
      console.error("Middleware setup error:", error);
      reject(error);
    }
  });
}
