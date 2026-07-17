import client from './client';
import type { Quiz } from '../types';

export async function listQuizzes(): Promise<Quiz[]> {
  const res = await client.get('/quizzes');
  return res.data.quizzes;
}

export async function createQuiz(title: string, subjects: string[], questions: string[]): Promise<Quiz> {
  const res = await client.post('/quizzes', { title, subjects, questions });
  return res.data.quiz;
}

export async function updateQuiz(id: string, title: string, subjects: string[], questions: string[]): Promise<Quiz> {
  const res = await client.put(`/quizzes/${id}`, { title, subjects, questions });
  return res.data.quiz;
}

export async function deleteQuiz(id: string): Promise<void> {
  await client.delete(`/quizzes/${id}`);
}
