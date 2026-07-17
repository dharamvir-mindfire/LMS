import client from './client';
import type { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await client.post('/auth/login', { email, password });
  return res.data;
}

export async function me(): Promise<User> {
  const res = await client.get('/auth/me');
  return res.data.user;
}
