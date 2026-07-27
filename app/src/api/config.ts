import {Platform} from 'react-native';

declare const process: {env: {EXPO_PUBLIC_API_URL?: string}};

// A physical device on the same LAN as a locally-running backend can't reach
// it via `localhost` — this fallback only applies when EXPO_PUBLIC_API_URL
// isn't set (i.e. local dev without a .env override), never in a production
// build, which always has EXPO_PUBLIC_API_URL baked in via .env.production.
const DEV_LAN_FALLBACK = 'http://192.168.1.2:5000/api';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:5000/api' : DEV_LAN_FALLBACK);
