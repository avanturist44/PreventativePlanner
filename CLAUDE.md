# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
expo start          # Start dev server (opens Expo Go QR code)
expo start --ios    # Run on iOS simulator
expo start --android # Run on Android emulator
expo start --web    # Run in browser
expo lint           # Run ESLint
```

No test framework is configured.

## Environment

Requires a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Architecture

React Native + Expo app for preventative health care tracking. Uses Expo Router (file-based routing), Supabase for auth/backend, and AsyncStorage for local data.

**Authentication flow:** Root [_layout.tsx](app/_layout.tsx) checks auth state via `useAuth()`. Unauthenticated users see [AuthPage.tsx](app/AuthPage.tsx). On login, Expo Router routes to the tab navigator.

**Core data flow:**
1. User fills out health profile in [profile.tsx](app/(tabs)/profile.tsx) → saved to AsyncStorage under key `health_profile`
2. Home screen [index.tsx](app/(tabs)/index.tsx) loads the profile from AsyncStorage and calls the recommendation engine
3. [recommendationEngine.ts](app/services/recommendationEngine.ts) applies rule-based logic (age, sex, risk factors) to return `Recommendation[]`
4. Recommendations render as animated cards; users can mark them complete/incomplete (with haptic feedback)

**State management:** No Redux or Context API. Auth state lives in `useAuth()` hook backed by Supabase session. All other state is local `useState`/`useEffect` with AsyncStorage for persistence.

**Styling:** React Native `StyleSheet.create` throughout — no CSS framework. Color palette defined in [constants/colors.ts](constants/colors.ts) (primary: `#2563EB`). Light/dark theme support via `useColorScheme` hook with platform-specific `.web.ts` override.

**Navigation:** Two tabs (Home/Planner and Profile). Stack navigator at root with modal support. Typed routes enabled.

## Key Conventions

- Path alias `@` maps to the repo root (e.g., `@/constants/colors`)
- Component filenames: kebab-case (`themed-text.tsx`, `haptic-tab.tsx`)
- Hooks prefixed with `use`, live in [hooks/](hooks/)
- Platform-specific files use `.web.ts` suffix for web overrides
- `Recommendation` and `UserProfile` types are defined in [recommendationEngine.ts](app/services/recommendationEngine.ts)
- Database/storage field names: snake_case

## Expo Config Notes

- New Architecture enabled
- React Compiler enabled (experimental)
- Typed Routes enabled (experimental)
- iOS: tablet support enabled; Android: edge-to-edge enabled; Web: static output
