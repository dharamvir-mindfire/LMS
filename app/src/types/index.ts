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

// Shape returned by GET /quizzes (subject populated, questions are just ids)
export interface QuizListItem {
  _id: string;
  title: string;
  subject: SubjectSummary;
  questions: string[];
}

// Shape returned by POST /quizzes/:id/start (questions populated, subject is just an id)
export interface QuizSession {
  _id: string;
  title: string;
  subject: string;
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
