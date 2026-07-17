import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validationResult } from "express-validator";
import User, { IUser } from "../models/User";
import { generateToken } from "../utils/GenerateToken";

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

function serializeUser(user: IUser) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    questionsAnswered: user.questionsAnswered,
    hasPassword: user.hasPassword,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { name, email, password } = req.body as { name: string; email: string; password: string };

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role: "user" });

  const token = generateToken(user);
  res.status(201).json({
    token,
    user: serializeUser(user),
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: serializeUser(user),
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id).select("-password");
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ user });
}

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { email } = req.body as { email: string };
  const normalizedEmail = email.toLowerCase();

  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
    user = await User.create({
      name: normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: randomPassword,
      hasPassword: false,
      role: "user",
    });
  }

  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  user.otpCode = otpCode;
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.otpAttempts = 0;
  await user.save();

  console.log(`OTP for ${user.email}: ${otpCode}`);
  res.json({ message: "OTP sent" });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { email, otp } = req.body as { email: string; otp: string };
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+otpCode +otpExpiresAt +otpAttempts"
  );
  if (!user || !user.otpCode || !user.otpExpiresAt) {
    res.status(400).json({ message: "Invalid or expired OTP" });
    return;
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    res.status(429).json({ message: "Too many attempts. Request a new OTP" });
    return;
  }

  if (user.otpCode !== otp || user.otpExpiresAt.getTime() < Date.now()) {
    user.otpAttempts += 1;
    await user.save();
    res.status(400).json({ message: "Invalid or expired OTP" });
    return;
  }

  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();

  const token = generateToken(user);
  res.json({
    token,
    user: serializeUser(user),
  });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { name } = req.body as { name: string };
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.name = name;
  await user.save();
  res.json({ user: serializeUser(user) });
}

export async function updatePassword(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword: string };
  const user = await User.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.hasPassword) {
    if (!currentPassword) {
      res.status(400).json({ message: "Current password is required" });
      return;
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.hasPassword = true;
  await user.save();
  res.json({ user: serializeUser(user) });
}
