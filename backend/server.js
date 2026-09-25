// A tiny standalone server that holds the AI API key and analyzes meal
// photos. Run it with: node --env-file=.env backend/server.js
// (see the "AI photo analysis" section of the README for setup).
const http = require('http');
const Groq = require('groq-sdk');

const PORT = process.env.PORT || 3001;

// Vision-capable model on Groq. Groq's model lineup changes over time -
// if this stops working, check https://console.groq.com/docs/models for a
// current model marked "vision" and swap it in here.
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

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
  if (!process.env.GROQ_API_KEY) {
    return sendJson(response, 500, {
      error: 'Server is missing GROQ_API_KEY. Add it to .env and restart with: node --env-file=.env backend/server.js',
    });
  }

  const client = new Groq();

  let aiResponse;
  try {
    aiResponse = await client.chat.completions.create({
      model: MODEL,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mediaType};base64,${imageBase64}` } },
            { type: 'text', text: 'Analyze this meal.' },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Groq.AuthenticationError) {
      return sendJson(response, 500, { error: 'Invalid GROQ_API_KEY.' });
    }
    if (error instanceof Groq.RateLimitError) {
      return sendJson(response, 429, { error: 'Rate limited by the AI provider - try again shortly.' });
    }
    if (error instanceof Groq.APIError) {
      return sendJson(response, 502, { error: `AI provider error: ${error.message}` });
    }
    console.error(error);
    return sendJson(response, 500, { error: 'Unexpected server error.' });
  }

  const raw = aiResponse.choices[0]?.message?.content ?? '';
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
  if (!process.env.GROQ_API_KEY) {
    console.warn('WARNING: GROQ_API_KEY is not set - meal analysis will fail until it is.');
  }
});
