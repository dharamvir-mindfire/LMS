import client from './client';
import type {QuizListItem, QuizResultQuestion, QuizSession} from '../types';

export function getQuizzes(subjectId?: string) {
  return client
    .get<{quizzes: QuizListItem[]}>('/quizzes', {params: subjectId ? {subject: subjectId} : undefined})
    .then(res => res.data.quizzes);
}

export function startQuiz(quizId: string) {
  return client.post<{quiz: QuizSession}>(`/quizzes/${quizId}/start`).then(res => res.data.quiz);
}

export interface QuizSubmitAnswer {
  question: string;
  selectedOptionIndex: number;
}

export interface QuizSubmitResult {
  score: number;
  total: number;
  correctCount: number;
  results: QuizResultQuestion[];
}

export function submitQuiz(quizId: string, answers: QuizSubmitAnswer[]) {
  return client.post<QuizSubmitResult>(`/quizzes/${quizId}/submit`, {answers}).then(res => res.data);
}
