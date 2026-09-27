import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));
app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

// Shared Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Generate Design Artwork
app.post('/api/generate-design', async (req, res) => {
  try {
    const { prompt, aspectRatio = '9:16' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Please verify GEMINI_API_KEY in the Secrets panel.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as '9:16' | '1:1' | '3:4' | '4:3' | '16:9',
        },
      },
    });

    let imageUrl: string | null = null;
    let descriptionText = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          descriptionText += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: 'Model did not return image data.',
        detail: descriptionText,
      });
    }

    return res.json({ imageUrl, text: descriptionText });
  } catch (error: any) {
    console.error('Error generating design:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate design',
      details: error?.toString(),
    });
  }
});

// API: Generate AI Lifestyle Mockup
app.post('/api/generate-lifestyle', async (req, res) => {
  try {
    const { designDescription, device, scenario, aspectRatio = '16:9' } = req.body;
    if (!designDescription) {
      return res.status(400).json({ error: 'Design description is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured.',
      });
    }

    const prompt = `A high-end, photorealistic commercial product lifestyle photo of a modern ${device || 'iPhone 16 Pro Max'} phone case featuring a custom graphic: "${designDescription}".
Setting: ${scenario || 'A stylish person walking outdoors in a sunny city street holding the phone, showing off the sleek phone case'}.
Realistic lighting, premium materials, high detail, sharp focus on the phone case, subtle reflections, commercial advertising photography style, depth of field.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as '16:9' | '4:3' | '1:1',
        },
      },
    });

    let imageUrl: string | null = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'Failed to generate lifestyle mockup' });
    }

    return res.json({ imageUrl });
  } catch (error: any) {
    console.error('Error generating lifestyle mockup:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate lifestyle mockup',
    });
  }
});

// API: AI Placeholder Value Suggestions
app.post('/api/suggest-values', async (req, res) => {
  try {
    const { placeholder, niche, currentPrompt } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ suggestions: [] });
    }

    const prompt = `You are a master creative director for phone case graphic design.
Given the placeholder tag "${placeholder}" for niche "${niche}" within prompt context:
"${currentPrompt}"

Provide 6 creative, evocative, visually vivid options to fill this placeholder.
Return ONLY a JSON array of 6 short strings (e.g. ["option 1", "option 2", ...]).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let suggestions: string[] = [];
    try {
      suggestions = JSON.parse(response.text || '[]');
    } catch {
      suggestions = [];
    }

    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error suggesting values:', error);
    return res.status(500).json({ suggestions: [] });
  }
});

// Helper: High-fidelity tailored fallback generator
function generateTailoredEtsyListingFallback(
  prompt: string,
  title: string,
  niche: string,
  placeholders: Record<string, string>,
  deviceFocus: string,
  caseStyle: string
) {
  const subject = placeholders.SUBJECT_POSE || placeholders.CHARACTER || title || 'Celestial Art';
  const botanical = placeholders.BOTANICAL || placeholders.NATURE || '';
  const color = placeholders.COLOR_PALETTE || placeholders.PALETTE || 'Vibrant Luminous Tones';

  const cleanSubject = subject.split(',')[0].trim().slice(0, 32);
  const primaryTitle = `${cleanSubject} Phone Case, ${niche.slice(0, 24)} iPhone 16 15 14 Pro Max Case, Aesthetic Tough Cover`.slice(0, 138);

  const tags = [
    `${cleanSubject.slice(0, 15)} case`.toLowerCase(),
    'iphone 16 pro case',
    'iphone 15 case',
    `${niche.slice(0, 14)} case`.toLowerCase(),
    'aesthetic phone case',
    'tough phone case',
    'unique gift for her',
    'unique gift for him',
    'custom phone cover',
    'artistic phone case',
    'wireless charging',
    'phone case gift',
    'protective case',
  ].map((t) => t.slice(0, 20));

  return {
    title: primaryTitle,
    description: `✨ Elevate your everyday aesthetic with this premium ${niche} phone case featuring "${cleanSubject}". Custom-crafted for art lovers who demand both museum-grade visual beauty and military-grade protection.\n\n🎨 THE ARTWORK & INSPIRATION\nThis design showcases ${subject}${botanical ? ` surrounded by ${botanical}` : ''}. The composition is rendered in an evocative palette of ${color}, creating an enchanting visual that turns your phone into a handheld masterpiece.\n\n🛡️ PREMIUM PHONE CASE SPECIFICATIONS\n• Dual-Layer Tough Case: Shock-absorbent TPU inner bumper combined with an impact-resistant polycarbonate outer shell\n• Slim Snap Alternative: Lightweight, sleek profile that slips effortlessly into pockets without added bulk\n• Screen & Camera Shield: 1.5mm raised bevel prevents lens and glass scratching on flat surfaces\n• Full Wireless Charging: Fully compatible with Qi wireless chargers and modern accessories\n• Lifetime Fade-Proof Print: High-definition sub-surface UV sublimation will never scratch, peel, or fade\n• Precision Engineered: Smooth, responsive button covers and crystal-clear cutouts for all ports\n\n📱 SUPPORTED DEVICES\n• iPhone 16, 16 Pro, 16 Pro Max, 16 Plus\n• iPhone 15, 15 Pro, 15 Pro Max, 15 Plus\n• iPhone 14, 13, 12, 11 Series\n• Samsung Galaxy S24 Ultra, S24+, S24, S23 Series\n\n🎁 THE PERFECT GIFT\nAn unforgettable present for anime fans, art collectors, and anyone who appreciates bespoke graphic design.\n\n🧼 CARE INSTRUCTIONS\nWipe gently with a soft, damp microfiber cloth. Avoid harsh abrasive cleaners.`,
    primaryKeywords: [
      `${cleanSubject} phone case`,
      `${niche} phone case`,
      'iPhone 16 Pro Max case',
      'aesthetic tough case',
      'protective phone cover',
      'artistic phone case',
    ],
    longTailKeywords: [
      `${cleanSubject} iphone 16 case`,
      `${niche} protective phone case`,
      `aesthetic ${cleanSubject} cover`,
      'dual layer tough phone case',
      'unique artistic phone case gift',
      'japanese art phone cover',
    ],
    etsyTags: tags,
    targetCustomer: [
      `${niche} Enthusiasts`,
      'Aesthetic Tech Accessories Collectors',
      'Art & Illustration Lovers',
      'Unique Gift Hunters',
      'Pop Culture & Fantasy Fans',
    ],
    designStyle: [
      niche,
      'Detailed Graphic Illustration',
      'Intricate Linework',
      'Luminous Color Vibrancy',
    ],
    searchIntent: `Shoppers actively searching for a standout, protective phone case featuring ${cleanSubject} in a distinct ${niche} aesthetic that expresses personal taste and shields their device.`,
    keywordRationale: `The primary keywords capture essential high-volume search traffic for iPhone and protective tough cases, while the long-tail keywords target high-intent niche shoppers searching specifically for ${cleanSubject} and ${niche} art styles.`,
  };
}

// API: Generate Complete Etsy Product Listing
app.post('/api/generate-etsy-listing', async (req, res) => {
  try {
    const {
      prompt,
      title = 'Custom Artistic Phone Case',
      niche = 'Artistic Graphic Design',
      placeholders = {},
      imageUrl,
      deviceFocus = 'iPhone 16 / 15 / 14 Pro Max & Samsung Galaxy S24',
      caseStyle = 'Dual-Layer Tough Impact Case & Slim Snap Case',
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Design prompt is required' });
    }

    const ai = getGeminiClient();

    // Multimodal image extraction
    let imagePart: any = null;
    if (imageUrl && typeof imageUrl === 'string') {
      try {
        if (imageUrl.startsWith('data:')) {
          const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            imagePart = {
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            };
          }
        } else if (imageUrl.startsWith('/src/') || imageUrl.startsWith('src/')) {
          const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
          const absPath = path.resolve(__dirname, cleanPath);
          if (fs.existsSync(absPath)) {
            const buffer = fs.readFileSync(absPath);
            const ext = path.extname(absPath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            imagePart = {
              inlineData: {
                mimeType,
                data: buffer.toString('base64'),
              },
            };
          }
        }
      } catch (imgErr) {
        console.warn('Could not read image for multimodal analysis, continuing with prompt:', imgErr);
      }
    }

    let parsedResult: any = null;

    if (ai) {
      const systemInstruction = `You are a world-class Etsy E-Commerce SEO Specialist, Creative Copywriter, and Commercial Merchandising Expert specializing in viral, top-ranking phone cases.

You will analyze the actual phone case artwork design (if provided in image) and the original image-generation prompt used to create it:
Original Prompt: "${prompt}"
Design Title: "${title}"
Niche Category: "${niche}"
Specific Placeholders: ${JSON.stringify(placeholders)}
Target Phone Devices: "${deviceFocus}"
Case Construction: "${caseStyle}"

YOUR OBJECTIVE:
Analyze the product's visual style, subject matter, theme, color palette, artistic style, mood, and target audience.
Create a complete, authentic, commercially ready Etsy listing that is specifically tailored to this exact artwork. Do NOT generate generic or boilerplate filler.

REQUIREMENTS:
1. PRODUCT TITLE:
- Craft an irresistible, SEO-optimized Etsy title between 110 and 138 characters (Etsy maximum is 140 characters).
- Clearly identify the product as an iPhone/phone case (e.g. "Stained Glass Kitsune Fox Phone Case, Japanese Anime Art Nouveau iPhone 16 15 14 Pro Max Case, Mythical Celestial Animal Gift").
- Front-load high-intent, high-volume search phrases.
- Combine broad keywords with specific descriptive terms based on the actual artwork.
- Must be attractive and readable for real buyers—NO robotic keyword stuffing.

2. PRODUCT DESCRIPTION:
- Persuasive, professional Etsy product description formatted with short paragraphs, clear section headers, and bullet points.
- Compelling opening hook highlighting the artwork's specific mood and beauty.
- Detailed description of the artwork: the visual story, colors, artistic influences, and what makes it extraordinary.
- Practical Phone Case Highlights (Tough dual-layer silicone + polycarbonate, raised 1.5mm screen/camera bezels, wireless charging / MagSafe compatible, UV print that will never fade, peel, or scratch).
- Device Compatibility section (iPhone 16, 16 Pro, 16 Pro Max, 16 Plus, 15, 14, 13, 12, 11; Samsung Galaxy S24 Ultra, S24+, S24, S23).
- "Perfect Gift For..." section tailored specifically to the target audience.
- Quality Guarantee & Care Instructions.
- Professional, premium, and creative tone.

3. PRIMARY KEYWORDS:
- 6 to 8 highest-priority core keywords with strong commercial buyer intent.

4. LONG-TAIL KEYWORDS:
- 6 to 10 highly specific search phrases that shoppers would type when searching for this unique design (e.g. "stained glass fox phone case", "art nouveau celestial kitsune case", etc.).

5. ETSY TAGS:
- EXACTLY 13 Etsy tags (Etsy allows up to 13 tags).
- STRICT CONSTRAINT: Every single tag MUST be 20 characters or fewer (including spaces and punctuation). This is a strict platform limit on Etsy.
- Only generate tags that genuinely fit the design.

6. TARGET CUSTOMER:
- 4 to 6 specific customer personas inferred directly from the design (e.g., Anime & Manga Lovers, Art Nouveau Collectors, Cottagecore Enthusiasts, Fox Lovers, Fantasy Gamers).

7. DESIGN STYLE:
- Main artistic movements, techniques, and aesthetic motifs present in the design.

8. SEARCH INTENT:
- What customers are searching for and why they are drawn to this phone case.

9. KEYWORD RATIONALE:
- Clear breakdown of the chain: Design → Customer Intent → Search Query → Etsy Listing, detailing why the primary and long-tail keywords were selected.

Return ONLY a valid JSON object matching this schema:
{
  "title": "string",
  "description": "string",
  "primaryKeywords": ["string"],
  "longTailKeywords": ["string"],
  "etsyTags": ["string"],
  "targetCustomer": ["string"],
  "designStyle": ["string"],
  "searchIntent": "string",
  "keywordRationale": "string"
}`;

      const contents: any[] = [];
      if (imagePart) {
        contents.push(imagePart);
      }
      contents.push({ text: systemInstruction });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
        },
      });

      try {
        parsedResult = JSON.parse(response.text || '{}');
      } catch (jsonErr) {
        console.error('Failed to parse Gemini JSON response:', jsonErr, response.text);
      }
    }

    if (!parsedResult || !parsedResult.title) {
      parsedResult = generateTailoredEtsyListingFallback(prompt, title, niche, placeholders, deviceFocus, caseStyle);
    }

    // Ensure tags are strictly <= 20 chars each and array of strings
    if (Array.isArray(parsedResult.etsyTags)) {
      parsedResult.etsyTags = parsedResult.etsyTags
        .map((t: string) => (typeof t === 'string' ? t.trim().slice(0, 20) : ''))
        .filter((t: string) => t.length > 0)
        .slice(0, 13);
    }

    const formattedOutput = `PRODUCT TITLE
${parsedResult.title}

PRODUCT DESCRIPTION
${parsedResult.description}

PRIMARY KEYWORDS
${(parsedResult.primaryKeywords || []).map((k: string) => `- ${k}`).join('\n')}

LONG-TAIL KEYWORDS
${(parsedResult.longTailKeywords || []).map((k: string) => `- ${k}`).join('\n')}

ETSY TAGS
${(parsedResult.etsyTags || []).join(', ')}

TARGET CUSTOMER
${(parsedResult.targetCustomer || []).map((c: string) => `- ${c}`).join('\n')}

DESIGN STYLE
${(parsedResult.designStyle || []).map((s: string) => `- ${s}`).join('\n')}

SEARCH INTENT
${parsedResult.searchIntent}

KEYWORD RATIONALE
${parsedResult.keywordRationale}`;

    return res.json({
      ...parsedResult,
      formattedOutput,
      createdAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating Etsy listing:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate Etsy listing',
    });
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
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
