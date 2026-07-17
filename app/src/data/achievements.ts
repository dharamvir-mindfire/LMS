export interface Achievement {
  id: string;
  title: string;
  description: string;
  minQuestionsAnswered: number;
}

export const achievements: Achievement[] = [
  {id: 'first-steps', title: 'First Steps', description: 'Answer your first question.', minQuestionsAnswered: 1},
  {id: 'getting-started', title: 'Getting Started', description: 'Answer 10 questions.', minQuestionsAnswered: 10},
  {id: 'quiz-regular', title: 'Quiz Regular', description: 'Answer 50 questions.', minQuestionsAnswered: 50},
  {id: 'quiz-master', title: 'Quiz Master', description: 'Answer 100 questions.', minQuestionsAnswered: 100},
];
