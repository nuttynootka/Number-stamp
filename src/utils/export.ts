import JSZip from 'jszip';
import { PhotoItem, Stamp, StampStyle } from '../types';

/**
 * Loads an image from a dataUrl or URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image for rendering: ' + e));
    img.src = src;
  });
}

/**
 * Helper to render rounded rectangle path
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Traces a geometric sticker shape path centered at (0, 0)
 */
function traceStickerPath(
  ctx: CanvasRenderingContext2D,
  shape: string,
  w: number,
  h: number,
  scale: number = 1
) {
  const sw = w * scale;
  const sh = h * scale;
  const r = Math.max(sw, sh) / 2;

  ctx.beginPath();

  if (shape === 'circle') {
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    const s = Math.max(sw, sh);
    ctx.rect(-s / 2, -s / 2, s, s);
  } else if (shape === 'rounded-square') {
    const s = Math.max(sw, sh);
    const cr = s * 0.22;
    drawRoundedRect(ctx, -s / 2, -s / 2, s, s, cr);
  } else if (shape === 'squircle') {
    const s = Math.max(sw, sh);
    const cr = s * 0.38;
    drawRoundedRect(ctx, -s / 2, -s / 2, s, s, cr);
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'octagon') {
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 8;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'shield') {
    const hw = sw * 0.55;
    const hh = sh * 0.65;
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, -hh * 0.1);
    ctx.quadraticCurveTo(hw, hh * 0.6, 0, hh);
    ctx.quadraticCurveTo(-hw, hh * 0.6, -hw, -hh * 0.1);
    ctx.closePath();
  } else if (shape === 'starburst') {
    const points = 16;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.88;
      const angle = (i * Math.PI) / points;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (shape === 'rosette') {
    const lobes = 16;
    for (let i = 0; i < lobes; i++) {
      const angle = (i * 2 * Math.PI) / lobes;
      const nextAngle = ((i + 1) * 2 * Math.PI) / lobes;
      const midAngle = (angle + nextAngle) / 2;
      const px1 = Math.cos(angle) * (r * 0.85);
      const py1 = Math.sin(angle) * (r * 0.85);
      const cpx = Math.cos(midAngle) * (r * 1.05);
      const cpy = Math.sin(midAngle) * (r * 1.05);
      const px2 = Math.cos(nextAngle) * (r * 0.85);
      const py2 = Math.sin(nextAngle) * (r * 0.85);
      if (i === 0) ctx.moveTo(px1, py1);
      ctx.quadraticCurveTo(cpx, cpy, px2, py2);
    }
    ctx.closePath();
  } else if (shape === 'diamond') {
    const hw = (Math.max(sw, sh) / 2) * 1.15;
    ctx.moveTo(0, -hw);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hw);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
  } else if (shape === 'tag') {
    const hw = sw * 0.55;
    const hh = sh * 0.55;
    const cut = Math.min(hw, hh) * 0.35;
    ctx.moveTo(-hw + cut, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh);
    ctx.lineTo(-hw + cut, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
  } else if (shape === 'badge') {
    const points = 12;
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.84;
      const angle = (i * Math.PI) / points;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    // Default circle
    ctx.arc(0, 0, r, 0, Math.PI * 2);
  }
}

/**
 * Creates metallic or enamel gradient fill for sticker
 */
function createStickerGradient(
  ctx: CanvasRenderingContext2D,
  design: string,
  primary: string,
  secondary: string | undefined,
  size: number
): CanvasGradient | string {
  const half = size / 2;
  const grad = ctx.createLinearGradient(-half, -half, half, half);

  switch (design) {
    case 'metallic-gold':
      grad.addColorStop(0, '#855A12');
      grad.addColorStop(0.25, '#E5C058');
      grad.addColorStop(0.5, '#FFF6C2');
      grad.addColorStop(0.75, '#C69222');
      grad.addColorStop(1, '#6E4407');
      return grad;

    case 'metallic-silver':
      grad.addColorStop(0, '#707982');
      grad.addColorStop(0.25, '#D4DCE2');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(0.75, '#A6B0B8');
      grad.addColorStop(1, '#555C64');
      return grad;

    case 'metallic-bronze':
      grad.addColorStop(0, '#5E300E');
      grad.addColorStop(0.25, '#BA6D33');
      grad.addColorStop(0.5, '#F9BC88');
      grad.addColorStop(0.75, '#9E501D');
      grad.addColorStop(1, '#4A2308');
      return grad;

    case 'metallic-rose-gold':
      grad.addColorStop(0, '#7B3845');
      grad.addColorStop(0.25, '#CE7585');
      grad.addColorStop(0.5, '#FDE2E6');
      grad.addColorStop(0.75, '#B65D6F');
      grad.addColorStop(1, '#5E2732');
      return grad;

    case 'metallic-chrome':
      grad.addColorStop(0, '#374151');
      grad.addColorStop(0.3, '#9CA3AF');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(0.7, '#D1D5DB');
      grad.addColorStop(1, '#1F2937');
      return grad;

    case 'enamel-red':
      grad.addColorStop(0, '#7F1D1D');
      grad.addColorStop(0.3, '#DC2626');
      grad.addColorStop(0.7, '#EF4444');
      grad.addColorStop(1, '#991B1B');
      return grad;

    case 'enamel-blue':
      grad.addColorStop(0, '#1E3A8A');
      grad.addColorStop(0.3, '#2563EB');
      grad.addColorStop(0.7, '#60A5FA');
      grad.addColorStop(1, '#1D4ED8');
      return grad;

    case 'enamel-emerald':
      grad.addColorStop(0, '#064E3B');
      grad.addColorStop(0.3, '#059669');
      grad.addColorStop(0.7, '#34D399');
      grad.addColorStop(1, '#047857');
      return grad;

    case 'enamel-purple':
      grad.addColorStop(0, '#4C1D95');
      grad.addColorStop(0.3, '#7C3AED');
      grad.addColorStop(0.7, '#C084FC');
      grad.addColorStop(1, '#6D28D9');
      return grad;

    case 'matte-carbon':
      grad.addColorStop(0, '#18181B');
      grad.addColorStop(0.5, '#27272A');
      grad.addColorStop(1, '#09090B');
      return grad;

    case 'neon-cyan':
      grad.addColorStop(0, '#082F49');
      grad.addColorStop(0.5, '#0E7490');
      grad.addColorStop(1, '#083344');
      return grad;

    case 'clean-white':
      grad.addColorStop(0, '#F1F5F9');
      grad.addColorStop(0.5, '#FFFFFF');
      grad.addColorStop(1, '#E2E8F0');
      return grad;

    default:
      if (secondary) {
        grad.addColorStop(0, primary);
        grad.addColorStop(1, secondary);
        return grad;
      }
      return primary || '#D4AF37';
  }
}

/**
 * Renders a single stamp onto a CanvasRenderingContext2D
 * canvasWidth and canvasHeight are the dimensions of the photo display or native canvas.
 * offsetX and offsetY position the photo inside the canvas if centered.
 */
export function renderStampOnCanvas(
  ctx: CanvasRenderingContext2D,
  stamp: Stamp,
  canvasWidth: number,
  canvasHeight: number,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const style = stamp.style || ({} as any);
  const cx = offsetX + (typeof stamp.x === 'number' && !isNaN(stamp.x) ? stamp.x : 0.5) * canvasWidth;
  const cy = offsetY + (typeof stamp.y === 'number' && !isNaN(stamp.y) ? stamp.y : 0.5) * canvasHeight;

  // Scale ratio: reference dimension uses the shorter edge (minDim) of the image
  // Normalized against standard 380px mobile display viewport
  const refDim = Math.min(canvasWidth, canvasHeight);
  const safeScale = typeof stamp.scale === 'number' && !isNaN(stamp.scale) ? stamp.scale : 1;
  const scaleRatio = Math.max(0.2, (refDim / 380) * safeScale);

  const rawFontSize = typeof style.fontSize === 'number' && !isNaN(style.fontSize) && style.fontSize > 0
    ? style.fontSize
    : 22;
  const fontSize = Math.max(10, Math.round(rawFontSize * scaleRatio));

  const fontStyleStr = style.fontStyle === 'italic' ? 'italic' : 'normal';
  const fontWeightStr = style.fontWeight || '800';

  // Format font family safely with quotes for Canvas 2D parser
  const rawFontFam = style.fontFamily ? style.fontFamily.trim() : 'Inter, system-ui, sans-serif';
  const safeFontFam = rawFontFam
    .split(',')
    .map((f: string) => {
      const trimmed = f.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) return trimmed;
      if (trimmed.includes(' ') || trimmed.includes('-')) {
        return `"${trimmed}"`;
      }
      return trimmed;
    })
    .filter(Boolean)
    .join(', ');

  const displayText = stamp.text && stamp.text.trim().length > 0
    ? stamp.text
    : String(stamp.sequenceIndex || 1);

  ctx.save();
  ctx.translate(cx, cy);

  const totalRotation = (((stamp.rotation || 0) + (style.rotation || 0)) % 360) * (Math.PI / 180);
  if (totalRotation !== 0) {
    ctx.rotate(totalRotation);
  }

  // Setup font for measurement safely
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.font = `${fontStyleStr} ${fontWeightStr} ${fontSize}px ${safeFontFam}, sans-serif`;
  } catch {
    ctx.font = `bold ${fontSize}px sans-serif`;
  }

  const metrics = ctx.measureText(displayText);
  const textWidth = Math.max(metrics.width || 0, fontSize * 0.75);
  const textHeight = fontSize * (style.lineHeight || 1.15);

  // Background sticker or simple background rendering
  if (style.sticker && style.sticker.enabled && style.sticker.shape !== 'none') {
    ctx.save();
    const stk = style.sticker;
    const pad = Math.max(2, (typeof stk.padding === 'number' ? stk.padding : 6) * scaleRatio);
    const boxW = textWidth + pad * 2;
    const boxH = textHeight + pad * 2;
    const stickerDim = Math.max(boxW, boxH);

    const stkAlpha = typeof stk.opacity === 'number' && !isNaN(stk.opacity) ? stk.opacity : 1;
    const textAlpha = typeof style.opacity === 'number' && !isNaN(style.opacity) ? style.opacity : 1;
    ctx.globalAlpha = Math.min(1, Math.max(0.1, textAlpha * stkAlpha));

    // Shadow
    if (stk.hasShadow !== false) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = Math.max(3, 8 * scaleRatio);
      ctx.shadowOffsetX = 2 * scaleRatio;
      ctx.shadowOffsetY = 4 * scaleRatio;
    }

    // Gradient fill
    const fillStyle = createStickerGradient(
      ctx,
      stk.design,
      stk.primaryColor,
      stk.secondaryColor,
      stickerDim
    );
    ctx.fillStyle = fillStyle;

    // Trace path and fill
    traceStickerPath(ctx, stk.shape, stickerDim, stickerDim, 1);
    ctx.fill();

    // Turn off shadow for inner strokes and highlight
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Outer border
    if (stk.borderWidth > 0) {
      ctx.strokeStyle = stk.borderColor || '#8A5D0F';
      ctx.lineWidth = Math.max(1, stk.borderWidth * scaleRatio);
      traceStickerPath(ctx, stk.shape, stickerDim, stickerDim, 1);
      ctx.stroke();
    }

    // Double border / Inner rim (minted medallion look)
    if (stk.doubleBorder) {
      const innerScale = 0.86;
      ctx.strokeStyle = stk.innerRimColor || stk.secondaryColor || '#FFE072';
      ctx.lineWidth = Math.max(1, Math.max(1, stk.borderWidth * 0.7) * scaleRatio);
      traceStickerPath(ctx, stk.shape, stickerDim, stickerDim, innerScale);
      ctx.stroke();
    }

    // Gloss / Shine reflection highlight
    if (stk.shine) {
      ctx.save();
      // Clip to sticker shape
      traceStickerPath(ctx, stk.shape, stickerDim, stickerDim, 1);
      ctx.clip();

      const shineGrad = ctx.createLinearGradient(0, -stickerDim / 2, 0, stickerDim * 0.1);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      shineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = shineGrad;

      ctx.beginPath();
      ctx.ellipse(0, -stickerDim * 0.22, stickerDim * 0.55, stickerDim * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  } else if (style.background && style.background.mode !== 'none' && style.background.shape !== 'none') {
    ctx.save();
    const bg = style.background;
    const padX = Math.max(2, (bg.paddingX !== undefined ? bg.paddingX : 8) * scaleRatio);
    const padY = Math.max(1, (bg.paddingY !== undefined ? bg.paddingY : 4) * scaleRatio);
    const boxW = textWidth + padX * 2;
    const boxH = textHeight + padY * 2;
    const boxX = -boxW / 2;
    const boxY = -boxH / 2;

    const bgAlpha = typeof bg.opacity === 'number' && !isNaN(bg.opacity) ? bg.opacity : 0.85;
    const textAlpha = typeof style.opacity === 'number' && !isNaN(style.opacity) ? style.opacity : 1;
    ctx.globalAlpha = Math.min(1, Math.max(0.1, textAlpha * bgAlpha));

    if (bg.hasShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = Math.max(2, 6 * scaleRatio);
      ctx.shadowOffsetX = 2 * scaleRatio;
      ctx.shadowOffsetY = 3 * scaleRatio;
    }

    if (bg.mode === 'gradient') {
      const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
      grad.addColorStop(0, bg.color || '#000000');
      grad.addColorStop(1, bg.color2 || bg.color || '#1e293b');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = bg.color || '#000000';
    }

    // Shapes
    if (bg.shape === 'circle') {
      const radius = Math.max(boxW, boxH) / 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.stroke();
      }
    } else if (bg.shape === 'oval') {
      ctx.beginPath();
      ctx.ellipse(0, 0, boxW / 2, boxH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.stroke();
      }
    } else if (bg.shape === 'pill') {
      const pillRadius = boxH / 2;
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, pillRadius);
      ctx.fill();
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.stroke();
      }
    } else if (bg.shape === 'rounded-rect') {
      const r = Math.max(2, (bg.borderRadius || 8) * scaleRatio);
      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, r);
      ctx.fill();
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.stroke();
      }
    } else if (bg.shape === 'badge') {
      const rOuter = Math.max(boxW, boxH) / 2;
      const points = 12;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? rOuter : rOuter * 0.88;
        const angle = (i * Math.PI) / points;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.stroke();
      }
    } else {
      // simple rectangle
      ctx.fillRect(boxX, boxY, boxW, boxH);
      if (bg.borderWidth > 0) {
        ctx.strokeStyle = bg.borderColor || '#ffffff';
        ctx.lineWidth = Math.max(1, bg.borderWidth * scaleRatio);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
      }
    }

    ctx.restore();
  }

  // Text setup
  ctx.globalAlpha = Math.max(0.1, typeof style.opacity === 'number' && !isNaN(style.opacity) ? style.opacity : 1);

  // Shadow
  if (style.shadow && style.shadow.enabled) {
    ctx.shadowColor = style.shadow.color || '#000000';
    ctx.shadowBlur = Math.max(1, (style.shadow.blur || 4) * scaleRatio);
    ctx.shadowOffsetX = (style.shadow.offsetX || 2) * scaleRatio;
    ctx.shadowOffsetY = (style.shadow.offsetY || 2) * scaleRatio;
  } else {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Outer second outline
  if (style.secondOutline && style.secondOutline.enabled && style.secondOutline.width > 0) {
    const mainWidth = (style.outline && style.outline.enabled) ? style.outline.width : 0;
    ctx.lineWidth = Math.max(1, (mainWidth + style.secondOutline.width * 2) * scaleRatio);
    ctx.strokeStyle = style.secondOutline.color || '#ffffff';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(displayText, 0, 0);
  }

  // Main outline: default to bold readable outline
  const hasOutline = style.outline && style.outline.enabled !== false && (style.outline.width || 0) > 0;
  if (hasOutline) {
    ctx.lineWidth = Math.max(1.5, (style.outline.width || 5) * scaleRatio);
    ctx.strokeStyle = style.outline.color || '#000000';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(displayText, 0, 0);
  } else if (!style.background || style.background.mode === 'none') {
    // If no background AND no outline was specified, provide a subtle dark halo so white text is NEVER invisible on light photos
    ctx.lineWidth = Math.max(1, 2 * scaleRatio);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineJoin = 'round';
    ctx.strokeText(displayText, 0, 0);
  }

  // Clear shadow before fill so shadow isn't applied twice
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = style.fillColor || '#ffffff';
  ctx.fillText(displayText, 0, 0);

  ctx.restore();
}

/**
 * Render a photo at its original full native resolution with all its stamps flattened
 */
export async function renderFullResolutionPhoto(
  photo: PhotoItem,
  stamps: Stamp[],
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95
): Promise<Blob> {
  const img = await loadImage(photo.dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || photo.width || 1200;
  canvas.height = img.naturalHeight || photo.height || 900;

  const ctx = canvas.getContext('2d', { alpha: format === 'image/png' })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw background image at full resolution
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Filter stamps for this photo and order by sequenceIndex
  const photoStamps = stamps
    .filter((s) => s.photoId === photo.id)
    .sort((a, b) => a.sequenceIndex - b.sequenceIndex);

  // Render each stamp
  for (const stamp of photoStamps) {
    renderStampOnCanvas(ctx, stamp, canvas.width, canvas.height);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create image blob from canvas'));
      },
      format,
      format === 'image/jpeg' ? quality : undefined
    );
  });
}

export interface ExportProgress {
  current: number;
  total: number;
  currentPhotoName: string;
}

export interface ExportResult {
  zipBlob?: Blob;
  items: Array<{
    photoId: string;
    originalName: string;
    exportName: string;
    blob: Blob;
    url: string;
  }>;
}

/**
 * Exports all photos in the project with stamps permanently flattened,
 * creating high-resolution Blobs and an optional JSZip archive.
 */
export async function exportAllPhotos(
  photos: PhotoItem[],
  stamps: Stamp[],
  format: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality: number = 0.95,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const ext = format === 'image/png' ? 'png' : 'jpg';
  const zip = new JSZip();
  const resultItems: ExportResult['items'] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total: photos.length,
        currentPhotoName: photo.name,
      });
    }

    const blob = await renderFullResolutionPhoto(photo, stamps, format, quality);

    // Format export file name: IMG_1234_numbered.jpg
    const baseName = photo.name.replace(/\.[^/.]+$/, '');
    const exportName = `${baseName}_numbered.${ext}`;

    const url = URL.createObjectURL(blob);
    resultItems.push({
      photoId: photo.id,
      originalName: photo.name,
      exportName,
      blob,
      url,
    });

    zip.file(exportName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  return {
    zipBlob,
    items: resultItems,
  };
}

/**
 * Triggers a browser download for a blob
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
