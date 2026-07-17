import { Request, Response } from "express";
import Course from "../models/Course";
import Subject from "../models/Subject";
import Quiz from "../models/Quiz";
import User from "../models/User";

export async function getHomeStats(req: Request, res: Response): Promise<void> {
  const [courseCount, subjectCount, quizCount, user] = await Promise.all([
    Course.countDocuments(),
    Subject.countDocuments(),
    Quiz.countDocuments(),
    User.findById(req.user!.id).select("questionsAnswered"),
  ]);

  res.json({
    stats: {
      courses: courseCount,
      subjects: subjectCount,
      quizzes: quizCount,
      questionsAnswered: user?.questionsAnswered ?? 0,
    },
  });
}
