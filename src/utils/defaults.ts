import { StampStyle, NumberingConfig, BackgroundConfig, OutlineConfig, ShadowConfig, StickerConfig, StickerShape, StickerDesign } from '../types';

export const DEFAULT_SHADOW: ShadowConfig = {
  enabled: false,
  color: '#000000',
  opacity: 0.7,
  blur: 4,
  offsetX: 2,
  offsetY: 2,
};

export const DEFAULT_OUTLINE: OutlineConfig = {
  enabled: true,
  color: '#000000',
  width: 5,
};

export const DEFAULT_SECOND_OUTLINE: OutlineConfig = {
  enabled: false,
  color: '#ffffff',
  width: 3,
};

export const DEFAULT_BACKGROUND: BackgroundConfig = {
  mode: 'none',
  shape: 'rounded-rect',
  color: '#000000',
  color2: '#1e293b',
  opacity: 0.75,
  paddingX: 8,
  paddingY: 4,
  borderRadius: 6,
  borderWidth: 0,
  borderColor: '#ffffff',
  hasShadow: false,
};

export const DEFAULT_STICKER: StickerConfig = {
  enabled: false,
  shape: 'circle',
  design: 'metallic-gold',
  primaryColor: '#D4AF37',
  secondaryColor: '#FFF4A3',
  borderColor: '#996515',
  borderWidth: 2,
  doubleBorder: true,
  innerRimColor: '#FFDF73',
  shine: true,
  padding: 6,
  opacity: 1,
  hasShadow: true,
  radius: 6,
};

export const DEFAULT_STAMP_STYLE: StampStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: '800',
  fontStyle: 'normal',
  fontSize: 22,
  fillColor: '#FFFFFF',
  opacity: 1,
  letterSpacing: 0,
  lineHeight: 1.1,
  rotation: 0,
  outline: { ...DEFAULT_OUTLINE },
  secondOutline: { ...DEFAULT_SECOND_OUTLINE },
  shadow: { ...DEFAULT_SHADOW },
  background: { ...DEFAULT_BACKGROUND },
  sticker: { ...DEFAULT_STICKER },
};

export interface StickerPreset {
  id: string;
  name: string;
  category: 'metallic' | 'enamel' | 'shape' | 'badge' | 'modern';
  shape: StickerShape;
  design: StickerDesign;
  primaryColor: string;
  secondaryColor?: string;
  borderColor?: string;
  borderWidth: number;
  doubleBorder?: boolean;
  innerRimColor?: string;
  shine?: boolean;
  hasShadow?: boolean;
  padding?: number;
  textColorSuggestion?: string;
  outlineColorSuggestion?: string;
}

export const STICKER_PRESETS: StickerPreset[] = [
  {
    id: 'gold-coin',
    name: 'Gold Coin',
    category: 'metallic',
    shape: 'circle',
    design: 'metallic-gold',
    primaryColor: '#D4AF37',
    secondaryColor: '#FFF4A3',
    borderColor: '#8A5D0F',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFE072',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#1E1405',
    outlineColorSuggestion: '#FFDF73',
  },
  {
    id: 'silver-medal',
    name: 'Silver Medal',
    category: 'metallic',
    shape: 'circle',
    design: 'metallic-silver',
    primaryColor: '#D0D7DE',
    secondaryColor: '#FFFFFF',
    borderColor: '#6E7781',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFFFFF',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#0F172A',
    outlineColorSuggestion: '#FFFFFF',
  },
  {
    id: 'bronze-seal',
    name: 'Bronze Seal',
    category: 'metallic',
    shape: 'circle',
    design: 'metallic-bronze',
    primaryColor: '#CD7F32',
    secondaryColor: '#F5C28C',
    borderColor: '#693710',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FAD8A8',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#FFFFFF',
    outlineColorSuggestion: '#4A2508',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold Squircle',
    category: 'metallic',
    shape: 'squircle',
    design: 'metallic-rose-gold',
    primaryColor: '#C48189',
    secondaryColor: '#FEE5E8',
    borderColor: '#783A44',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFD4DA',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#3D151C',
    outlineColorSuggestion: '#FFE4E8',
  },
  {
    id: 'chrome-badge',
    name: 'Mirror Chrome',
    category: 'metallic',
    shape: 'circle',
    design: 'metallic-chrome',
    primaryColor: '#8E9EAB',
    secondaryColor: '#EEF2F3',
    borderColor: '#374151',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFFFFF',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#0F172A',
    outlineColorSuggestion: '#FFFFFF',
  },
  {
    id: 'gold-square',
    name: 'Royal Gold Square',
    category: 'metallic',
    shape: 'square',
    design: 'metallic-gold',
    primaryColor: '#C99726',
    secondaryColor: '#FFF2A8',
    borderColor: '#784C07',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFE785',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#1C1204',
    outlineColorSuggestion: '#FFDF73',
  },
  {
    id: 'silver-rounded-square',
    name: 'Brushed Steel Box',
    category: 'metallic',
    shape: 'rounded-square',
    design: 'metallic-silver',
    primaryColor: '#B0BAC2',
    secondaryColor: '#FFFFFF',
    borderColor: '#475569',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFFFFF',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#0F172A',
    outlineColorSuggestion: '#E2E8F0',
  },
  {
    id: 'gold-hexagon',
    name: 'Bullion Hexagon',
    category: 'shape',
    shape: 'hexagon',
    design: 'metallic-gold',
    primaryColor: '#D4AF37',
    secondaryColor: '#FFF4A3',
    borderColor: '#8A5D0F',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFE072',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#1C1204',
    outlineColorSuggestion: '#FFF3A8',
  },
  {
    id: 'gold-starburst',
    name: 'Gold Notary Seal',
    category: 'badge',
    shape: 'starburst',
    design: 'metallic-gold',
    primaryColor: '#DAA520',
    secondaryColor: '#FFF9D2',
    borderColor: '#805300',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFE875',
    shine: true,
    hasShadow: true,
    padding: 7,
    textColorSuggestion: '#241400',
    outlineColorSuggestion: '#FFEAA0',
  },
  {
    id: 'ruby-shield',
    name: 'Ruby Shield',
    category: 'enamel',
    shape: 'shield',
    design: 'enamel-red',
    primaryColor: '#DC2626',
    secondaryColor: '#EF4444',
    borderColor: '#D4AF37',
    borderWidth: 2,
    doubleBorder: true,
    innerRimColor: '#FDE047',
    shine: true,
    hasShadow: true,
    padding: 7,
    textColorSuggestion: '#FFFFFF',
    outlineColorSuggestion: '#7F1D1D',
  },
  {
    id: 'sapphire-rosette',
    name: 'Sapphire Rosette',
    category: 'badge',
    shape: 'rosette',
    design: 'enamel-blue',
    primaryColor: '#1D4ED8',
    secondaryColor: '#3B82F6',
    borderColor: '#D4D7DE',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFFFFF',
    shine: true,
    hasShadow: true,
    padding: 7,
    textColorSuggestion: '#FFFFFF',
    outlineColorSuggestion: '#1E3A8A',
  },
  {
    id: 'emerald-octagon',
    name: 'Emerald Octagon',
    category: 'shape',
    shape: 'octagon',
    design: 'enamel-emerald',
    primaryColor: '#059669',
    secondaryColor: '#10B981',
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FDE047',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#FFFFFF',
    outlineColorSuggestion: '#064E3B',
  },
  {
    id: 'platinum-diamond',
    name: 'Platinum Diamond',
    category: 'shape',
    shape: 'diamond',
    design: 'metallic-silver',
    primaryColor: '#E2E8F0',
    secondaryColor: '#FFFFFF',
    borderColor: '#475569',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFFFFF',
    shine: true,
    hasShadow: true,
    padding: 7,
    textColorSuggestion: '#0F172A',
    outlineColorSuggestion: '#FFFFFF',
  },
  {
    id: 'matte-carbon',
    name: 'Matte Stealth Carbon',
    category: 'modern',
    shape: 'rounded-square',
    design: 'matte-carbon',
    primaryColor: '#18181B',
    secondaryColor: '#27272A',
    borderColor: '#FACC15',
    borderWidth: 1.5,
    doubleBorder: false,
    shine: false,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#FACC15',
    outlineColorSuggestion: '#000000',
  },
  {
    id: 'neon-cyan-hex',
    name: 'Cyber Neon Cyan',
    category: 'modern',
    shape: 'hexagon',
    design: 'neon-cyan',
    primaryColor: '#090D16',
    secondaryColor: '#0F172A',
    borderColor: '#06B6D4',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#22D3EE',
    shine: false,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#22D3EE',
    outlineColorSuggestion: '#083344',
  },
  {
    id: 'clean-white-circle',
    name: 'Clean White Pill',
    category: 'modern',
    shape: 'circle',
    design: 'clean-white',
    primaryColor: '#FFFFFF',
    secondaryColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    doubleBorder: false,
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#0F172A',
    outlineColorSuggestion: '#FFFFFF',
  },
  {
    id: 'royal-purple-badge',
    name: 'Imperial Purple Badge',
    category: 'enamel',
    shape: 'badge',
    design: 'enamel-purple',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    borderColor: '#FDE047',
    borderWidth: 2,
    doubleBorder: true,
    innerRimColor: '#FEF08A',
    shine: true,
    hasShadow: true,
    padding: 7,
    textColorSuggestion: '#FFFFFF',
    outlineColorSuggestion: '#4C1D95',
  },
  {
    id: 'price-tag',
    name: 'Golden Asset Tag',
    category: 'shape',
    shape: 'tag',
    design: 'metallic-gold',
    primaryColor: '#D4AF37',
    secondaryColor: '#FFF4A3',
    borderColor: '#8A5D0F',
    borderWidth: 1.5,
    doubleBorder: true,
    innerRimColor: '#FFE072',
    shine: true,
    hasShadow: true,
    padding: 6,
    textColorSuggestion: '#1C1204',
    outlineColorSuggestion: '#FFDF73',
  },
];

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  style: Partial<StampStyle>;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'high-contrast',
    name: 'High Contrast (Default)',
    description: 'Crisp white fill with thick black outline',
    style: {
      fillColor: '#FFFFFF',
      fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
      fontWeight: '800',
      fontSize: 42,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: true, color: '#000000', width: 6 },
      secondOutline: { enabled: false, color: '#ffffff', width: 2 },
      shadow: { enabled: false, color: '#000000', opacity: 0.6, blur: 4, offsetX: 2, offsetY: 2 },
      background: { mode: 'none', shape: 'none', color: '#000000', opacity: 0.8, paddingX: 10, paddingY: 6, borderRadius: 6, borderWidth: 0, borderColor: '#ffffff', hasShadow: false },
    },
  },
  {
    id: 'dark-photo',
    name: 'Dark Photo',
    description: 'White fill, black outline & soft shadow',
    style: {
      fillColor: '#FFFFFF',
      fontWeight: '800',
      fontSize: 42,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: true, color: '#000000', width: 5 },
      secondOutline: { enabled: false, color: '#000000', width: 2 },
      shadow: { enabled: true, color: '#000000', opacity: 0.8, blur: 6, offsetX: 3, offsetY: 3 },
      background: { mode: 'none', shape: 'none', color: '#000000', opacity: 0.8, paddingX: 10, paddingY: 6, borderRadius: 6, borderWidth: 0, borderColor: '#ffffff', hasShadow: false },
    },
  },
  {
    id: 'light-photo',
    name: 'Light Photo',
    description: 'Bold black fill with crisp white outline',
    style: {
      fillColor: '#000000',
      fontWeight: '900',
      fontSize: 42,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: true, color: '#FFFFFF', width: 5 },
      secondOutline: { enabled: false, color: '#000000', width: 2 },
      shadow: { enabled: false, color: '#000000', opacity: 0.4, blur: 3, offsetX: 1, offsetY: 1 },
      background: { mode: 'none', shape: 'none', color: '#000000', opacity: 0.8, paddingX: 10, paddingY: 6, borderRadius: 6, borderWidth: 0, borderColor: '#ffffff', hasShadow: false },
    },
  },
  {
    id: 'label-box',
    name: 'Label Box',
    description: 'High-contrast text in dark translucent box',
    style: {
      fillColor: '#FFFFFF',
      fontWeight: '800',
      fontSize: 38,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: true, color: '#000000', width: 2 },
      secondOutline: { enabled: false, color: '#ffffff', width: 0 },
      shadow: { enabled: false, color: '#000000', opacity: 0.5, blur: 4, offsetX: 2, offsetY: 2 },
      background: {
        mode: 'translucent',
        shape: 'rounded-rect',
        color: '#0f172a',
        opacity: 0.88,
        paddingX: 14,
        paddingY: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#38bdf8',
        hasShadow: true,
      },
    },
  },
  {
    id: 'badge-pill',
    name: 'Vibrant Badge',
    description: 'Amber badge with bold contrast',
    style: {
      fillColor: '#0f172a',
      fontWeight: '900',
      fontSize: 36,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: false, color: '#ffffff', width: 0 },
      secondOutline: { enabled: false, color: '#ffffff', width: 0 },
      shadow: { enabled: true, color: '#000000', opacity: 0.5, blur: 4, offsetX: 2, offsetY: 2 },
      background: {
        mode: 'solid',
        shape: 'pill',
        color: '#f59e0b',
        opacity: 1,
        paddingX: 16,
        paddingY: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#ffffff',
        hasShadow: true,
      },
    },
  },
  {
    id: 'circle-marker',
    name: 'Circle Marker',
    description: 'Numbered circular point pin',
    style: {
      fillColor: '#FFFFFF',
      fontWeight: '900',
      fontSize: 36,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: false, color: '#000000', width: 0 },
      secondOutline: { enabled: false, color: '#000000', width: 0 },
      shadow: { enabled: true, color: '#000000', opacity: 0.7, blur: 5, offsetX: 2, offsetY: 2 },
      background: {
        mode: 'solid',
        shape: 'circle',
        color: '#ef4444',
        opacity: 0.95,
        paddingX: 12,
        paddingY: 12,
        borderRadius: 999,
        borderWidth: 2.5,
        borderColor: '#ffffff',
        hasShadow: true,
      },
    },
  },
  {
    id: 'double-outline',
    name: 'Double Outline',
    description: 'White text + black stroke + blue outer stroke',
    style: {
      fillColor: '#FFFFFF',
      fontWeight: '900',
      fontSize: 42,
      opacity: 1,
      letterSpacing: 0,
      fontStyle: 'normal',
      outline: { enabled: true, color: '#000000', width: 5 },
      secondOutline: { enabled: true, color: '#38bdf8', width: 3 },
      shadow: { enabled: true, color: '#000000', opacity: 0.6, blur: 4, offsetX: 2, offsetY: 2 },
      background: { mode: 'none', shape: 'none', color: '#000000', opacity: 0.8, paddingX: 10, paddingY: 6, borderRadius: 6, borderWidth: 0, borderColor: '#ffffff', hasShadow: false },
    },
  },
];

export interface BuiltInFont {
  name: string;
  family: string;
  category: 'Clean Sans-Serif' | 'Serif' | 'Monospace' | 'Condensed / Display' | 'Decorative / Rounded';
  preview: string;
}

export const BUILT_IN_FONTS: BuiltInFont[] = [
  { name: 'Inter (System Default)', family: 'Inter, system-ui, -apple-system, sans-serif', category: 'Clean Sans-Serif', preview: '01' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", category: 'Clean Sans-Serif', preview: '01' },
  { name: 'Montserrat Bold', family: "'Montserrat', sans-serif", category: 'Clean Sans-Serif', preview: '01' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", category: 'Condensed / Display', preview: '01' },
  { name: 'Oswald Condensed', family: "'Oswald', sans-serif", category: 'Condensed / Display', preview: '01' },
  { name: 'Rubik Mono One (Ultra Bold)', family: "'Rubik Mono One', sans-serif", category: 'Condensed / Display', preview: '01' },
  { name: 'Fira Code', family: "'Fira Code', monospace", category: 'Monospace', preview: '01' },
  { name: 'Courier New', family: "'Courier New', Courier, monospace", category: 'Monospace', preview: '01' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", category: 'Serif', preview: '01' },
  { name: 'Cinzel Classical', family: "'Cinzel', serif", category: 'Serif', preview: '01' },
  { name: 'Pacifico Script', family: "'Pacifico', cursive", category: 'Decorative / Rounded', preview: '01' },
];

export const DEFAULT_NUMBERING_CONFIG: NumberingConfig = {
  startNumber: 1,
  increment: 1,
  prefix: '',
  suffix: '',
  padding: 1,
  currentNumber: 1,
};

export const RECENT_COLORS_DEFAULT = [
  '#FFFFFF',
  '#000000',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

export const FAVORITE_COLORS_DEFAULT = [
  '#FFFFFF',
  '#000000',
  '#FACC15',
  '#38BDF8',
  '#F43F5E',
];

export function formatStampNumber(num: number, config: NumberingConfig): string {
  const numStr = String(num);
  const padded = config.padding > 1 ? numStr.padStart(config.padding, '0') : numStr;
  return `${config.prefix}${padded}${config.suffix}`;
}

/**
 * Creates a sample high-quality collage image (4-quadrant layout with photographic scenes)
 * to allow immediate hands-on testing of numbering multiple collage panels!
 */
export function createSampleCollageDataUrl(): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1600, 1200);

    const margin = 20;
    const gap = 16;
    const colW = (1600 - margin * 2 - gap) / 2;
    const rowH = (1200 - margin * 2 - gap) / 2;

    const panels = [
      { x: margin, y: margin, w: colW, h: rowH, title: 'Panel A: Landscape Meadow', c1: '#064e3b', c2: '#047857', c3: '#10b981' },
      { x: margin + colW + gap, y: margin, w: colW, h: rowH, title: 'Panel B: Architecture Detail', c1: '#1e1b4b', c2: '#3730a3', c3: '#6366f1' },
      { x: margin, y: margin + rowH + gap, w: colW, h: rowH, title: 'Panel C: Macro Flora', c1: '#701a75', c2: '#a21caf', c3: '#d946ef' },
      { x: margin + colW + gap, y: margin + rowH + gap, w: colW, h: rowH, title: 'Panel D: Desert Dunes', c1: '#78350f', c2: '#b45309', c3: '#f59e0b' },
    ];

    panels.forEach((p, idx) => {
      // Gradient background
      const grad = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      grad.addColorStop(0, p.c1);
      grad.addColorStop(0.5, p.c2);
      grad.addColorStop(1, p.c3);
      ctx.fillStyle = grad;
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // Texture grid / circles for visual interest
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.strokeRect(p.x + 30 + i * 50, p.y + 30 + i * 30, p.w - 60 - i * 100, p.h - 60 - i * 60);
      }

      // Panel label
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(p.x + 20, p.y + p.h - 70, p.w - 40, 50);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(`${idx + 1}. ${p.title} (Tap to number)`, p.x + 36, p.y + p.h - 38);
    });

    // Outer border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 1592, 1192);

    resolve({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      width: 1600,
      height: 1200,
    });
  });
}

/**
 * Creates a sample single portrait photo data URL
 */
export function createSamplePortraitDataUrl(): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1440);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.4, '#1e293b');
    grad.addColorStop(1, '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1440);

    // Some stylized geometric elements
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.arc(540, 720, 380, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sample Portrait Photo', 540, 680);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Tap anywhere to place consecutive numbers', 540, 730);

    resolve({
      dataUrl: canvas.toDataURL('image/jpeg', 0.92),
      width: 1080,
      height: 1440,
    });
  });
}
