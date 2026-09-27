import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Pollinations API Key from environment or user-provided configuration
const getPollinationsKey = (): string => {
  return process.env.POLLINATIONS_API_KEY || 'sk_7hxiVgx2Ngtoc3coIgOT3NPPKNzHkc3j';
};

// API: Generate Design Artwork using Pollinations API
app.post('/api/generate-design', async (req, res) => {
  try {
    const { prompt, aspectRatio = '9:16', seed, model = 'flux' } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Determine dimensions based on aspect ratio
    let width = 768;
    let height = 1344; // 9:16 vertical canvas
    if (aspectRatio === '1:1') {
      width = 1024;
      height = 1024;
    } else if (aspectRatio === '3:4') {
      width = 768;
      height = 1024;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    } else if (aspectRatio === '16:9') {
      width = 1344;
      height = 768;
    } else if (aspectRatio === '9:16') {
      width = 768;
      height = 1344;
    }

    const randomSeed =
      seed !== undefined && seed !== null && !isNaN(Number(seed))
        ? Number(seed)
        : Math.floor(Math.random() * 1000000000);

    const cleanPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const apiKey = getPollinationsKey();

    // Build Pollinations API image URL with API key
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${randomSeed}&nologo=true&model=${encodeURIComponent(model)}&key=${encodeURIComponent(apiKey)}`;

    console.log(`[Pollinations API] Generating image: model=${model}, width=${width}, height=${height}, seed=${randomSeed}`);

    // Fetch the image from Pollinations API with Bearer token authentication
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(pollinationsUrl, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (compatible; CaseCraftStudio/1.0)',
        Accept: 'image/jpeg,image/png,image/*;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Pollinations API returned status ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return res.json({
      imageUrl: dataUrl,
      sourceUrl: pollinationsUrl,
      seed: randomSeed,
      width,
      height,
      aspectRatio,
      model,
    });
  } catch (error: any) {
    console.error('Error generating design via Pollinations API:', error);
    const msg = error?.message || 'Failed to generate design with Pollinations API';
    return res.status(500).json({
      error: msg,
      details: error?.toString(),
    });
  }
});

// Fallback curated suggestions per common placeholder tag
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  SUBJECT_POSE: [
    'celestial kitsune blade dancer soaring through golden clouds',
    'armored cyber samurai preparing an unsheathing strike',
    'ancient forest guardian stag crowned with blooming wisteria',
    'moonlit valkyrie warrior brandishing a spear of pure starlight',
    'neon streetwear ronin standing on a rain-drenched neon overpass',
    'winged anime oracle clutching a glowing celestial astrolabe',
  ],
  BOTANICAL: [
    'cherry blossoms dancing across swirling iridescent wind trails',
    'delicate spider lilies with creeping thorny vines',
    'golden ginkgo leaves descending into a radiant pool of starlight',
    'bioluminescent neon moss entwined with weeping willow fronds',
    'art nouveau lotus blossoms with serpentine gilded stems',
    'cascading midnight jasmine and deep indigo bellflowers',
  ],
  COMPANION: [
    'spirit fox with nine swirling azure flame tails',
    'cybernetic scout falcon with glowing geometric wings',
    'ethereal jade koi gliding effortlessly through mid-air stardust',
    'golden scarab beetle with wings encrusted in luminous lapis',
    'shadow dragon whelp curling softly around a celestial orb',
    'crystallized origami crane with faint prism light trails',
  ],
  COLOR_PALETTE: [
    'deep sapphire indigo, molten gold, crimson scarlet, and ethereal cyan',
    'neon magenta, electric cyan, midnight charcoal, and acid yellow',
    'burnished antique gold, velvety sage green, and obsidian black',
    'pastel sunset peach, lavender dusk, warm cream, and iridescent opal',
    'deep emerald pine, champagne bronze, and rich burgundy wine',
    'monochrome graphite with radiant liquid gold accents',
  ],
  BORDER_THEME: [
    'ornate art nouveau brass filigree with constellation charts',
    'tactical holographic telemetry frame with neon corner brackets',
    'gothic cathedral pointed stained-glass arch with trefoil relief',
    'infinite synthwave perspective wireframe horizon with retro grids',
    'celestial zodiac wheel with gilded lunar phase cycles',
    'clean modern double-line gold leaf border with crosshair corners',
  ],
};

// API: Placeholder Value Suggestions using Pollinations Text/Chat API
app.post('/api/suggest-values', async (req, res) => {
  try {
    const { placeholder, niche, currentPrompt } = req.body;
    const apiKey = getPollinationsKey();

    if (apiKey) {
      try {
        const promptContent = `You are a creative director for graphic illustration and print artwork.
For the placeholder tag "${placeholder}" in the niche "${niche}" (context: "${currentPrompt || ''}"):
Provide 6 vivid, creative, unique options to fill this placeholder.
Return ONLY a valid JSON array of 6 short strings, for example: ["option 1", "option 2", "option 3", "option 4", "option 5", "option 6"]. Do not include any other markdown or commentary.`;

        const chatResponse = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'openai',
            messages: [{ role: 'user', content: promptContent }],
            temperature: 0.8,
          }),
        });

        if (chatResponse.ok) {
          const chatData = await chatResponse.json();
          let rawContent = chatData.choices?.[0]?.message?.content || '';

          // Strip markdown code fences if present
          rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

          const parsed = JSON.parse(rawContent);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cleanSuggestions = parsed
              .map((item) => (typeof item === 'string' ? item : item.idea || item.title || JSON.stringify(item)))
              .filter(Boolean);
            if (cleanSuggestions.length > 0) {
              return res.json({ suggestions: cleanSuggestions });
            }
          }
        }
      } catch (err) {
        console.warn('[Pollinations API] Chat suggestions fallback triggered:', err);
      }
    }

    // Default curated fallback if API call fails
    const key = (placeholder || '').toUpperCase().trim();
    const suggestions = FALLBACK_SUGGESTIONS[key] || [
      `radiant ${placeholder} infused with celestial energy`,
      `intricate dynamic ${placeholder} with fine details`,
      `ethereal glowing ${placeholder} in motion`,
      `stylized minimalist ${placeholder} with bold lines`,
      `ornate vintage ${placeholder} with gilded accents`,
      `cybernetic high-tech ${placeholder} with neon pulses`,
    ];

    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error suggesting values:', error);
    return res.status(500).json({ suggestions: [] });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Design Studio server listening on port ${PORT} with Pollinations API`);
  });
}

startServer();
