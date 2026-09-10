# Produce

Take a photo of a meal you've cooked, get an AI-suggested recipe and nutrition
breakdown, edit anything that's wrong, and save it to your personal meal log.

Built with [Expo](https://expo.dev) (React Native + TypeScript) and
[Expo Router](https://docs.expo.dev/router/introduction/) for navigation.

## Running the app

You don't need Xcode or Android Studio for this — everything runs through the
free **Expo Go** app on your own phone.

1. Install dependencies (only needed once, or after pulling new changes):

   ```
   npm install
   ```

2. Start the dev server:

   ```
   npx expo start
   ```

3. A QR code will appear in the terminal. Open the **Expo Go** app on your
   phone and scan it (iOS: use the Camera app instead, then tap the banner
   that appears). The app will load on your phone, and it will hot-reload
   automatically whenever the code changes.

To run it in a browser instead: `npx expo start --web`.

## How the app is organized

- `app/` — screens, using file-based routing (Expo Router). Each file is a screen.
  - `index.tsx` — the meal log / home screen
  - `add-meal.tsx` — take a photo or pick one from your library
  - `result.tsx` — shows the analysis (or an existing saved meal) with editable
    fields, plus Save/Delete
  - `_layout.tsx` — shared navigation shell (the header bar / stack)
- `lib/` — app logic, no UI:
  - `types.ts` — the `Meal` and `Macros` data shapes
  - `mealsStore.ts` — saves/loads meals from on-device storage (AsyncStorage)
  - `analyzeMeal.ts` — **currently a mock/placeholder** (see below)

## Connecting a real AI model (next step)

Right now `lib/analyzeMeal.ts` returns fake but realistic-looking data so the
whole app works end-to-end without any setup. To make the analysis real:

1. **Do not** call an AI vision API (e.g. Anthropic's Claude API) directly
   from the phone app with an API key baked in — anyone who installs the app
   could extract that key and rack up charges on your account.
2. Instead, stand up a small backend (a single serverless function is enough
   — e.g. on Vercel, Cloudflare Workers, or a tiny Node server) that:
   - accepts a photo upload from the app,
   - sends it to a vision-capable AI model asking it to return the meal's
     name, estimated macros, and a suggested recipe as structured JSON,
   - returns that JSON to the app.
3. Update `analyzeMeal()` in `lib/analyzeMeal.ts` to `fetch()` your backend
   instead of returning mock data. No other file needs to change — every
   screen already calls this one function and expects this shape back.

## Publishing an update / building a real app store build

This project currently only runs inside Expo Go for development. When you're
ready to share it beyond your own phone (TestFlight, Play Store, or a
standalone app you can install without Expo Go), look into
[EAS Build](https://docs.expo.dev/build/introduction/) — it uses the same
Expo account you already signed up for.
