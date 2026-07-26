import client from './client';
import type {Course} from '../types';

export function getCourses() {
  return client.get<{courses: Course[]}>('/courses').then(res => res.data.courses);
}
