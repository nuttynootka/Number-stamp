export type BackgroundShape = 'none' | 'rectangle' | 'rounded-rect' | 'circle' | 'oval' | 'pill' | 'badge';

export type BackgroundMode = 'none' | 'solid' | 'translucent' | 'gradient';

export type StickerShape =
  | 'none'
  | 'circle'
  | 'square'
  | 'rounded-square'
  | 'squircle'
  | 'hexagon'
  | 'octagon'
  | 'shield'
  | 'starburst'
  | 'diamond'
  | 'rosette'
  | 'tag'
  | 'badge';

export type StickerDesign =
  | 'metallic-gold'
  | 'metallic-silver'
  | 'metallic-bronze'
  | 'metallic-rose-gold'
  | 'metallic-chrome'
  | 'enamel-red'
  | 'enamel-blue'
  | 'enamel-emerald'
  | 'enamel-purple'
  | 'enamel-amber'
  | 'matte-carbon'
  | 'neon-cyan'
  | 'neon-pink'
  | 'clean-white'
  | 'custom';

export interface StickerConfig {
  enabled: boolean;
  shape: StickerShape;
  design: StickerDesign;
  primaryColor: string;
  secondaryColor?: string;
  borderColor?: string;
  borderWidth: number; // in px
  doubleBorder?: boolean;
  innerRimColor?: string;
  shine?: boolean; // gloss metallic light sweep
  padding: number; // padding around text (px)
  opacity: number; // 0 to 1
  hasShadow?: boolean;
  radius?: number; // corner roundness for box shapes
}

export interface ShadowConfig {
  enabled: boolean;
  color: string;
  opacity: number; // 0 to 1
  blur: number; // in px
  offsetX: number;
  offsetY: number;
}

export interface OutlineConfig {
  enabled: boolean;
  color: string;
  width: number; // in px
}

export interface BackgroundConfig {
  mode: BackgroundMode;
  shape: BackgroundShape;
  color: string;
  color2?: string; // for gradient
  opacity: number; // 0 to 1
  paddingX: number; // px
  paddingY: number; // px
  borderRadius: number; // px
  borderWidth: number; // px
  borderColor: string;
  hasShadow: boolean;
}

export interface StampStyle {
  // Font & text
  fontFamily: string;
  customFontId?: string;
  fontWeight: string; // '100' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
  fontStyle: 'normal' | 'italic';
  fontSize: number; // relative base size (e.g., 36)
  fillColor: string;
  opacity: number; // 0 to 1
  letterSpacing: number; // px
  lineHeight: number; // e.g. 1.1
  rotation: number; // degrees -180 to 180

  // Outlines
  outline: OutlineConfig;
  secondOutline: OutlineConfig;

  // Shadow
  shadow: ShadowConfig;

  // Background
  background: BackgroundConfig;

  // Background Sticker
  sticker?: StickerConfig;
}

export interface Stamp {
  id: string;
  photoId: string;
  text: string;
  sequenceIndex: number; // numerical index when placed
  // Normalized coordinates (0 to 1) relative to full photo dimensions
  x: number;
  y: number;
  scale: number; // user custom scale multiplier
  rotation: number; // user rotation override
  style: StampStyle;
  createdAt: number;
}

export interface PhotoItem {
  id: string;
  name: string;
  dataUrl: string; // base64 or blob URL
  width: number;
  height: number;
  stampsCount?: number;
  order: number;
}

export interface NumberingConfig {
  startNumber: number;
  increment: number;
  prefix: string;
  suffix: string;
  padding: number; // 1, 2, 3, 4 (e.g. 1 -> "1", 2 -> "01", 3 -> "001")
  currentNumber: number;
}

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  fontFamily: string; // generated family name
  dataUrl: string; // base64 font data for persistent load
  format: 'truetype' | 'opentype';
  importedAt: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  photos: PhotoItem[];
  stamps: Stamp[];
  numberingConfig: NumberingConfig;
  defaultStyle: StampStyle;
  recentColors: string[];
  favoriteColors: string[];
}

export type EditorMode = 'place' | 'select' | 'pan';

export interface HistoryAction {
  type: 'add_stamp' | 'delete_stamp' | 'modify_stamp' | 'renumber_all';
  stamp?: Stamp;
  previousStamp?: Stamp;
  previousStamps?: Stamp[];
  nextStamps?: Stamp[];
  previousNumberingConfig?: NumberingConfig;
  nextNumberingConfig?: NumberingConfig;
}
