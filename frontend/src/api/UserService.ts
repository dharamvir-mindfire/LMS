import client from './client';
import type { User, UserRole } from '../types';

export async function listUsers(): Promise<User[]> {
  const res = await client.get('/users');
  return res.data.users;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User> {
  const res = await client.patch(`/users/${id}/role`, { role });
  return res.data.user;
}

export async function deleteUser(id: string): Promise<void> {
  await client.delete(`/users/${id}`);
}
