import { Macros } from './types';

export type MealAnalysis = {
  title: string;
  macros: Macros;
  recipe: string;
};

/**
 * PLACEHOLDER analyzer.
 *
 * This returns believable-looking mock data so the app works end-to-end
 * without any API keys or backend. To make this real:
 *
 *   1. Stand up a small server (or a Vercel/Cloudflare function) that holds
 *      an AI vision API key (e.g. Anthropic's Claude API) - never put an
 *      API key inside the mobile app itself, it would be extractable by
 *      anyone who installs the app.
 *   2. Have that server accept a photo, call the vision model asking it to
 *      return JSON matching `MealAnalysis` (title, macros, recipe).
 *   3. Replace the body of this function with a `fetch()` call to your
 *      server, sending the photo and returning the parsed JSON.
 *
 * Everywhere else in the app (add-meal, result screens) only depends on
 * this function's signature, so swapping the implementation is the only
 * change needed to go from mock data to real AI analysis.
 */
export async function analyzeMeal(photoUri: string): Promise<MealAnalysis> {
  // Simulate network latency so the loading state is visible.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    title: 'Grilled Chicken & Veggie Bowl',
    macros: {
      calories: 520,
      proteinGrams: 42,
      carbsGrams: 45,
      fatGrams: 18,
    },
    recipe: [
      'Suggested recipe (edit anything below before saving):',
      '',
      '1. Season chicken breast with salt, pepper, and paprika; grill 6-7 minutes per side.',
      '2. Roast mixed vegetables (broccoli, bell pepper, carrots) at 425°F for 15 minutes.',
      '3. Cook 1/2 cup rice or quinoa according to package instructions.',
      '4. Slice chicken and plate over the grain with roasted vegetables.',
      '5. Drizzle with olive oil and a squeeze of lemon before serving.',
    ].join('\n'),
  };
}
