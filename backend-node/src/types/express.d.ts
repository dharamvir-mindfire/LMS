import { AuthTokenPayload } from '../middleware/auth';

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
