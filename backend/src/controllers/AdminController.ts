import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const users = await User.find().select('-password');
  res.json({
    users: users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role })),
  });
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { role } = req.body as { role?: UserRole };
  if (!role || !['admin', 'instructor', 'student'].includes(role)) {
    res.status(400).json({ message: 'A valid role is required' });
    return;
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  user.role = role;
  await user.save();
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  await user.deleteOne();
  res.status(204).send();
}

export async function listAllCourses(req: Request, res: Response): Promise<void> {
  const courses = await Course.find().populate('instructor', 'name email');
  res.json({ courses });
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }
  await course.deleteOne();
  await Enrollment.deleteMany({ course: course._id });
  res.status(204).send();
}
