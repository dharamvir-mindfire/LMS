import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Question from "../models/Question";
import Quiz from "../models/Quiz";
import User from "../models/User";

export async function listQuestions(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;

  const questions = await Question.find(filter).populate("subject", "name slug").sort({ createdAt: -1 });
  res.json({ questions });
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  const question = await Question.findById(req.params.id).populate("subject", "name slug");
  if (!question) {
    res.status(404).json({ message: "Question not found" });
    return;
  }
  res.json({ question });
}

export async function createQuestion(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { subject, text, options, correctOptionIndex, difficulty, explanation } = req.body as {
    subject: string;
    text: string;
    options: string[];
    correctOptionIndex: number;
    difficulty?: string;
    explanation?: string;
  };
  const question = await Question.create({ subject, text, options, correctOptionIndex, difficulty, explanation });
  res.status(201).json({ question });
}

export async function updateQuestion(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404).json({ message: "Question not found" });
    return;
  }

  const { subject, text, options, correctOptionIndex, difficulty, explanation } = req.body as {
    subject?: string;
    text?: string;
    options?: string[];
    correctOptionIndex?: number;
    difficulty?: string;
    explanation?: string;
  };
  if (subject !== undefined) question.subject = subject as unknown as typeof question.subject;
  if (text !== undefined) question.text = text;
  if (options !== undefined) question.options = options;
  if (correctOptionIndex !== undefined) question.correctOptionIndex = correctOptionIndex;
  if (difficulty !== undefined) question.difficulty = difficulty as typeof question.difficulty;
  if (explanation !== undefined) question.explanation = explanation;
  await question.save();
  res.json({ question });
}

export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404).json({ message: "Question not found" });
    return;
  }
  await question.deleteOne();
  await Quiz.updateMany({ questions: question._id }, { $pull: { questions: question._id } });
  res.status(204).send();
}

export async function answerQuestion(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const question = await Question.findById(req.params.id);
  if (!question) {
    res.status(404).json({ message: "Question not found" });
    return;
  }

  const { selectedOptionIndex } = req.body as { selectedOptionIndex: number };
  const correct = selectedOptionIndex === question.correctOptionIndex;

  await User.findByIdAndUpdate(req.user!.id, { $inc: { questionsAnswered: 1 } });

  res.json({ correct, correctOptionIndex: question.correctOptionIndex });
}
