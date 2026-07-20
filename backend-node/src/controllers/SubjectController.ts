import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Subject from "../models/Subject";
import Question from "../models/Question";

export async function listSubjects(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.course) filter.course = req.query.course;

  const subjects = await Subject.find(filter).populate("course", "title").sort({ name: 1 });
  res.json({ subjects });
}

export async function getSubject(req: Request, res: Response): Promise<void> {
  const subject = await Subject.findById(req.params.id).populate("course", "title");
  if (!subject) {
    res.status(404).json({ message: "Subject not found" });
    return;
  }
  res.json({ subject });
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { course, name, description } = req.body as {
    course: string;
    name: string;
    description?: string;
  };
  const subject = await Subject.create({ course, name, description });
  res.status(201).json({ subject });
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    res.status(404).json({ message: "Subject not found" });
    return;
  }

  const { course, name, description } = req.body as {
    course?: string;
    name?: string;
    description?: string;
  };
  if (course !== undefined) subject.course = course as unknown as typeof subject.course;
  if (name !== undefined) subject.name = name;
  if (description !== undefined) subject.description = description;
  await subject.save();
  res.json({ subject });
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    res.status(404).json({ message: "Subject not found" });
    return;
  }

  const hasQuestions = await Question.exists({ subject: subject._id });
  if (hasQuestions) {
    res.status(409).json({ message: "Delete this subject's questions first" });
    return;
  }

  await subject.deleteOne();
  res.status(204).send();
}
