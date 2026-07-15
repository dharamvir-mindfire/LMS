import client from './client';
import type { Course, User, UserRole } from '../types';

export async function listUsers(): Promise<User[]> {
  const res = await client.get('/admin/users');
  return res.data.users;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const res = await client.patch(`/admin/users/${id}/role`, { role });
  return res.data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await client.delete(`/admin/users/${id}`);
}

export async function listAllCourses(): Promise<Course[]> {
  const res = await client.get('/admin/courses');
  return res.data.courses;
}

export async function deleteCourse(id: string): Promise<void> {
  await client.delete(`/admin/courses/${id}`);
}
