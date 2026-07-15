export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Lesson {
  _id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  order?: number;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  instructor: { _id: string; name: string; email: string };
  lessons: Lesson[];
  students: string[];
  published: boolean;
}
