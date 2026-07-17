import { Request, Response } from "express";
import { validationResult } from "express-validator";
import User, { UserRole } from "../models/User";

export async function listUsers(req: Request, res: Response): Promise<void> {
  const users = await User.find().select("-password");
  res.json({ users });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { role } = req.body as { role: UserRole };
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  user.role = role;
  await user.save();
  res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  await user.deleteOne();
  res.status(204).send();
}
