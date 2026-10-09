import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 50mb limit for high-res photo payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared Gemini AI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: Date.now(),
  });
});

/**
 * AI Auto-Numbering Endpoint
 * Follows Feature Specification:
 * - Step 1: Image Classification (single vs composite/collage)
 * - Step 2: Preferred Placement Rules (Corner priority: Upper-Left, Upper-Right, Lower-Left, Lower-Right;
 *           constraint: never obscure main subjects)
 * - Step 3: Fallback Margins flag (if no corners valid)
 * - Step 4: Manual Override flag (if composite split/processing fails)
 */
app.post('/api/ai/auto-number', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', pageIndex = 0, totalPages = 1 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY not configured on server',
        fallbackToClient: true,
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const systemPrompt = `You are an expert AI vision system specializing in automated photo numbering following strict rules:

OBJECTIVE:
Sequentially number single images or sub-images within collages, prioritizing clear visibility without obscuring main subjects.

STEP 1: IMAGE CLASSIFICATION
Analyze the input image to determine whether it is a "Single Image" or a "Composite/Collage" of multiple distinct sub-images (e.g. 2-panel, 4-panel, photo grid, side-by-side shots).

STEP 2: PREFERRED PLACEMENT RULES
For each image (or each sub-image within a composite):
Evaluate corner locations in this EXACT priority order:
1. Upper-Left
2. Upper-Right
3. Lower-Left
4. Lower-Right

VALIDATION CONSTRAINT:
Reject any corner location where the number stamp obscures a main subject, object, person, face, focal point, product, or vital text. Overlays are permitted ONLY over non-essential background / neutral areas (sky, floor, empty wall, negative space).

If a valid corner is found:
- Report "bestCorner" as "upper-left", "upper-right", "lower-left", or "lower-right".
- Calculate normalized coordinates "suggestedCoord" { x: number (0.0-1.0), y: number (0.0-1.0) } inset roughly 5-8% from that corner within the overall image (or within the sub-image bounding box).
- Set "validCornerFound": true.

STEP 3: FALLBACK MARGINS (IF NO CORNERS ARE VALID)
If ALL four corners contain subjects or crowded content and none are valid:
- Set "validCornerFound": false.
- Set "needsFallbackMargin": true.
- If Single Image: "marginType": "single-top-margin" (add white top border).
- If Composite: "marginType": "composite-row-spacing" (insert white space above each row).

STEP 4: MANUAL OVERRIDE EXCEPTION
If this is a composite image but the layout is complex, irregularly diagonal, staggered, overlapping, or impossible to cleanly split into distinct sub-image rectangles:
- Set "compositeSuccess": false.
- Set "manualOverrideRequired": true.

RETURN PURE JSON matching this schema:
{
  "classification": "single" | "composite",
  "compositeSuccess": boolean,
  "manualOverrideRequired": boolean,
  "needsFallbackMargin": boolean,
  "marginType": "none" | "single-top-margin" | "composite-row-spacing",
  "panels": [
    {
      "panelIndex": number,
      "rowIndex": number,
      "box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
      "bestCorner": "upper-left" | "upper-right" | "lower-left" | "lower-right" | null,
      "validCornerFound": boolean,
      "suggestedCoord": { "x": number, "y": number },
      "reasoning": string
    }
  ],
  "summary": string
}`;

    // Attempt generateContent with retry for transient high demand (503)
    let response: any = null;
    let attempts = 0;
    while (attempts < 2) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: cleanBase64,
                  },
                },
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
        break;
      } catch (err: any) {
        if (attempts < 2 && (err?.status === 503 || String(err).includes('503'))) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        throw err;
      }
    }

    const rawText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch (e) {
      // Clean possible markdown code fences
      const cleaned = rawText.replace(/```json\s*|```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/ai/auto-number:', error);
    return res.status(500).json({
      error: error.message || 'AI Auto-numbering failed',
      manualOverrideRequired: true,
    });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
