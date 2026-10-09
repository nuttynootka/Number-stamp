import React, { useState, useRef, useEffect } from 'react';
import {
  StampStyle,
  CustomFont,
  BackgroundShape,
  BackgroundMode,
  StickerConfig,
  StickerShape,
  StickerDesign,
  Stamp,
} from '../types';
import {
  STYLE_PRESETS,
  BUILT_IN_FONTS,
  RECENT_COLORS_DEFAULT,
  FAVORITE_COLORS_DEFAULT,
  STICKER_PRESETS,
  DEFAULT_STICKER,
  StickerPreset,
} from '../utils/defaults';
import { renderStampOnCanvas } from '../utils/export';
import {
  X,
  Type,
  Palette,
  Sparkles,
  Layers,
  Upload,
  RotateCw,
  Sliders,
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  Bookmark,
  Award,
  Shield,
  Circle,
  Square,
  Hexagon,
} from 'lucide-react';

interface StylePanelProps {
  isOpen: boolean;
  onClose: () => void;
  style: StampStyle;
  onChangeStyle: (newStyle: StampStyle) => void;
  currentPreviewText: string;
  isEditingSelectedStamp: boolean;
  onApplyToAll?: () => void;
  onSetAsDefault?: () => void;
  customFonts: CustomFont[];
  onImportFontFile: (file: File) => Promise<void>;
  onDeleteCustomFont: (fontId: string) => Promise<void>;
  onRenameCustomFont: (fontId: string, newName: string) => Promise<void>;
  recentColors: string[];
  favoriteColors: string[];
  onAddFavoriteColor: (color: string) => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  isOpen,
  onClose,
  style,
  onChangeStyle,
  currentPreviewText,
  isEditingSelectedStamp,
  onApplyToAll,
  onSetAsDefault,
  customFonts,
  onImportFontFile,
  onDeleteCustomFont,
  onRenameCustomFont,
  recentColors = RECENT_COLORS_DEFAULT,
  favoriteColors = FAVORITE_COLORS_DEFAULT,
  onAddFavoriteColor,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'typography' | 'outline' | 'sticker' | 'background' | 'fonts'>('presets');
  const [stickerFilter, setStickerFilter] = useState<'all' | 'metallic' | 'shape' | 'enamel' | 'badge' | 'modern'>('all');
  const [fontSearch, setFontSearch] = useState('');
  const [fontImportError, setFontImportError] = useState<string | null>(null);
  const [editingFontId, setEditingFontId] = useState<string | null>(null);
  const [newFontName, setNewFontName] = useState('');

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Live Canvas Preview for the Stamp
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 240;
    const h = 84;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const dummyStamp: Stamp = {
      id: 'preview',
      photoId: 'preview',
      text: currentPreviewText || '01',
      sequenceIndex: 1,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotation: 0,
      style: style,
      createdAt: Date.now(),
    };

    renderStampOnCanvas(ctx, dummyStamp, w, h, 0, 0);
    ctx.restore();
  }, [style, currentPreviewText]);

  if (!isOpen) return null;

  const update = (partial: Partial<StampStyle>) => {
    onChangeStyle({ ...style, ...partial });
  };

  const updateOutline = (partial: Partial<StampStyle['outline']>) => {
    onChangeStyle({
      ...style,
      outline: { ...style.outline, ...partial },
    });
  };

  const updateSecondOutline = (partial: Partial<StampStyle['secondOutline']>) => {
    onChangeStyle({
      ...style,
      secondOutline: { ...style.secondOutline, ...partial },
    });
  };

  const updateShadow = (partial: Partial<StampStyle['shadow']>) => {
    onChangeStyle({
      ...style,
      shadow: { ...style.shadow, ...partial },
    });
  };

  const updateBackground = (partial: Partial<StampStyle['background']>) => {
    onChangeStyle({
      ...style,
      background: { ...style.background, ...partial },
    });
  };

  const updateSticker = (partial: Partial<StickerConfig>) => {
    const current = style.sticker || { ...DEFAULT_STICKER };
    onChangeStyle({
      ...style,
      sticker: { ...current, ...partial },
    });
  };

  const applyStickerPreset = (preset: StickerPreset) => {
    const current = style.sticker || { ...DEFAULT_STICKER };
    const newSticker: StickerConfig = {
      ...current,
      enabled: true,
      shape: preset.shape,
      design: preset.design,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      borderColor: preset.borderColor,
      borderWidth: preset.borderWidth,
      doubleBorder: preset.doubleBorder !== false,
      innerRimColor: preset.innerRimColor,
      shine: preset.shine !== false,
      hasShadow: preset.hasShadow !== false,
      padding: preset.padding || 16,
      opacity: 1,
    };

    const updates: Partial<StampStyle> = {
      sticker: newSticker,
      ...(preset.textColorSuggestion ? { fillColor: preset.textColorSuggestion } : {}),
      ...(preset.outlineColorSuggestion
        ? { outline: { ...style.outline, color: preset.outlineColorSuggestion, width: Math.max(2, style.outline.width) } }
        : {}),
    };
    onChangeStyle({ ...style, ...updates });
  };

  const disableSticker = () => {
    if (!style.sticker) return;
    onChangeStyle({
      ...style,
      sticker: { ...style.sticker, enabled: false },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontImportError(null);
    try {
      await onImportFontFile(file);
      e.target.value = '';
    } catch (err: any) {
      setFontImportError(err.message || 'Failed to import font');
    }
  };

  // Filter built-in fonts
  const filteredFonts = BUILT_IN_FONTS.filter((f) =>
    f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[85vh] flex flex-col bg-slate-900 border-t border-slate-800 shadow-2xl rounded-t-3xl transition-transform duration-300">
      {/* Drag handle / Header */}
      <div className="flex flex-col items-center pt-2 pb-2 px-4 border-b border-slate-800/80">
        <div className="w-10 h-1 bg-slate-700 rounded-full mb-2" />
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-slate-100">
              {isEditingSelectedStamp ? 'Edit Selected Stamp Style' : 'Default Stamp Style'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingSelectedStamp && onApplyToAll && (
              <button
                onClick={onApplyToAll}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 active:scale-95 transition-all"
                title="Apply this stamp's style to all other stamps in project"
              >
                Apply to All
              </button>
            )}
            {isEditingSelectedStamp && onSetAsDefault && (
              <button
                onClick={onSetAsDefault}
                className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg border border-amber-400/30 active:scale-95 transition-all"
                title="Save as default style for upcoming stamps"
              >
                Set as Default
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close style panel"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        <div className="w-full mt-2 py-2 px-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden min-h-[92px]">
          <canvas ref={previewCanvasRef} className="block max-w-full drop-shadow-md" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full mt-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'presets', label: 'Presets', icon: Sparkles },
            { id: 'typography', label: 'Font & Text', icon: Type },
            { id: 'outline', label: 'Outlines & Shadow', icon: Palette },
            { id: 'sticker', label: 'Stickers', icon: Award },
            { id: 'background', label: 'Simple Background', icon: Layers },
            { id: 'fonts', label: 'Imported Fonts', icon: Upload },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200">
        {/* PRESETS TAB */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Select a battle-tested contrast preset optimized for mobile photos and multi-panel collages:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onChangeStyle({ ...style, ...preset.style } as StampStyle)}
                  className="flex flex-col p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-left active:scale-[0.98] transition-all group"
                >
                  <div className="font-semibold text-xs text-slate-100 group-hover:text-amber-300 mb-1">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === 'typography' && (
          <div className="space-y-4">
            {/* Color & Favorites */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Text Fill Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={style.fillColor}
                  onChange={(e) => update({ fillColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={style.fillColor}
                  onChange={(e) => update({ fillColor: e.target.value })}
                  className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white text-center"
                />
                <button
                  onClick={() => onAddFavoriteColor(style.fillColor)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1"
                  title="Add to favorites"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Favorite</span>
                </button>
              </div>

              {/* Recent & Favorite Swatches */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-400 mr-1">Palettes:</span>
                {[...favoriteColors, ...recentColors.slice(0, 5)].map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    onClick={() => update({ fillColor: c })}
                    style={{ backgroundColor: c }}
                    className="w-6 h-6 rounded-md border border-slate-600 shadow-sm active:scale-90 transition-transform"
                  />
                ))}
              </div>
            </div>

            {/* Font Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Font Family
                </label>
                <input
                  type="text"
                  placeholder="Search fonts..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  className="w-32 px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[11px] text-white"
                />
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-xl p-1 bg-slate-950/60">
                {/* Custom fonts first */}
                {customFonts.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => update({ fontFamily: f.fontFamily, customFontId: f.id })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      style.fontFamily === f.fontFamily
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{f.name} (Imported)</span>
                    <span style={{ fontFamily: f.fontFamily }} className="text-sm font-bold">
                      {currentPreviewText || '01'}
                    </span>
                  </button>
                ))}

                {filteredFonts.map((font) => (
                  <button
                    key={font.name}
                    onClick={() => update({ fontFamily: font.family, customFontId: undefined })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      style.fontFamily === font.family
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-left truncate">
                      <div className="truncate">{font.name}</div>
                      <div className="text-[10px] opacity-70">{font.category}</div>
                    </div>
                    <span style={{ fontFamily: font.family }} className="text-sm font-bold">
                      {currentPreviewText || '01'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight & Style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Weight
                </label>
                <select
                  value={style.fontWeight}
                  onChange={(e) => update({ fontWeight: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="100">Thin (100)</option>
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semi-Bold (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra-Bold (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Style
                </label>
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => update({ fontStyle: 'normal' })}
                    className={`flex-1 py-1 text-xs font-medium rounded ${
                      style.fontStyle === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    Regular
                  </button>
                  <button
                    onClick={() => update({ fontStyle: 'italic' })}
                    className={`flex-1 py-1 text-xs italic font-medium rounded ${
                      style.fontStyle === 'italic' ? 'bg-slate-700 text-white' : 'text-slate-400'
                    }`}
                  >
                    Italic
                  </button>
                </div>
              </div>
            </div>

            {/* Font Size & Numerical Input */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300">Size</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="12"
                    max="140"
                    value={style.fontSize}
                    onChange={(e) => update({ fontSize: Number(e.target.value) || 24 })}
                    className="w-14 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-center text-xs text-white"
                  />
                  <span className="text-[11px] text-slate-400">px</span>
                </div>
              </div>
              <input
                type="range"
                min="14"
                max="120"
                value={style.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-full accent-amber-400"
              />
            </div>

            {/* Rotation Control */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-slate-300">Rotation</span>
                <span className="text-slate-400">{style.rotation}°</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={style.rotation}
                  onChange={(e) => update({ rotation: Number(e.target.value) })}
                  className="flex-1 accent-amber-400"
                />
                <button
                  onClick={() => update({ rotation: 0 })}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] rounded border border-slate-700"
                >
                  0°
                </button>
                <button
                  onClick={() => update({ rotation: (style.rotation + 90) % 360 })}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 text-slate-300"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Letter Spacing & Opacity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Letter Spacing</span>
                  <span className="text-slate-400">{style.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="12"
                  value={style.letterSpacing}
                  onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Text Opacity</span>
                  <span className="text-slate-400">{Math.round(style.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={style.opacity}
                  onChange={(e) => update({ opacity: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* OUTLINES & SHADOW TAB */}
        {activeTab === 'outline' && (
          <div className="space-y-4">
            {/* Primary Outline */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">Main Outline Stroke</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={style.outline.enabled}
                    onChange={(e) => updateOutline({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              {style.outline.enabled && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.outline.color}
                      onChange={(e) => updateOutline({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{style.outline.color}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Thickness</span>
                      <span className="text-slate-300">{style.outline.width}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={style.outline.width}
                      onChange={(e) => updateOutline({ width: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Second Outer Outline */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Second Outer Outline</span>
                  <p className="text-[10px] text-slate-400">Extra outer border for busy backgrounds</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={style.secondOutline.enabled}
                    onChange={(e) => updateSecondOutline({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              {style.secondOutline.enabled && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.secondOutline.color}
                      onChange={(e) => updateSecondOutline({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{style.secondOutline.color}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Outer Thickness</span>
                      <span className="text-slate-300">{style.secondOutline.width}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="14"
                      value={style.secondOutline.width}
                      onChange={(e) => updateSecondOutline({ width: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drop Shadow */}
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">Drop Shadow</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={style.shadow.enabled}
                    onChange={(e) => updateShadow({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400"></div>
                </label>
              </div>

              {style.shadow.enabled && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.shadow.color}
                      onChange={(e) => updateShadow({ color: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-slate-300">{style.shadow.color}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Blur: {style.shadow.blur}px</span>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={style.shadow.blur}
                        onChange={(e) => updateShadow({ blur: Number(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Distance: {style.shadow.offsetY}px</span>
                      <input
                        type="range"
                        min="0"
                        max="16"
                        value={style.shadow.offsetY}
                        onChange={(e) => updateShadow({ offsetY: Number(e.target.value), offsetX: Number(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BACKGROUND SHAPE TAB */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            {/* Background Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Background Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700">
                {(['none', 'solid', 'translucent', 'gradient'] as BackgroundMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => updateBackground({ mode: m })}
                    className={`py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                      style.background.mode === m
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {style.background.mode !== 'none' && (
              <>
                {/* Shapes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Label Shape
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'rectangle', label: 'Rectangle' },
                        { id: 'rounded-rect', label: 'Rounded Box' },
                        { id: 'circle', label: 'Circle' },
                        { id: 'oval', label: 'Oval' },
                        { id: 'pill', label: 'Pill Capsule' },
                        { id: 'badge', label: 'Badge' },
                      ] as { id: BackgroundShape; label: string }[]
                    ).map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => updateBackground({ shape: shape.id })}
                        className={`p-2 rounded-xl text-xs text-center border transition-all ${
                          style.background.shape === shape.id
                            ? 'bg-slate-700 border-amber-400 text-white font-semibold shadow-sm'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {shape.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={style.background.color}
                        onChange={(e) => updateBackground({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono">{style.background.color}</span>
                    </div>
                  </div>

                  {style.background.mode === 'gradient' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Gradient End</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={style.background.color2 || '#000000'}
                          onChange={(e) => updateBackground({ color2: e.target.value })}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono">{style.background.color2}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Background Opacity</span>
                    <span className="text-slate-300">
                      {Math.round(style.background.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={style.background.opacity}
                    onChange={(e) => updateBackground({ opacity: Number(e.target.value) })}
                    className="w-full accent-amber-400"
                  />
                </div>

                {/* Padding */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Horizontal Pad: {style.background.paddingX}px</span>
                    <input
                      type="range"
                      min="4"
                      max="40"
                      value={style.background.paddingX}
                      onChange={(e) => updateBackground({ paddingX: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400">Vertical Pad: {style.background.paddingY}px</span>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={style.background.paddingY}
                      onChange={(e) => updateBackground({ paddingY: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Border Controls */}
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Shape Border</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={style.background.borderColor}
                        onChange={(e) => updateBackground({ borderColor: e.target.value })}
                        className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-[11px]">{style.background.borderWidth}px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={style.background.borderWidth}
                    onChange={(e) => updateBackground({ borderWidth: Number(e.target.value) })}
                    className="w-full accent-amber-400"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* BACKGROUND STICKER TAB */}
        {activeTab === 'sticker' && (
          <div className="space-y-4">
            {/* Top Toggle Card */}
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Background Sticker</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Combine small metallic coins, badges, and seals with your numbers
                </p>
              </div>

              <div className="flex items-center gap-2">
                {style.sticker?.enabled ? (
                  <button
                    type="button"
                    onClick={disableSticker}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-800/50 active:scale-95 transition-all"
                  >
                    Remove Sticker
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => applyStickerPreset(STICKER_PRESETS[0])}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm active:scale-95 transition-all"
                  >
                    Enable Sticker
                  </button>
                )}
              </div>
            </div>

            {/* Sticker Preset Gallery */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sticker Designs & Finishes</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {STICKER_PRESETS.length} presets
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2.5 no-scrollbar">
                {[
                  { id: 'all', label: 'All Designs' },
                  { id: 'metallic', label: 'Metallic Coins & Seals' },
                  { id: 'shape', label: 'Geometric Shapes' },
                  { id: 'badge', label: 'Rosettes & Badges' },
                  { id: 'enamel', label: 'Enamel Jewels' },
                  { id: 'modern', label: 'Modern & Stealth' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStickerFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      stickerFilter === f.id
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Grid of presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-0.5">
                {STICKER_PRESETS.filter((p) => stickerFilter === 'all' || p.category === stickerFilter || (stickerFilter === 'modern' && (p.category === 'modern' || p.id === 'matte-carbon'))).map((preset) => {
                  const isCurrent =
                    style.sticker?.enabled &&
                    style.sticker.design === preset.design &&
                    style.sticker.shape === preset.shape;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyStickerPreset(preset)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                        isCurrent
                          ? 'bg-amber-400/10 border-amber-400 ring-1 ring-amber-400/30'
                          : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        {/* Mini shape color indicator */}
                        <div
                          className="w-5 h-5 rounded-full border shadow-sm flex items-center justify-center"
                          style={{
                            background:
                              preset.design === 'metallic-gold'
                                ? 'linear-gradient(135deg, #E5C058, #855A12)'
                                : preset.design === 'metallic-silver'
                                ? 'linear-gradient(135deg, #FFFFFF, #707982)'
                                : preset.design === 'metallic-bronze'
                                ? 'linear-gradient(135deg, #F9BC88, #5E300E)'
                                : preset.design === 'metallic-rose-gold'
                                ? 'linear-gradient(135deg, #FDE2E6, #7B3845)'
                                : preset.primaryColor,
                            borderColor: preset.borderColor || '#000000',
                          }}
                        />
                        {isCurrent && <Check className="w-3.5 h-3.5 text-amber-400" />}
                      </div>

                      <div>
                        <div className="font-semibold text-xs text-white group-hover:text-amber-300 truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {preset.shape.replace('-', ' ')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customize Active Sticker Details (Visible when sticker is enabled) */}
            {style.sticker?.enabled && (
              <div className="space-y-3.5 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200">Customize Shape & Metallic Finish</span>

                {/* Shapes */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Sticker Shape</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'circle', label: 'Round' },
                      { id: 'square', label: 'Square' },
                      { id: 'rounded-square', label: 'Rounded' },
                      { id: 'squircle', label: 'Squircle' },
                      { id: 'hexagon', label: 'Hexagon' },
                      { id: 'octagon', label: 'Octagon' },
                      { id: 'shield', label: 'Shield' },
                      { id: 'starburst', label: 'Starburst' },
                      { id: 'rosette', label: 'Rosette' },
                      { id: 'diamond', label: 'Diamond' },
                      { id: 'tag', label: 'Asset Tag' },
                      { id: 'badge', label: 'Badge' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateSticker({ shape: s.id as StickerShape })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition-all ${
                          style.sticker?.shape === s.id
                            ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metallic / Enamel Design Presets */}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Material / Finish</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'metallic-gold', label: 'Metallic Gold' },
                      { id: 'metallic-silver', label: 'Metallic Silver' },
                      { id: 'metallic-bronze', label: 'Metallic Bronze' },
                      { id: 'metallic-rose-gold', label: 'Rose Gold' },
                      { id: 'metallic-chrome', label: 'Chrome' },
                      { id: 'enamel-red', label: 'Ruby Enamel' },
                      { id: 'enamel-blue', label: 'Sapphire Blue' },
                      { id: 'enamel-emerald', label: 'Emerald Green' },
                      { id: 'enamel-purple', label: 'Royal Purple' },
                      { id: 'matte-carbon', label: 'Stealth Carbon' },
                      { id: 'neon-cyan', label: 'Neon Glow' },
                      { id: 'clean-white', label: 'Pure White' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => updateSticker({ design: m.id as StickerDesign })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                          style.sticker?.design === m.id
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400 font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metallic Embellishments: Double Rim & 3D Shine Highlight */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <span className="text-xs text-slate-300 font-medium">Minted Double Rim</span>
                    <input
                      type="checkbox"
                      checked={style.sticker?.doubleBorder ?? true}
                      onChange={(e) => updateSticker({ doubleBorder: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-400 accent-amber-400"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 cursor-pointer">
                    <span className="text-xs text-slate-300 font-medium">Glossy 3D Shine</span>
                    <input
                      type="checkbox"
                      checked={style.sticker?.shine ?? true}
                      onChange={(e) => updateSticker({ shine: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-400 accent-amber-400"
                    />
                  </label>
                </div>

                {/* Border & Padding Sliders */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Border Width</span>
                      <span className="text-white font-mono">{style.sticker?.borderWidth ?? 2}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.5"
                      value={style.sticker?.borderWidth ?? 2}
                      onChange={(e) => updateSticker({ borderWidth: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Sticker Padding</span>
                      <span className="text-white font-mono">{style.sticker?.padding ?? 16}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="32"
                      value={style.sticker?.padding ?? 16}
                      onChange={(e) => updateSticker({ padding: Number(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                  </div>
                </div>

                {/* Custom Colors (for fine-tuning) */}
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300">Custom Colors & Tint</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Primary Fill</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={style.sticker?.primaryColor || '#D4AF37'}
                          onChange={(e) => updateSticker({ primaryColor: e.target.value, design: 'custom' })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-300 truncate">{style.sticker?.primaryColor}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Secondary Fill</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={style.sticker?.secondaryColor || '#FFF4A3'}
                          onChange={(e) => updateSticker({ secondaryColor: e.target.value, design: 'custom' })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-300 truncate">{style.sticker?.secondaryColor}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Rim Border</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={style.sticker?.borderColor || '#8A5D0F'}
                          onChange={(e) => updateSticker({ borderColor: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="font-mono text-[10px] text-slate-300 truncate">{style.sticker?.borderColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMPORTED FONTS TAB */}
        {activeTab === 'fonts' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700">
              <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-sky-400" />
                Import Custom Font (.TTF / .OTF)
              </h4>
              <p className="text-[11px] text-slate-400 mb-3">
                Load local TrueType (.ttf) or OpenType (.otf) font files. Fonts are stored locally on your device in private app storage.
              </p>

              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-98 transition-all">
                <Upload className="w-4 h-4" />
                <span>Select .TTF or .OTF File</span>
                <input
                  type="file"
                  accept=".ttf,.otf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fontImportError && (
                <div className="mt-2.5 p-2 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{fontImportError}</span>
                </div>
              )}

              <div className="mt-3 text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 leading-relaxed">
                Font licensing notice: Please ensure you hold the legal right to use any imported font files for your photo annotation workflow.
              </div>
            </div>

            {/* List of imported fonts */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-2">My Imported Fonts</h4>
              {customFonts.length === 0 ? (
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                  No custom fonts imported yet. Tap above to import a .TTF or .OTF font file.
                </div>
              ) : (
                <div className="space-y-2">
                  {customFonts.map((font) => (
                    <div
                      key={font.id}
                      className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        {editingFontId === font.id ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <input
                              type="text"
                              value={newFontName}
                              onChange={(e) => setNewFontName(e.target.value)}
                              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white flex-1"
                            />
                            <button
                              onClick={() => {
                                onRenameCustomFont(font.id, newFontName);
                                setEditingFontId(null);
                              }}
                              className="p-1 bg-amber-400 text-slate-950 rounded text-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="font-semibold text-xs text-white truncate">
                            {font.name}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingFontId(font.id);
                              setNewFontName(font.name);
                            }}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Rename font"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCustomFont(font.id)}
                            className="p-1 text-rose-400 hover:text-rose-300 rounded"
                            title="Delete font"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Font Preview banner */}
                      <div
                        onClick={() => update({ fontFamily: font.fontFamily, customFontId: font.id })}
                        style={{ fontFamily: font.fontFamily }}
                        className="py-2 px-3 bg-slate-950 rounded-lg text-center text-lg font-bold text-amber-300 cursor-pointer hover:bg-slate-900 border border-slate-800 transition-colors"
                      >
                        {currentPreviewText || '01 02 03'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
