import client from './client';
import type { Difficulty, Question } from '../types';

export async function listQuestions(): Promise<Question[]> {
  const res = await client.get('/questions');
  return res.data.questions;
}

export interface QuestionInput {
  subject: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  explanation?: string;
}

export async function createQuestion(input: QuestionInput): Promise<Question> {
  const res = await client.post('/questions', input);
  return res.data.question;
}

export async function updateQuestion(id: string, input: QuestionInput): Promise<Question> {
  const res = await client.put(`/questions/${id}`, input);
  return res.data.question;
}

export async function deleteQuestion(id: string): Promise<void> {
  await client.delete(`/questions/${id}`);
}
