import { CustomFont } from '../types';
import { listCustomFonts, saveCustomFont, deleteCustomFont } from './storage';

const loadedFontFamilies = new Set<string>();

/**
 * Loads a single CustomFont into the browser document.fonts set
 */
export async function loadCustomFontToDocument(font: CustomFont): Promise<boolean> {
  if (loadedFontFamilies.has(font.fontFamily)) {
    return true;
  }
  try {
    const fontFace = new FontFace(font.fontFamily, `url(${font.dataUrl})`);
    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    loadedFontFamilies.add(font.fontFamily);
    return true;
  } catch (err) {
    console.error(`Failed to load custom font ${font.name}:`, err);
    return false;
  }
}

/**
 * Initializes all stored custom fonts on app boot
 */
export async function initStoredFonts(): Promise<CustomFont[]> {
  try {
    const fonts = await listCustomFonts();
    for (const font of fonts) {
      await loadCustomFontToDocument(font);
    }
    return fonts;
  } catch (err) {
    console.error('Failed to initialize stored fonts:', err);
    return [];
  }
}

/**
 * Processes an imported TTF/OTF File from user input
 */
export async function importFontFromFile(file: File, customName?: string): Promise<CustomFont> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'ttf' && ext !== 'otf') {
    throw new Error('Unsupported font format. Please select a .TTF or .OTF font file.');
  }

  const format = ext === 'otf' ? 'opentype' : 'truetype';
  const buffer = await file.arrayBuffer();

  // Generate a safe unique CSS font family identifier
  const safeBaseName = (customName || file.name.replace(/\.[^/.]+$/, ''))
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueId = `font_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fontFamilyName = `UserFont_${safeBaseName}_${uniqueId}`;

  // Validate the font by attempting to load it via FontFace API
  try {
    const fontFace = new FontFace(fontFamilyName, buffer);
    const loaded = await fontFace.load();
    document.fonts.add(loaded);
    loadedFontFamilies.add(fontFamilyName);
  } catch (err) {
    throw new Error(`The file "${file.name}" is not a valid TrueType or OpenType font or could not be decoded.`);
  }

  // Convert to Data URL for persistent local storage in IndexedDB
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const customFont: CustomFont = {
    id: uniqueId,
    name: customName || file.name.replace(/\.[^/.]+$/, ''),
    fileName: file.name,
    fontFamily: fontFamilyName,
    dataUrl: base64,
    format,
    importedAt: Date.now(),
  };

  await saveCustomFont(customFont);
  return customFont;
}

/**
 * Deletes an imported font from IndexedDB
 */
export async function removeCustomFont(id: string): Promise<void> {
  await deleteCustomFont(id);
}
