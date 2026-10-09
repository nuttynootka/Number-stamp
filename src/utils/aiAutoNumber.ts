import { PhotoItem } from '../types';

export interface AIPanelResult {
  panelIndex: number;
  rowIndex?: number;
  box: { ymin: number; xmin: number; ymax: number; xmax: number };
  bestCorner: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right' | null;
  validCornerFound: boolean;
  suggestedCoord: { x: number; y: number };
  reasoning?: string;
}

export interface AIAutoNumberResult {
  classification: 'single' | 'composite';
  compositeSuccess: boolean;
  manualOverrideRequired: boolean;
  needsFallbackMargin: boolean;
  marginType: 'none' | 'single-top-margin' | 'composite-row-spacing';
  panels: AIPanelResult[];
  summary?: string;
}

/**
 * Priority Corner offsets (normalized 0.0 - 1.0)
 * Evaluated in strict order:
 * 1. Upper-Left
 * 2. Upper-Right
 * 3. Lower-Left
 * 4. Lower-Right
 */
export const CORNER_OFFSETS = {
  'upper-left': { x: 0.08, y: 0.08 },
  'upper-right': { x: 0.92, y: 0.08 },
  'lower-left': { x: 0.08, y: 0.92 },
  'lower-right': { x: 0.92, y: 0.92 },
} as const;

/**
 * Call server AI Auto-Numbering endpoint powered by Gemini 3.8 Flash
 */
export async function analyzeImageForAutoNumbering(
  photo: PhotoItem,
  pageIndex: number = 0,
  totalPages: number = 1
): Promise<AIAutoNumberResult> {
  try {
    const res = await fetch('/api/ai/auto-number', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: photo.dataUrl,
        pageIndex,
        totalPages,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.panels && Array.isArray(data.panels)) {
        return {
          classification: data.classification || 'single',
          compositeSuccess: data.compositeSuccess !== false,
          manualOverrideRequired: Boolean(data.manualOverrideRequired),
          needsFallbackMargin: Boolean(data.needsFallbackMargin),
          marginType: data.marginType || 'none',
          panels: data.panels.map((p: any, idx: number) => ({
            panelIndex: p.panelIndex ?? idx,
            rowIndex: p.rowIndex ?? 0,
            box: p.box || { ymin: 0, xmin: 0, ymax: 1, xmax: 1 },
            bestCorner: p.bestCorner || 'upper-left',
            validCornerFound: p.validCornerFound !== false,
            suggestedCoord: p.suggestedCoord || CORNER_OFFSETS['upper-left'],
            reasoning: p.reasoning || '',
          })),
          summary: data.summary || '',
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI auto-number call failed, using client heuristic fallback:', err);
  }

  // Client-side rule-based fallback adhering strictly to the specifications:
  // Step 1: Detect single image vs composite
  // Step 2: Evaluate corners in order: Upper-Left, Upper-Right, Lower-Left, Lower-Right
  return evaluateClientHeuristic(photo);
}

/**
 * Client heuristic fallback when network or API is offline
 * Analyzes image canvas corners in strict priority order:
 * 1. Upper-Left
 * 2. Upper-Right
 * 3. Lower-Left
 * 4. Lower-Right
 */
export async function evaluateClientHeuristic(photo: PhotoItem): Promise<AIAutoNumberResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.dataUrl;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const w = 120;
      const h = Math.round(120 * (img.height / img.width));
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback default: Upper-Left corner
        resolve({
          classification: 'single',
          compositeSuccess: true,
          manualOverrideRequired: false,
          needsFallbackMargin: false,
          marginType: 'none',
          panels: [
            {
              panelIndex: 0,
              box: { ymin: 0, xmin: 0, ymax: 1, xmax: 1 },
              bestCorner: 'upper-left',
              validCornerFound: true,
              suggestedCoord: { x: 0.08, y: 0.08 },
              reasoning: 'Default Upper-Left corner selected.',
            },
          ],
        });
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

      // Measure variance/activity at each corner (15x15 sample)
      const sampleSize = Math.max(8, Math.round(w * 0.1));
      const corners = [
        { id: 'upper-left' as const, x: 2, y: 2, coord: { x: 0.08, y: 0.08 } },
        { id: 'upper-right' as const, x: w - sampleSize - 2, y: 2, coord: { x: 0.92, y: 0.08 } },
        { id: 'lower-left' as const, x: 2, y: h - sampleSize - 2, coord: { x: 0.08, y: 0.92 } },
        { id: 'lower-right' as const, x: w - sampleSize - 2, y: h - sampleSize - 2, coord: { x: 0.92, y: 0.92 } },
      ];

      let bestCorner: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right' = 'upper-left';
      let bestCoord = { x: 0.08, y: 0.08 };
      let foundValid = false;

      for (const corner of corners) {
        try {
          const imgData = ctx.getImageData(corner.x, corner.y, sampleSize, sampleSize);
          const data = imgData.data;
          // Calculate brightness variance to detect empty/clean background vs focal subjects
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
          }
          const mean = sum / (data.length / 4);

          let variance = 0;
          for (let i = 0; i < data.length; i += 4) {
            const b = (data[i] + data[i + 1] + data[i + 2]) / 3;
            variance += Math.pow(b - mean, 2);
          }
          variance /= (data.length / 4);

          // If corner has relatively low variance (background or uniform area, not complex focal subject)
          if (variance < 1400) {
            bestCorner = corner.id;
            bestCoord = corner.coord;
            foundValid = true;
            break; // First in priority order wins!
          }
        } catch {
          // Canvas tainted or error, fallback to first
          bestCorner = 'upper-left';
          foundValid = true;
          break;
        }
      }

      if (!foundValid) {
        // If all corners are chaotic, select Upper-Left anyway or trigger Fallback Margin
        bestCorner = 'upper-left';
        bestCoord = { x: 0.08, y: 0.08 };
      }

      resolve({
        classification: 'single',
        compositeSuccess: true,
        manualOverrideRequired: false,
        needsFallbackMargin: !foundValid,
        marginType: !foundValid ? 'single-top-margin' : 'none',
        panels: [
          {
            panelIndex: 0,
            box: { ymin: 0, xmin: 0, ymax: 1, xmax: 1 },
            bestCorner,
            validCornerFound: foundValid,
            suggestedCoord: bestCoord,
            reasoning: `Selected ${bestCorner} corner based on priority order.`,
          },
        ],
      });
    };

    img.onerror = () => {
      resolve({
        classification: 'single',
        compositeSuccess: true,
        manualOverrideRequired: false,
        needsFallbackMargin: false,
        marginType: 'none',
        panels: [
          {
            panelIndex: 0,
            box: { ymin: 0, xmin: 0, ymax: 1, xmax: 1 },
            bestCorner: 'upper-left',
            validCornerFound: true,
            suggestedCoord: { x: 0.08, y: 0.08 },
            reasoning: 'Default Upper-Left corner fallback.',
          },
        ],
      });
    };
  });
}

/**
 * Step 3: Fallback Margin for Single Image
 * Adds a clean white top border (slightly taller than text) without scaling or distorting original image.
 * Places number at the top-left of this new margin.
 */
export async function addSingleImageTopMargin(
  photo: PhotoItem,
  marginHeightPx: number = 70
): Promise<{ updatedDataUrl: string; newWidth: number; newHeight: number; stampCoord: { x: number; y: number } }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.dataUrl;

    img.onload = () => {
      const origW = img.naturalWidth || photo.width || 1200;
      const origH = img.naturalHeight || photo.height || 900;

      // Make margin proportional (e.g. 6% of image height, minimum 60px)
      const topMargin = Math.max(marginHeightPx, Math.round(origH * 0.065));
      const newW = origW;
      const newH = origH + topMargin;

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d')!;

      // 1. Fill entire canvas with clean crisp white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, newW, newH);

      // 2. Draw original image starting at y = topMargin without ANY scaling or distortion
      ctx.drawImage(img, 0, topMargin, origW, origH);

      const updatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      // Suggested stamp coordinates in normalized units of the new canvas:
      // x: top-left (e.g. 5% from left), y: centered in the top margin
      const stampCoord = {
        x: 0.06,
        y: (topMargin * 0.5) / newH,
      };

      resolve({
        updatedDataUrl,
        newWidth: newW,
        newHeight: newH,
        stampCoord,
      });
    };

    img.onerror = () => {
      resolve({
        updatedDataUrl: photo.dataUrl,
        newWidth: photo.width,
        newHeight: photo.height,
        stampCoord: { x: 0.08, y: 0.08 },
      });
    };
  });
}

/**
 * Step 3: Fallback Margins for Composite Image
 * Splits the composite into rows and inserts white spacing above each row without scaling or distorting content.
 * Places each number in the added space above the top-left corner of its corresponding sub-image.
 */
export async function addCompositeRowSpacing(
  photo: PhotoItem,
  panels: AIPanelResult[],
  spacingHeightPx: number = 65
): Promise<{
  updatedDataUrl: string;
  newWidth: number;
  newHeight: number;
  updatedPanels: Array<AIPanelResult & { stampCoord: { x: number; y: number } }>;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.dataUrl;

    img.onload = () => {
      const origW = img.naturalWidth || photo.width || 1200;
      const origH = img.naturalHeight || photo.height || 900;

      // Group panels into rows based on ymin
      const sortedPanels = [...panels].sort((a, b) => a.box.ymin - b.box.ymin);
      const rows: AIPanelResult[][] = [];
      const rowThreshold = 0.12;

      for (const p of sortedPanels) {
        let placed = false;
        for (const row of rows) {
          if (Math.abs(row[0].box.ymin - p.box.ymin) < rowThreshold) {
            row.push(p);
            placed = true;
            break;
          }
        }
        if (!placed) {
          rows.push([p]);
        }
      }

      const numRows = Math.max(1, rows.length);
      const spacing = Math.max(spacingHeightPx, Math.round(origH * 0.06));
      const newW = origW;
      const newH = origH + numRows * spacing;

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d')!;

      // Fill canvas with white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, newW, newH);

      const updatedPanels: Array<AIPanelResult & { stampCoord: { x: number; y: number } }> = [];

      // Draw original composite slices or draw rows with inserted spacing
      let currentYOffset = 0;
      rows.forEach((rowPanels, rIdx) => {
        // Find row bounds
        const minY = Math.min(...rowPanels.map((p) => p.box.ymin)) * origH;
        const maxY = Math.max(...rowPanels.map((p) => p.box.ymax)) * origH;
        const sliceH = Math.max(10, maxY - minY);

        // Add white space above row
        currentYOffset += spacing;

        // Draw this row slice from original image
        ctx.drawImage(img, 0, minY, origW, sliceH, 0, currentYOffset, origW, sliceH);

        // Calculate stamp coordinate for each sub-image in this row
        // Placed in the added space above the top-left corner of its sub-image
        rowPanels.forEach((p) => {
          const subX = p.box.xmin * origW;
          const stampX = Math.max(0.04, Math.min(0.96, (subX + origW * 0.05) / newW));
          const stampY = (currentYOffset - spacing * 0.5) / newH;

          updatedPanels.push({
            ...p,
            stampCoord: { x: stampX, y: stampY },
          });
        });

        currentYOffset += sliceH;
      });

      const updatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

      resolve({
        updatedDataUrl,
        newWidth: newW,
        newHeight: newH,
        updatedPanels,
      });
    };

    img.onerror = () => {
      resolve({
        updatedDataUrl: photo.dataUrl,
        newWidth: photo.width,
        newHeight: photo.height,
        updatedPanels: panels.map((p) => ({
          ...p,
          stampCoord: p.suggestedCoord || { x: 0.08, y: 0.08 },
        })),
      });
    };
  });
}
