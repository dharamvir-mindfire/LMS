import client from './client';
import type { Course } from '../types';

export async function listCourses(): Promise<Course[]> {
  const res = await client.get('/courses');
  return res.data.courses;
}

export async function createCourse(title: string, description: string): Promise<Course> {
  const res = await client.post('/courses', { title, description });
  return res.data.course;
}

export async function updateCourse(id: string, title: string, description: string): Promise<Course> {
  const res = await client.put(`/courses/${id}`, { title, description });
  return res.data.course;
}

export async function deleteCourse(id: string): Promise<void> {
  await client.delete(`/courses/${id}`);
}
