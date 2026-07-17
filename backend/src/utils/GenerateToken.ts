import jwt from "jsonwebtoken";
import { IUser } from "../models/User";
import { AuthTokenPayload } from "../middleware/auth";

export function generateToken(user: IUser): string {
  const payload: AuthTokenPayload = { id: String(user._id), role: user.role, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
}
