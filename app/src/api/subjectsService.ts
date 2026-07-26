import client from './client';
import type {Subject} from '../types';

export function getSubjects(courseId: string) {
  return client
    .get<{subjects: Subject[]}>('/subjects', {params: {course: courseId}})
    .then(res => res.data.subjects);
}
