import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Macros } from './types';

export type MealAnalysis = {
  title: string;
  macros: Macros;
  recipe: string;
};

/**
 * The AI analysis itself runs in the separate backend/server.js process
 * (so the API key never ships inside the app). This function's only job is
 * to read the photo off disk and send it there. See the README's "AI photo
 * analysis" section for how to start that server.
 */

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // In Expo Go, the dev server's LAN address is exposed here - the backend
  // runs on the same machine, on port 3001.
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:3001`;
}

function mediaTypeFromUri(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function analyzeMeal(photoUri: string): Promise<MealAnalysis> {
  const imageBase64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${getApiBaseUrl()}/analyze-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType: mediaTypeFromUri(photoUri) }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Meal analysis failed (status ${response.status}).`);
  }

  return response.json();
}
