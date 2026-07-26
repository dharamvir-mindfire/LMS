import client from './client';
import type { Lesson, LessonMaterial } from '../types';

export async function listLessons(subject?: string): Promise<Lesson[]> {
  const res = await client.get('/lessons', { params: subject ? { subject } : undefined });
  return res.data.lessons;
}

export interface LessonInput {
  subject: string;
  title: string;
  content: string;
  videoUrl: string;
  materials: LessonMaterial[];
  order: number;
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  const res = await client.post('/lessons', input);
  return res.data.lesson;
}

export async function updateLesson(id: string, input: LessonInput): Promise<Lesson> {
  const res = await client.put(`/lessons/${id}`, input);
  return res.data.lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  await client.delete(`/lessons/${id}`);
}
