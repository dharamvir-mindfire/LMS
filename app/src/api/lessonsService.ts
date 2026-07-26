import client from './client';
import type {Lesson, LessonListItem} from '../types';

export function getLessons(subjectId: string) {
  return client
    .get<{lessons: LessonListItem[]}>('/lessons', {params: {subject: subjectId}})
    .then(res => res.data.lessons);
}

export function getLesson(lessonId: string) {
  return client.get<{lesson: Lesson}>(`/lessons/${lessonId}`).then(res => res.data.lesson);
}
