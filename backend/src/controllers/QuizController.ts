import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Quiz from "../models/Quiz";
import Question, { IQuestion } from "../models/Question";
import User from "../models/User";

export async function listQuizzes(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.subject) filter.subject = req.query.subject;

  const quizzes = await Quiz.find(filter).populate("subject", "name slug").sort({ createdAt: -1 });
  res.json({ quizzes });
}

export async function getQuiz(req: Request, res: Response): Promise<void> {
  const quiz = await Quiz.findById(req.params.id).populate("subject", "name slug").populate("questions");
  if (!quiz) {
    res.status(404).json({ message: "Quiz not found" });
    return;
  }
  res.json({ quiz });
}

export async function createQuiz(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const { title, subject, questions } = req.body as { title: string; subject: string; questions: string[] };
  const quiz = await Quiz.create({ title, subject, questions, createdBy: req.user!.id });
  res.status(201).json({ quiz });
}

export async function updateQuiz(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404).json({ message: "Quiz not found" });
    return;
  }

  const { title, subject, questions } = req.body as {
    title?: string;
    subject?: string;
    questions?: string[];
  };
  if (title !== undefined) quiz.title = title;
  if (subject !== undefined) quiz.subject = subject as unknown as typeof quiz.subject;
  if (questions !== undefined) quiz.questions = questions as unknown as typeof quiz.questions;
  await quiz.save();
  res.json({ quiz });
}

export async function deleteQuiz(req: Request, res: Response): Promise<void> {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404).json({ message: "Quiz not found" });
    return;
  }
  await quiz.deleteOne();
  res.status(204).send();
}

export async function startQuiz(req: Request, res: Response): Promise<void> {
  const quiz = await Quiz.findById(req.params.id).populate<{ questions: IQuestion[] }>("questions");
  if (!quiz) {
    res.status(404).json({ message: "Quiz not found" });
    return;
  }

  res.json({
    quiz: {
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      questions: quiz.questions.map((q) => ({
        _id: q._id,
        text: q.text,
        options: q.options,
        difficulty: q.difficulty,
      })),
    },
  });
}

export async function submitQuiz(req: Request, res: Response): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return;
  }

  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    res.status(404).json({ message: "Quiz not found" });
    return;
  }

  const { answers } = req.body as { answers: Array<{ question: string; selectedOptionIndex: number }> };
  const questions = await Question.find({ _id: { $in: answers.map((a) => a.question) } });
  const questionById = new Map(questions.map((q) => [String(q._id), q]));

  let correctCount = 0;
  const results = answers.map((answer) => {
    const question = questionById.get(String(answer.question));
    const isCorrect = !!question && question.correctOptionIndex === answer.selectedOptionIndex;
    if (isCorrect) correctCount += 1;
    return {
      question: answer.question,
      text: question?.text ?? "",
      options: question?.options ?? [],
      correctOptionIndex: question?.correctOptionIndex ?? -1,
      selectedOptionIndex: answer.selectedOptionIndex,
      explanation: question?.explanation ?? "",
      isCorrect,
    };
  });

  await User.findByIdAndUpdate(req.user!.id, { $inc: { questionsAnswered: answers.length } });

  res.json({ score: correctCount, total: answers.length, correctCount, results });
}
