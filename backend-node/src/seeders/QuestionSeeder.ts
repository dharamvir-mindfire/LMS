import "../config/env";
import mongoose from "mongoose";
import connectDB from "../config/db";
import User from "../models/User";
import Course, { ICourse } from "../models/Course";
import Subject, { ISubject } from "../models/Subject";
import Question, { IQuestion } from "../models/Question";
import Quiz from "../models/Quiz";

async function upsertCourse(title: string, description: string): Promise<ICourse> {
  const existing = await Course.findOne({ title });
  if (existing) return existing;
  const course = await Course.create({ title, description });
  console.log(`Created course: ${course.title}`);
  return course;
}

async function upsertSubject(course: ICourse, name: string, description: string): Promise<ISubject> {
  const existing = await Subject.findOne({ name });
  if (existing) return existing;
  const subject = await Subject.create({ course: course._id, name, description });
  console.log(`Created subject: ${subject.name}`);
  return subject;
}

async function upsertQuestion(
  subject: ISubject,
  text: string,
  options: string[],
  correctOptionIndex: number,
  difficulty: IQuestion["difficulty"]
): Promise<IQuestion> {
  const existing = await Question.findOne({ subject: subject._id, text });
  if (existing) return existing;
  const question = await Question.create({ subject: subject._id, text, options, correctOptionIndex, difficulty });
  console.log(`Created question: ${question.text}`);
  return question;
}

async function seed(): Promise<void> {
  await connectDB();

  const admin = await User.findOne({ email: "admin@admin.com" });
  if (!admin) {
    throw new Error("Run the user seeder first: npm run seed:users");
  }

  const jsCourse = await upsertCourse("Web Development", "Front-end and back-end web fundamentals.");
  const mathCourse = await upsertCourse("Mathematics", "Core math skills.");

  const javascript = await upsertSubject(jsCourse, "JavaScript", "The language of the web.");
  const generalKnowledge = await upsertSubject(mathCourse, "General Knowledge", "Everyday facts and trivia.");

  const javascriptQuestions = await Promise.all([
    upsertQuestion(javascript, "Which keyword declares a block-scoped variable?", ["var", "let", "function", "class"], 1, "easy"),
    upsertQuestion(javascript, "What does '===' check that '==' does not?", ["Value only", "Type and value", "Nothing", "Reference only"], 1, "medium"),
    upsertQuestion(javascript, "Which method converts JSON text into an object?", ["JSON.stringify", "JSON.parse", "JSON.object", "JSON.toObject"], 1, "easy"),
    upsertQuestion(javascript, "What is the output of typeof NaN?", ["'nan'", "'undefined'", "'number'", "'object'"], 2, "hard"),
  ]);

  const generalQuestions = await Promise.all([
    upsertQuestion(generalKnowledge, "What is the capital of France?", ["Berlin", "Madrid", "Paris", "Rome"], 2, "easy"),
    upsertQuestion(generalKnowledge, "How many continents are there on Earth?", ["5", "6", "7", "8"], 2, "easy"),
    upsertQuestion(generalKnowledge, "What is the largest planet in our solar system?", ["Earth", "Jupiter", "Saturn", "Mars"], 1, "medium"),
    upsertQuestion(generalKnowledge, "Which gas do plants primarily absorb from the atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "medium"),
  ]);

  const quizzes = [
    { title: "JavaScript Basics", subject: javascript, questions: javascriptQuestions },
    { title: "General Knowledge Quiz", subject: generalKnowledge, questions: generalQuestions },
  ];

  for (const quiz of quizzes) {
    const existing = await Quiz.findOne({ title: quiz.title });
    if (existing) continue;
    await Quiz.create({
      title: quiz.title,
      subjects: [quiz.subject._id],
      questions: quiz.questions.map((q) => q._id),
      createdBy: admin._id,
    });
    console.log(`Created quiz: ${quiz.title}`);
  }

  console.log("\nSeed data ready: 2 courses, 2 subjects, 8 questions, 2 quizzes.");

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed", err);
    process.exit(1);
  });
