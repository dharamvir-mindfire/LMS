export type UserRole = 'admin' | 'user';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  questionsAnswered?: number;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
}

export interface Subject {
  _id: string;
  course: { _id: string; title: string } | string;
  name: string;
  slug: string;
  description?: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  _id: string;
  subject: { _id: string; name: string; slug: string } | string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  explanation?: string;
}

export interface Quiz {
  _id: string;
  title: string;
  subjects: Array<{ _id: string; name: string; slug: string } | string>;
  questions: string[];
  createdBy?: string;
}
