import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  Images,
  Trash2,
  Sparkles,
  Edit3,
  Copy,
  X,
  RotateCcw,
} from 'lucide-react';
import { Stamp } from '../types';

interface BottomToolbarProps {
  currentIndex: number;
  totalPhotos: number;
  selectedStamp?: Stamp | null;
  currentPageStampsCount?: number;
  onPrevPhoto: () => void;
  onNextPhoto: () => void;
  onOpenStylePanel: () => void;
  onTogglePhotoStrip: () => void;
  isPhotoStripOpen: boolean;
  onOpenRenumber: () => void;
  onOpenExport: () => void;
  onOpenBatchNumber?: () => void;
  onDeleteCurrentPage?: () => void;
  onClearPageStamps?: () => void;
  onDeleteAllPages?: () => void;
  onDeleteSelectedStamp?: () => void;
  onDuplicateSelectedStamp?: () => void;
  onEditSelectedStampText?: () => void;
  onDeselectStamp?: () => void;
  onOpenAIAutoNumber?: () => void;
}

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  currentIndex,
  totalPhotos,
  selectedStamp,
  currentPageStampsCount = 0,
  onPrevPhoto,
  onNextPhoto,
  onOpenStylePanel,
  onTogglePhotoStrip,
  isPhotoStripOpen,
  onOpenRenumber,
  onOpenExport,
  onOpenBatchNumber,
  onDeleteCurrentPage,
  onClearPageStamps,
  onDeleteAllPages,
  onDeleteSelectedStamp,
  onDuplicateSelectedStamp,
  onEditSelectedStampText,
  onDeselectStamp,
  onOpenAIAutoNumber,
}) => {
  // If a stamp is currently selected, show the Selected Stamp Action Toolbar!
  if (selectedStamp) {
    return (
      <div className="w-full bg-slate-900 border-t-2 border-amber-500/70 px-3 py-2 flex items-center justify-between gap-1.5 select-none shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs truncate">
            {selectedStamp.text}
          </div>
          <span className="text-[11px] text-slate-400 hidden xs:inline truncate">Selected</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEditSelectedStampText && (
            <button
              type="button"
              onClick={onEditSelectedStampText}
              className="min-h-[40px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
              title="Edit stamp text"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStylePanel}
            className="min-h-[40px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
            title="Stamp style"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Style</span>
          </button>

          {onDuplicateSelectedStamp && (
            <button
              type="button"
              onClick={onDuplicateSelectedStamp}
              className="min-h-[40px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
              title="Duplicate stamp"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </button>
          )}

          {/* Prominent Red Delete Stamp Button with dual touch/click support */}
          {onDeleteSelectedStamp && (
            <button
              type="button"
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteSelectedStamp();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteSelectedStamp();
              }}
              className="min-h-[40px] px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              title="Delete this stamp"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Stamp</span>
            </button>
          )}

          {onDeselectStamp && (
            <button
              type="button"
              onClick={onDeselectStamp}
              className="min-h-[40px] min-w-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center active:scale-95 transition-all"
              title="Done editing stamp"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Standard Navigation & Tools Mode
  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 px-2 sm:px-3 py-2 flex items-center justify-between select-none">
      {/* Previous Photo Button */}
      <button
        onClick={onPrevPhoto}
        disabled={currentIndex <= 0}
        aria-label="Previous photo"
        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all ${
          currentIndex > 0
            ? 'text-slate-200 hover:bg-slate-800 active:scale-95'
            : 'text-slate-600 opacity-30 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Middle Tools */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Toggle Photos Strip */}
        <button
          onClick={onTogglePhotoStrip}
          aria-label="Toggle photo strip"
          className={`min-h-[42px] px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-all ${
            isPhotoStripOpen
              ? 'bg-slate-800 text-amber-300 border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Images className="w-4 h-4" />
          <span className="hidden xs:inline">Strip</span>
        </button>

        {/* AI Auto-Numbering Trigger */}
        {onOpenAIAutoNumber && (
          <button
            onClick={onOpenAIAutoNumber}
            aria-label="AI Auto-Numbering"
            className="min-h-[42px] px-2.5 sm:px-3 flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="AI Image Auto-Numbering (Single & Collages)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden xs:inline">AI Auto</span>
          </button>
        )}

        {/* Number All Pages Trigger */}
        {onOpenBatchNumber && totalPhotos > 1 && (
          <button
            onClick={onOpenBatchNumber}
            aria-label="Number all pages"
            className="min-h-[42px] px-2.5 sm:px-3 flex items-center gap-1 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all active:scale-95"
            title="Number all pages at once"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Number All</span>
          </button>
        )}

        {/* Stamp Style Trigger */}
        <button
          onClick={onOpenStylePanel}
          aria-label="Customize stamp style"
          className="min-h-[42px] px-3 sm:px-3.5 flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-400/10"
        >
          <Sliders className="w-4 h-4" />
          <span>Style</span>
        </button>

        {/* Clear Page Stamps Button */}
        {onClearPageStamps && currentPageStampsCount > 0 && (
          <button
            type="button"
            onClick={onClearPageStamps}
            aria-label="Clear stamps on this page"
            className="min-h-[42px] px-2.5 flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all active:scale-95 border border-slate-700"
            title="Clear all stamps placed on this page"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline">Clear Page</span>
          </button>
        )}

        {/* Delete Current Page Button */}
        {onDeleteCurrentPage && totalPhotos > 0 && (
          <button
            type="button"
            onClick={onDeleteCurrentPage}
            aria-label="Delete this page"
            className="min-h-[42px] px-2.5 sm:px-3 flex items-center gap-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all active:scale-95"
            title="Delete this page"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="inline text-[11px]">Delete Page</span>
          </button>
        )}
      </div>

      {/* Next Photo Button */}
      <button
        onClick={onNextPhoto}
        disabled={currentIndex >= totalPhotos - 1}
        aria-label="Next photo"
        className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-all ${
          currentIndex < totalPhotos - 1
            ? 'text-slate-200 hover:bg-slate-800 active:scale-95'
            : 'text-slate-600 opacity-30 cursor-not-allowed'
        }`}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};
