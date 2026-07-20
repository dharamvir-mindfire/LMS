import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Course from "../models/Course";
import Subject from "../models/Subject";

export async function listCourses(req: Request, res: Response): Promise<void> {
  const courses = await Course.find().sort({ title: 1 });
  res.json({ courses });
}

export async function getCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return;
  }
  res.json({ course });
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { title, description } = req.body as { title: string; description?: string };
  const course = await Course.create({ title, description });
  res.status(201).json({ course });
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return;
  }

  const { title, description } = req.body as { title?: string; description?: string };
  if (title !== undefined) course.title = title;
  if (description !== undefined) course.description = description;
  await course.save();
  res.json({ course });
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404).json({ message: "Course not found" });
    return;
  }

  const hasSubjects = await Subject.exists({ course: course._id });
  if (hasSubjects) {
    res.status(409).json({ message: "Delete this course's subjects first" });
    return;
  }

  await course.deleteOne();
  res.status(204).send();
}
