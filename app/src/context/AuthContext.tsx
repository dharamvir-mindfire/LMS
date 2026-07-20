import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, {TOKEN_KEY} from '../api/client';
import type {User} from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  sendOtp: (email: string) => Promise<void>;
  loginWithOtp: (email: string, otp: string) => Promise<User>;
  updateProfile: (name: string) => Promise<User>;
  updatePassword: (newPassword: string, currentPassword?: string) => Promise<User>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    try {
      const res = await client.get('/auth/me');
      setUser(res.data.user);
    } catch {
      // ignore — keep whatever user state is currently in memory
    }
  }

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then(async token => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await client.get('/auth/me');
        setUser(res.data.user);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await client.post('/auth/login', {email, password});
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user as User;
  }

  async function sendOtp(email: string) {
    await client.post('/auth/send-otp', {email});
  }

  async function loginWithOtp(email: string, otp: string) {
    const res = await client.post('/auth/verify-otp', {email, otp});
    await AsyncStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user as User;
  }

  async function updateProfile(name: string) {
    const res = await client.patch('/auth/profile', {name});
    setUser(res.data.user);
    return res.data.user as User;
  }

  async function updatePassword(newPassword: string, currentPassword?: string) {
    const res = await client.put('/auth/password', {newPassword, currentPassword});
    setUser(res.data.user);
    return res.data.user as User;
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({user, loading, login, sendOtp, loginWithOtp, updateProfile, updatePassword, refreshUser, logout}),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
