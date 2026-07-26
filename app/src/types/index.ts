export type UserRole = 'admin' | 'user';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  questionsAnswered: number;
  hasPassword: boolean;
}

export interface HomeStats {
  courses: number;
  subjects: number;
  lessons: number;
  quizzes: number;
  questionsAnswered: number;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
}

export interface SubjectSummary {
  _id: string;
  name: string;
  slug: string;
}

export interface Subject extends SubjectSummary {
  course: string;
  description?: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  _id: string;
  subject: string;
  text: string;
  options: string[];
  difficulty: Difficulty;
}

// Shape returned by GET /quizzes (subjects populated, questions are just ids)
export interface QuizListItem {
  _id: string;
  title: string;
  subjects: SubjectSummary[];
  questions: string[];
}

// Shape returned by POST /quizzes/:id/start (questions populated, subjects are just ids)
export interface QuizSession {
  _id: string;
  title: string;
  subjects: string[];
  questions: Question[];
}

// One entry in the breakdown returned by POST /quizzes/:id/submit
export interface QuizResultQuestion {
  question: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  selectedOptionIndex: number;
  explanation: string;
  isCorrect: boolean;
}

export interface LessonMaterial {
  title: string;
  url: string;
}

// Shape returned by GET /lessons
export interface LessonListItem {
  _id: string;
  subject: SubjectSummary;
  title: string;
  order: number;
}

// Shape returned by GET /lessons/:id
export interface Lesson extends LessonListItem {
  content: string;
  videoUrl: string;
  materials: LessonMaterial[];
}
