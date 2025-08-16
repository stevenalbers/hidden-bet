// api/_lib/types.ts
import { VercelRequest } from '@vercel/node';
import { Session } from 'express-session';

export interface RequestWithSession extends VercelRequest {
  session?: Session & {
    id?: string;
  };
}