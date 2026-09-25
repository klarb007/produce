// A tiny standalone server that holds the AI API key and analyzes meal
// photos. Run it with: node --env-file=.env backend/server.js
// (see the "AI photo analysis" section of the README for setup).
const http = require('http');
const { GoogleGenAI, ApiError } = require('@google/genai');

const PORT = process.env.PORT || 3001;

// "gemini-flash-latest" is an alias Google keeps pointed at its current Flash
// model, so it shouldn't go stale the way a pinned model name can. To use a
// specific model instead, set GEMINI_MODEL in .env.
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const SYSTEM_PROMPT = [
  'You analyze a photo of a home-cooked meal for a cooking app.',
  'Respond with ONLY a single JSON object - no markdown, no code fences, no extra commentary - matching exactly this shape:',
  '{"title": string, "macros": {"calories": number, "proteinGrams": number, "carbsGrams": number, "fatGrams": number}, "recipe": string}',
  'Estimate a reasonable single-serving nutrition breakdown from what you see.',
  '"recipe" should be a short numbered recipe (3-6 steps) for making the dish shown, as plain text with newlines between steps.',
  'If the photo does not clearly look like food, still return your best guess at this JSON shape instead of an error.',
].join(' ');

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    request.on('data', (chunk) => {
      data += chunk;
    });
    request.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(JSON.stringify(body));
}

async function handleAnalyzeMeal(request, response) {
  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return sendJson(response, 400, { error: 'Invalid JSON body' });
  }

  const { imageBase64, mediaType } = body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return sendJson(response, 400, { error: 'Missing imageBase64' });
  }
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return sendJson(response, 400, { error: `mediaType must be one of ${ALLOWED_MEDIA_TYPES.join(', ')}` });
  }
  if (!process.env.GEMINI_API_KEY) {
    return sendJson(response, 500, {
      error: 'Server is missing GEMINI_API_KEY. Add it to .env and restart with: node --env-file=.env backend/server.js',
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let aiResponse;
  try {
    aiResponse = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType: mediaType, data: imageBase64 } }, { text: 'Analyze this meal.' }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Gemini API error ${error.status}: ${error.message}`);
      if (error.status === 404) {
        return sendJson(response, 502, {
          error: `Gemini model "${MODEL}" not found. Set GEMINI_MODEL in .env to a current model from https://ai.google.dev/gemini-api/docs/models`,
        });
      }
      if (error.status === 429) {
        return sendJson(response, 429, { error: 'Rate limited by Gemini - try again shortly.' });
      }
      if (/API.?key/i.test(error.message)) {
        return sendJson(response, 500, { error: 'Invalid GEMINI_API_KEY.' });
      }
      return sendJson(response, 502, { error: `AI provider error: ${error.message}` });
    }
    console.error(error);
    return sendJson(response, 500, { error: 'Unexpected server error.' });
  }

  const raw = aiResponse.text ?? '';
  const jsonText = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();

  try {
    const parsed = JSON.parse(jsonText);
    return sendJson(response, 200, parsed);
  } catch {
    return sendJson(response, 502, { error: 'Could not parse the AI response as JSON.', raw });
  }
}

const server = http.createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return response.end();
  }

  if (request.method === 'POST' && request.url === '/analyze-meal') {
    return handleAnalyzeMeal(request, response);
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Produce backend listening on http://localhost:${PORT}`);
  console.log(`Using Gemini model: ${MODEL}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set - meal analysis will fail until it is.');
  }
});
