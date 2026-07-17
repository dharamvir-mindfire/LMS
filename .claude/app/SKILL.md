---
name: app
description: Naming conventions, folder hierarchy, and code style for the LMS mobile app (React Native + Expo CLI, TypeScript). Use before creating or editing any file under App/, so new screens, components, and context match existing house style.
---

# app conventions (React Native + Expo CLI, managed workflow)

## Folder hierarchy

```
app/
├── app.json           # Expo config (name, slug, platforms)
├── babel.config.js     # babel-preset-expo
├── App.tsx             # top-level app component
└── src/
    ├── api/           # client.ts (axios instance + JWT interceptor), <resource>Service.ts, config.ts (base URL)
    ├── components/    # reusable presentational components
    ├── context/       # AuthContext.tsx and other React Context providers
    ├── data/          # static local data (e.g. achievements definitions)
    ├── navigation/    # RootNavigator, MainTabs, HomeStack, ProfileStack
    ├── screens/       # one file per screen
    ├── theme/         # colors.ts
    ├── types/         # shared TS types (index.ts)
    └── utils/         # extensions.ts and other helpers
```
No committed native `android/`/`ios/` projects — Expo's managed workflow generates
them on demand via `npx expo prebuild` only if/when native code is needed; day-to-day
development runs through `npx expo start` and Expo Go. Tests live in `__tests__/`.

## File naming

- Screens: PascalCase, no suffix, e.g. `QuizPlay.tsx`, `Settings.tsx`.
- Reusable components: PascalCase, no suffix, e.g. `QuestionCard.tsx`, `GradientBackground.tsx`.
- Non-component modules: camelCase, e.g. `client.ts`, `config.ts`, `colors.ts`, `extensions.ts`.

## Code style

- **Components**: `export default function ScreenName({ navigation, route }: Props) { ... }`, where `Props` is typed from React Navigation's param list (e.g. `BottomTabScreenProps<MainTabParamList, 'Quiz'>` or `NativeStackScreenProps<...>`). Default export — this is the opposite of `Web/`'s convention.
- **Styling**: `StyleSheet.create({...})` defined at the bottom of the file, with camelCase keys. Colors always come from `theme/colors.ts` (a flat exported object, e.g. `colors.purple`, `colors.danger`) — never hardcode hex values outside that file.
- **State management**: React Context only, no Redux/Zustand/Bloc. Pattern (see `context/AuthContext.tsx`): `createContext<T | undefined>(undefined)`, a `*Provider` component that memoizes its value with `useMemo`, and a paired `useX()` hook that throws if called outside its provider (`if (!ctx) throw new Error('useAuth must be used within an AuthProvider')`). Local screen state uses `useState`/`useEffect`/`useCallback`/`useRef`.
- **API layer**: a single axios instance in `api/client.ts` with a request interceptor that injects the JWT from `AsyncStorage` (token key exported as `TOKEN_KEY`); always surface request failures through the exported `extractErrorMessage(err, fallback)` helper rather than reading `err.message` directly.
- **Native modules**: prefer Expo SDK packages (`expo-*`) over bare React Native community packages when both exist, so the app stays in the managed workflow without requiring a custom dev client or `expo prebuild`.

## Lint/format

- ESLint: `.eslintrc.js` → `extends: 'expo'` (`eslint-config-expo`).
- Prettier: `.prettierrc.js` → `arrowParens: 'avoid'`, `singleQuote: true`, `trailingComma: 'all'`.
- `tsconfig.json` extends `expo/tsconfig.base`.

## Running the app

`npx expo start` from `App/`, then open in Expo Go (physical device via QR code) or a simulator/emulator (`a`/`i` keys). No native project generation needed for JS-only changes.
