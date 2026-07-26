import client from './client';
import type {User} from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export function login(email: string, password: string) {
  return client.post<AuthResponse>('/auth/login', {email, password}).then(res => res.data);
}

export function sendOtp(email: string) {
  return client.post('/auth/send-otp', {email}).then(() => undefined);
}

export function verifyOtp(email: string, otp: string) {
  return client.post<AuthResponse>('/auth/verify-otp', {email, otp}).then(res => res.data);
}

export function getMe() {
  return client.get<{user: User}>('/auth/me').then(res => res.data.user);
}

export function updateProfile(name: string) {
  return client.patch<{user: User}>('/auth/profile', {name}).then(res => res.data.user);
}

export function updatePassword(newPassword: string, currentPassword?: string) {
  return client
    .put<{user: User}>('/auth/password', {newPassword, currentPassword})
    .then(res => res.data.user);
}
