import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhotoItem, Stamp, StampStyle, EditorMode } from '../types';
import { renderStampOnCanvas } from '../utils/export';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Stamp as StampIcon,
  Trash2,
  Copy,
  Edit3,
  Sliders,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  X,
} from 'lucide-react';

interface CanvasEditorProps {
  photo: PhotoItem | null;
  stamps: Stamp[];
  selectedStampId: string | null;
  mode: EditorMode;
  onSetMode: (mode: EditorMode) => void;
  onPlaceStamp: (normalizedX: number, normalizedY: number) => void;
  onSelectStamp: (stampId: string | null) => void;
  onUpdateStamp: (stampId: string, updates: Partial<Stamp>) => void;
  onDeleteStamp: (stampId: string) => void;
  onDuplicateStamp: (stampId: string) => void;
  onOpenStyleForSelected: () => void;
  currentIndex?: number;
  totalPhotos?: number;
  onNextPhoto?: () => void;
  onPrevPhoto?: () => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
  onNumberAllPhotosAtPosition?: (normX: number, normY: number) => void;
  manualOverrideActive?: boolean;
  onManualOverrideTap?: (normX: number, normY: number) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  photo,
  stamps,
  selectedStampId,
  mode,
  onSetMode,
  onPlaceStamp,
  onSelectStamp,
  onUpdateStamp,
  onDeleteStamp,
  onDuplicateStamp,
  onOpenStyleForSelected,
  currentIndex = 0,
  totalPhotos = 1,
  onNextPhoto,
  onPrevPhoto,
  autoAdvance = false,
  onToggleAutoAdvance,
  onNumberAllPhotosAtPosition,
  manualOverrideActive = false,
  onManualOverrideTap,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDeleteTimeRef = useRef<number>(0);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Dragging / Interacting with selected stamp
  const [isDraggingStamp, setIsDraggingStamp] = useState(false);
  const [isRotatingStamp, setIsRotatingStamp] = useState(false);
  const [isResizingStamp, setIsResizingStamp] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState<string>('');
  const [isStampsDrawerOpen, setIsStampsDrawerOpen] = useState<boolean>(false);
  const [lastPlacedPing, setLastPlacedPing] = useState<{ x: number; y: number } | null>(null);

  // Multi-touch / Pan state
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    touchStart: { x: number; y: number };
    isPanning: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    touchStart: { x: 0, y: 0 },
    isPanning: false,
  });

  // Load photo into Image element
  useEffect(() => {
    if (!photo) {
      setImgElement(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.dataUrl;
    img.onload = () => {
      setImgElement(img);
      // Reset zoom and center
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
  }, [photo?.id, photo?.dataUrl]);

  // Compute image layout inside container
  const computeImageLayout = useCallback(() => {
    if (!containerRef.current || !photo) return null;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const imgW = photo.width || 1200;
    const imgH = photo.height || 900;
    const imgAspect = imgW / imgH;
    const containerAspect = containerW / containerH;

    let displayW = 0;
    let displayH = 0;

    if (imgAspect > containerAspect) {
      displayW = containerW * 0.94;
      displayH = displayW / imgAspect;
    } else {
      displayH = containerH * 0.94;
      displayW = displayH * imgAspect;
    }

    const offsetX = (containerW - displayW) / 2;
    const offsetY = (containerH - displayH) / 2;

    return {
      containerW,
      containerH,
      displayW,
      displayH,
      offsetX,
      offsetY,
      imgW,
      imgH,
    };
  }, [photo]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const layout = computeImageLayout();
    if (!layout || !imgElement) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = layout.containerW * dpr;
    canvas.height = layout.containerH * dpr;
    canvas.style.width = `${layout.containerW}px`;
    canvas.style.height = `${layout.containerH}px`;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, layout.containerW, layout.containerH);

    // Apply Zoom & Pan
    ctx.translate(layout.containerW / 2 + pan.x, layout.containerH / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-layout.containerW / 2, -layout.containerH / 2);

    // Draw background shadow & image
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(imgElement, layout.offsetX, layout.offsetY, layout.displayW, layout.displayH);
    ctx.restore();

    // Draw image border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(layout.offsetX, layout.offsetY, layout.displayW, layout.displayH);

    // Filter stamps for this photo
    const currentStamps = stamps.filter((s) => s.photoId === photo?.id);

    // Render stamps
    for (const stamp of currentStamps) {
      renderStampOnCanvas(
        ctx,
        stamp,
        layout.displayW,
        layout.displayH,
        layout.offsetX,
        layout.offsetY
      );
    }

    ctx.restore();
  }, [photo, stamps, zoom, pan, imgElement, computeImageLayout]);

  // Convert client coordinates to normalized photo (0 to 1) coordinates
  const clientToNormalized = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const layout = computeImageLayout();
      if (!container || !layout) return null;

      const rect = container.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      // Inverse pan & zoom around container center
      const centerX = layout.containerW / 2;
      const centerY = layout.containerH / 2;

      const unscaledX = (clickX - centerX - pan.x) / zoom + centerX;
      const unscaledY = (clickY - centerY - pan.y) / zoom + centerY;

      // Check if inside photo bounds
      const relX = unscaledX - layout.offsetX;
      const relY = unscaledY - layout.offsetY;

      if (relX >= 0 && relX <= layout.displayW && relY >= 0 && relY <= layout.displayH) {
        const normX = relX / layout.displayW;
        const normY = relY / layout.displayH;
        return {
          normX: Math.max(0, Math.min(1, normX)),
          normY: Math.max(0, Math.min(1, normY)),
          displayX: relX,
          displayY: relY,
        };
      }
      return null;
    },
    [computeImageLayout, pan, zoom]
  );

  // Find if a stamp was clicked
  const findStampAtPoint = useCallback(
    (normX: number, normY: number) => {
      if (!photo) return null;
      const currentStamps = stamps.filter((s) => s.photoId === photo.id);
      const layout = computeImageLayout();
      if (!layout) return null;

      // Touch target on screen should be at least 36px to 44px
      const minTouchRadiusX = 40 / (layout.displayW * zoom);
      const minTouchRadiusY = 40 / (layout.displayH * zoom);

      // Search in reverse order (topmost first)
      for (let i = currentStamps.length - 1; i >= 0; i--) {
        const s = currentStamps[i];
        const hitRadiusX = Math.max(minTouchRadiusX, 0.08 * (s.scale || 1));
        const hitRadiusY = Math.max(minTouchRadiusY, 0.08 * (s.scale || 1) * (layout.displayW / layout.displayH));
        const dx = Math.abs(s.x - normX);
        const dy = Math.abs(s.y - normY);
        if (dx <= hitRadiusX && dy <= hitRadiusY) {
          return s;
        }
      }
      return null;
    },
    [photo, stamps, computeImageLayout, zoom]
  );

  // Pointer / Touch Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent ghost clicks if a stamp was just deleted
    if (Date.now() - lastDeleteTimeRef.current < 650) {
      return;
    }

    // Left click or single touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const norm = clientToNormalized(e.clientX, e.clientY);

    // If Manual Override mode is active for AI collages, record tapped location
    if (manualOverrideActive && onManualOverrideTap && norm) {
      setLastPlacedPing({ x: e.clientX, y: e.clientY });
      setTimeout(() => setLastPlacedPing(null), 800);
      onManualOverrideTap(norm.normX, norm.normY);
      return;
    }

    if (mode === 'pan') {
      touchStateRef.current.isPanning = true;
      touchStateRef.current.touchStart = { x: e.clientX, y: e.clientY };
      touchStateRef.current.initialPan = { ...pan };
      return;
    }

    if (norm) {
      const hitStamp = findStampAtPoint(norm.normX, norm.normY);
      if (hitStamp) {
        onSelectStamp(hitStamp.id);
        setIsDraggingStamp(true);
        setDragStartPos({ x: norm.normX, y: norm.normY });
        return;
      }
    }

    if (mode === 'place' && norm) {
      setLastPlacedPing({ x: e.clientX, y: e.clientY });
      setTimeout(() => setLastPlacedPing(null), 800);
      onPlaceStamp(norm.normX, norm.normY);
    } else {
      // Tap outside stamps clears selection
      if (selectedStampId) {
        onSelectStamp(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchStateRef.current.isPanning) {
      const dx = e.clientX - touchStateRef.current.touchStart.x;
      const dy = e.clientY - touchStateRef.current.touchStart.y;
      setPan({
        x: touchStateRef.current.initialPan.x + dx,
        y: touchStateRef.current.initialPan.y + dy,
      });
      return;
    }

    if (isDraggingStamp && selectedStampId) {
      const norm = clientToNormalized(e.clientX, e.clientY);
      if (norm) {
        onUpdateStamp(selectedStampId, {
          x: norm.normX,
          y: norm.normY,
        });
      }
    }
  };

  const handlePointerUp = () => {
    touchStateRef.current.isPanning = false;
    setIsDraggingStamp(false);
    setIsRotatingStamp(false);
    setIsResizingStamp(false);
  };

  // Touch gesture support (Pinch zoom & two finger pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchStateRef.current.initialDist = dist;
      touchStateRef.current.initialZoom = zoom;
      touchStateRef.current.initialPan = { ...pan };
      touchStateRef.current.touchStart = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.initialDist > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / touchStateRef.current.initialDist;
      const newZoom = Math.min(8, Math.max(0.5, touchStateRef.current.initialZoom * ratio));
      setZoom(newZoom);

      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const dx = midX - touchStateRef.current.touchStart.x;
      const dy = midY - touchStateRef.current.touchStart.y;

      setPan({
        x: touchStateRef.current.initialPan.x + dx,
        y: touchStateRef.current.initialPan.y + dy,
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((z) => Math.min(8, Math.max(0.5, z * factor)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Selected stamp coordinates in container space for handles
  const layout = computeImageLayout();
  const currentPhotoStamps = stamps.filter((s) => s.photoId === photo?.id);
  const selectedStamp = stamps.find((s) => s.id === selectedStampId && s.photoId === photo?.id);

  let selectedScreenX = 0;
  let selectedScreenY = 0;
  let isToolbarNearTop = false;
  let clampedToolbarX = 0;
  let toolbarTopY = 0;

  if (selectedStamp && layout) {
    const unscaledX = layout.offsetX + selectedStamp.x * layout.displayW;
    const unscaledY = layout.offsetY + selectedStamp.y * layout.displayH;
    const centerX = layout.containerW / 2;
    const centerY = layout.containerH / 2;
    selectedScreenX = (unscaledX - centerX) * zoom + centerX + pan.x;
    selectedScreenY = (unscaledY - centerY) * zoom + centerY + pan.y;
    isToolbarNearTop = selectedScreenY < 75;
    clampedToolbarX = Math.max(130, Math.min(layout.containerW - 130, selectedScreenX));
    toolbarTopY = isToolbarNearTop ? selectedScreenY + 38 : selectedScreenY - 52;
  }

  const handleDeleteSelectedStamp = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    lastDeleteTimeRef.current = Date.now();
    if (selectedStamp) {
      onDeleteStamp(selectedStamp.id);
    }
  };

  return (
    <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden select-none touch-none">
      {/* Zoom / View controls floating on top right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(8, z * 1.25))}
          aria-label="Zoom in"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z * 0.8))}
          aria-label="Zoom out"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          aria-label="Reset zoom and fit photo"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switcher pill on top left */}
      <div className="absolute top-3 left-3 z-20 flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-800 shadow-xl gap-0.5">
        <button
          onClick={() => onSetMode('place')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mode === 'place'
              ? 'bg-amber-400 text-slate-950 shadow-md scale-102 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <StampIcon className="w-3.5 h-3.5" />
          <span>Tap to Stamp</span>
        </button>

        {onToggleAutoAdvance && totalPhotos > 1 && (
          <button
            onClick={onToggleAutoAdvance}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              autoAdvance
                ? 'bg-emerald-400 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Automatically advance to the next photo after each number is placed"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Next: {autoAdvance ? 'ON' : 'OFF'}</span>
          </button>
        )}

        <button
          onClick={() => onSetMode('pan')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            mode === 'pan'
              ? 'bg-sky-500 text-white shadow-md scale-102 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Move className="w-3.5 h-3.5" />
          <span>Pan/Zoom</span>
        </button>
        {/* Stamps on Page Drawer Trigger Pill */}
        {currentPhotoStamps.length > 0 && (
          <button
            onClick={() => setIsStampsDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-white border border-slate-800 transition-all shadow-md active:scale-95"
            title="View and manage stamps on this photo"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{currentPhotoStamps.length} {currentPhotoStamps.length === 1 ? 'Stamp' : 'Stamps'}</span>
          </button>
        )}
      </div>

      {/* Floating edge navigation buttons */}
      {totalPhotos > 1 && onPrevPhoto && (
        <button
          onClick={onPrevPhoto}
          disabled={currentIndex <= 0}
          aria-label="Previous photo"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center disabled:opacity-20 active:scale-95 shadow-2xl transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {totalPhotos > 1 && onNextPhoto && (
        <button
          onClick={onNextPhoto}
          disabled={currentIndex >= totalPhotos - 1}
          aria-label="Next photo"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-white flex items-center justify-center disabled:opacity-20 active:scale-95 shadow-2xl transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Ripple Animation on Stamp Placement */}
      {lastPlacedPing && (
        <div
          className="fixed pointer-events-none z-40 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ left: `${lastPlacedPing.x}px`, top: `${lastPlacedPing.y}px` }}
        >
          <div className="w-16 h-16 rounded-full border-4 border-amber-400 bg-amber-400/25 animate-ping" />
          <div className="absolute w-4 h-4 rounded-full bg-amber-400 shadow-lg" />
        </div>
      )}

      {/* Helper pill if photo has no stamps yet */}
      {currentPhotoStamps.length === 0 && mode === 'place' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-full border border-amber-400/40 text-[11px] text-amber-300 font-semibold pointer-events-none shadow-xl flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Photo {currentIndex + 1} of {totalPhotos}: Tap anywhere to place number</span>
        </div>
      )}

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair flex items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onWheel={handleWheel}
      >
        <canvas ref={canvasRef} className="block" />
      </div>

      {/* Selected Stamp Selection Ring */}
      {selectedStamp && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${selectedScreenX}px`,
            top: `${selectedScreenY}px`,
          }}
        >
          <div className="w-16 h-16 border-2 border-dashed border-amber-400 rounded-full animate-pulse" />
        </div>
      )}

      {/* Floating Action Mini-Toolbar (Outside containerRef to prevent pointerdown conflicts) */}
      {selectedStamp && (
        <div
          className="absolute z-40 transform -translate-x-1/2 pointer-events-auto"
          style={{
            left: `${clampedToolbarX}px`,
            top: `${toolbarTopY}px`,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-amber-500/60 shadow-2xl whitespace-nowrap">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setEditingTextId(selectedStamp.id);
                setEditTextValue(selectedStamp.text);
              }}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl active:scale-95 cursor-pointer"
              title="Edit text"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenStyleForSelected();
              }}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl active:scale-95 cursor-pointer"
              title="Stamp Style"
            >
              <Sliders className="w-4 h-4" />
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateStamp(selectedStamp.id);
              }}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl active:scale-95 cursor-pointer"
              title="Duplicate stamp"
            >
              <Copy className="w-4 h-4" />
            </button>

            {totalPhotos > 1 && onNumberAllPhotosAtPosition && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onNumberAllPhotosAtPosition(selectedStamp.x, selectedStamp.y);
                }}
                className="px-2.5 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1 border border-amber-400/40 cursor-pointer"
                title={`Number all ${totalPhotos} photos at this position`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Number All {totalPhotos}</span>
              </button>
            )}

            {/* Prominent Red Delete Stamp Button with dual touch/click support */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={handleDeleteSelectedStamp}
              onClick={handleDeleteSelectedStamp}
              className="min-h-[38px] px-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-md transition-all cursor-pointer"
              title="Delete this stamp"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Stamps on This Photo Drawer */}
      {isStampsDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 select-none animate-in fade-in duration-150"
          onClick={() => setIsStampsDrawerOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Stamps on Photo {currentIndex + 1}</h3>
                <p className="text-[11px] text-slate-400">{currentPhotoStamps.length} stamps placed on this photo</p>
              </div>
              <button
                onClick={() => setIsStampsDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-2 overflow-y-auto flex-1">
              {currentPhotoStamps.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-4">No stamps placed on this photo yet.</p>
              ) : (
                currentPhotoStamps.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2"
                  >
                    <div
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => {
                        onSelectStamp(s.id);
                        setIsStampsDrawerOpen(false);
                      }}
                    >
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {s.text}
                      </span>
                      <span className="text-[11px] text-slate-300">Stamp #{idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onSelectStamp(s.id);
                          setIsStampsDrawerOpen(false);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                        title="Select & Edit"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteStamp(s.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-950/60"
                        title="Delete this stamp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline Text Edit Dialog */}
      {editingTextId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-2xl">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">Edit Stamp Text</h4>
            <input
              type="text"
              autoFocus
              value={editTextValue}
              onChange={(e) => setEditTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onUpdateStamp(editingTextId, { text: editTextValue });
                  setEditingTextId(null);
                }
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-center text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTextId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateStamp(editingTextId, { text: editTextValue });
                  setEditingTextId(null);
                }}
                className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
