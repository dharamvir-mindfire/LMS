import client from './client';
import type { Subject } from '../types';

export async function listSubjects(): Promise<Subject[]> {
  const res = await client.get('/subjects');
  return res.data.subjects;
}

export async function createSubject(course: string, name: string, description: string): Promise<Subject> {
  const res = await client.post('/subjects', { course, name, description });
  return res.data.subject;
}

export async function updateSubject(
  id: string,
  course: string,
  name: string,
  description: string
): Promise<Subject> {
  const res = await client.put(`/subjects/${id}`, { course, name, description });
  return res.data.subject;
}

export async function deleteSubject(id: string): Promise<void> {
  await client.delete(`/subjects/${id}`);
}
