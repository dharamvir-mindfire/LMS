import {Platform} from 'react-native';

declare const process: { env: { EXPO_PUBLIC_API_URL?: string } } | undefined;

export const API_BASE_URL =
  Platform.OS === 'web'
    ? (process?.env?.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api')
    : 'http://192.168.1.2:5000/api';
