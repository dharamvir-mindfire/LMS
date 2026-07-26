# LMS mobile app

React Native (Expo, managed workflow) client for the LMS quiz platform, talking to the same API as `backend/`.

## Setup

```
cd app
npm install
npx expo start
```

Then press `a` for Android, `i` for iOS, or scan the QR code with the
[Expo Go](https://expo.dev/go) app on a physical device. Native `android/`/`ios/`
projects are generated on demand only (`npx expo prebuild`) and aren't committed —
the managed workflow doesn't need them for day-to-day development.

## API base URL

Set in `src/api/config.ts`. Defaults to `http://localhost:5000/api`, which
works for iOS simulators; Android emulators need `http://10.0.2.2:5000/api`,
and Expo Go on a physical device needs your machine's LAN IP (shown in the
terminal when you run `npx expo start`).
