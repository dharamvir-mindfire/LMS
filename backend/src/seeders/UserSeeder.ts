import "../config/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db";
import User, { IUser } from "../models/User";

async function upsertUser(name: string, email: string, password: string, role: IUser["role"]): Promise<IUser> {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists, skipping: ${email}`);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });
  console.log(`Created user: ${email} (${role})`);
  return user;
}

async function seed(): Promise<void> {
  await connectDB();

  await upsertUser("Admin", "admin@admin.com", "Admin@123", "admin");
  await upsertUser("Demo User", "user@example.com", "User@123", "user");

  console.log("\nSeed data ready. Login with:");
  console.log("  Admin: admin@admin.com / Admin@123");
  console.log("  User:  user@example.com / User@123");

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exit(1);
  });
