# Produce

Take a photo of a meal you've cooked, get an AI-suggested recipe and nutrition
breakdown, edit anything that's wrong, and save it to your personal meal log.

Built with [Expo](https://expo.dev) (React Native + TypeScript) and
[Expo Router](https://docs.expo.dev/router/introduction/) for navigation.

## Running the app

You don't need Xcode or Android Studio for this — everything runs through the
free **Expo Go** app on your own phone. You'll use **two terminal windows**:
one for the app, one for the AI backend that analyzes your photos.

1. Install dependencies (only needed once, or after pulling new changes):

   ```
   npm install
   ```

2. **One-time:** set up your AI key — see "AI photo analysis" below. You can
   skip this and come back to it later; the app runs fine without it, photo
   analysis just won't work until it's done.

3. In your first terminal window, start the backend:

   ```
   node --env-file=.env backend/server.js
   ```

   Leave this running. It's what talks to the AI model.

4. In a **second** terminal window (same project folder), start the app:

   ```
   npx expo start
   ```

5. A QR code will appear. Open the **Expo Go** app on your phone and scan it
   (iOS: use the Camera app instead, then tap the banner that appears). The
   app loads on your phone and hot-reloads automatically whenever the code
   changes.

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
  - `analyzeMeal.ts` — reads a photo off the phone and sends it to the backend
- `backend/server.js` — a small standalone server that holds the AI API key
  and calls the vision model. Runs separately from the Expo app (see above)
  so the key never ships inside the app itself.

## AI photo analysis (Gemini)

Meal photos are analyzed by Google's Gemini API via `backend/server.js`.
Keeping this in a separate server — rather than calling the AI directly from
the phone app — matters: an API key baked into the app itself could be
extracted by anyone who installs it and used to rack up charges on your
account.

The model defaults to `gemini-flash-latest`, an alias Google keeps pointed at
its current Flash model. To use a specific model instead, add a line like
`GEMINI_MODEL=<model-name>` to `.env` (current names are listed at
[ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)).

### One-time setup

1. Get an API key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   This is a different account from your Expo account. Google offers a free
   tier with usage limits, plus paid usage — check their current pricing
   page, since limits and rates change.
2. In the project folder, copy the example env file:
   ```
   cp .env.example .env
   ```
3. Open `.env` and paste your key in place of `your-key-here`:
   ```
   GEMINI_API_KEY=...
   ```
   `.env` is already git-ignored — it will never be committed or pushed.
4. Start the backend as shown in "Running the app" above. It prints which
   Gemini model it's using. If it also printed
   `WARNING: GEMINI_API_KEY is not set`, the key wasn't picked up — double
   check step 3, then stop (Ctrl+C) and start it again.

That's it — take a photo in the app and it will now be genuinely analyzed.

**If analysis fails** (e.g. the backend isn't running, the key isn't set
yet, or the model name is no longer valid), the app shows an alert explaining
why instead of hanging on the loading screen — check the message it gives
you first, and check that `backend/server.js` is still running in its
terminal window.

### Deploying beyond your own computer

Right now AI analysis only works while `backend/server.js` is running on
your computer, on the same Wi-Fi network as your phone. To make it work for
a build that isn't tethered to your laptop (TestFlight, Play Store, or
friends testing over the internet), deploy `backend/server.js` to a small
Node host (Render, Railway, Fly.io, etc.), set `GEMINI_API_KEY` as a secret
there rather than in a local `.env` file, and set `EXPO_PUBLIC_API_URL` in
the app to that host's URL.

## Publishing an update / building a real app store build

This project currently only runs inside Expo Go for development. When you're
ready to share it beyond your own phone (TestFlight, Play Store, or a
standalone app you can install without Expo Go), look into
[EAS Build](https://docs.expo.dev/build/introduction/) — it uses the same
Expo account you already signed up for.
