import {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {TOKEN_KEY} from '../api/client';
import * as authService from '../api/authService';
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
      setUser(await authService.getMe());
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
        setUser(await authService.getMe());
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function login(email: string, password: string) {
    const {token, user: loggedInUser} = await authService.login(email, password);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function sendOtp(email: string) {
    await authService.sendOtp(email);
  }

  async function loginWithOtp(email: string, otp: string) {
    const {token, user: loggedInUser} = await authService.verifyOtp(email, otp);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function updateProfile(name: string) {
    const updatedUser = await authService.updateProfile(name);
    setUser(updatedUser);
    return updatedUser;
  }

  async function updatePassword(newPassword: string, currentPassword?: string) {
    const updatedUser = await authService.updatePassword(newPassword, currentPassword);
    setUser(updatedUser);
    return updatedUser;
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
