import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

export async function listCourses(req: Request, res: Response): Promise<void> {
  const filter = req.user?.role === 'instructor' ? { instructor: req.user.id } : { published: true };
  const courses = await Course.find(filter).populate('instructor', 'name email');
  res.json({ courses });
}

export async function getCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id).populate('instructor', 'name email');
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }
  res.json({ course });
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  const { title, description } = req.body as { title?: string; description?: string };
  if (!title) {
    res.status(400).json({ message: 'title is required' });
    return;
  }
  const course = await Course.create({ title, description, instructor: req.user!.id });
  res.status(201).json({ course });
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }
  if (String(course.instructor) !== req.user!.id) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const { title, description, published, lessons } = req.body as {
    title?: string;
    description?: string;
    published?: boolean;
    lessons?: typeof course.lessons;
  };
  if (title !== undefined) course.title = title;
  if (description !== undefined) course.description = description;
  if (published !== undefined) course.published = published;
  if (lessons !== undefined) course.lessons = lessons;

  await course.save();
  res.json({ course });
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }
  if (String(course.instructor) !== req.user!.id) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  await course.deleteOne();
  await Enrollment.deleteMany({ course: course._id });
  res.status(204).send();
}

export async function enroll(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course || !course.published) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  const existing = await Enrollment.findOne({ student: req.user!.id, course: course._id });
  if (existing) {
    res.status(409).json({ message: 'Already enrolled' });
    return;
  }

  const enrollment = await Enrollment.create({ student: req.user!.id, course: course._id });
  course.students.push(new Types.ObjectId(req.user!.id));
  await course.save();

  res.status(201).json({ enrollment });
}
