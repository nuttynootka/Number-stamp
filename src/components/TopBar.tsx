import React, { useState } from 'react';
import {
  ArrowLeft,
  Hash,
  Undo2,
  Redo2,
  HelpCircle,
  Layers,
  Download,
  Trash2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { NumberingConfig } from '../types';
import { formatStampNumber } from '../utils/defaults';

interface TopBarProps {
  projectName: string;
  currentPhotoIndex: number;
  totalPhotos: number;
  currentPhotoStampsCount?: number;
  numberingConfig: NumberingConfig;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSetup: () => void;
  onOpenTutorial: () => void;
  onOpenRenumber: () => void;
  onOpenExport: () => void;
  onOpenProjects: () => void;
  onOpenPageManager?: () => void;
  onOpenBatchNumber?: () => void;
  onDeleteCurrentPage?: () => void;
  onClearPageStamps?: () => void;
  onDeleteAllPages?: () => void;
  onOpenAIAutoNumber?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectName,
  currentPhotoIndex,
  totalPhotos,
  currentPhotoStampsCount = 0,
  numberingConfig,
  canUndo,
  canRedo,
  onBack,
  onUndo,
  onRedo,
  onOpenSetup,
  onOpenTutorial,
  onOpenRenumber,
  onOpenExport,
  onOpenProjects,
  onOpenPageManager,
  onOpenBatchNumber,
  onDeleteCurrentPage,
  onClearPageStamps,
  onDeleteAllPages,
  onOpenAIAutoNumber,
}) => {
  const nextFormatted = formatStampNumber(numberingConfig.currentNumber, numberingConfig);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-2 sm:px-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      {/* Left zone: Back & Project / Page Indicator */}
      <div className="flex items-center gap-1.5 min-w-0">
        <button
          onClick={onBack}
          aria-label="Back to home"
          className="min-h-[44px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex flex-col">
          <button
            onClick={onOpenProjects}
            className="text-left font-semibold text-xs sm:text-sm text-slate-100 hover:text-amber-400 truncate max-w-[85px] sm:max-w-[140px] transition-colors"
            title={projectName}
          >
            <span className="truncate">{projectName}</span>
          </button>

          {/* Clickable Page Pill to open Page Manager */}
          <button
            type="button"
            onClick={onOpenPageManager}
            className="flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-300 font-semibold transition-colors"
            title="Manage all pages (reorder, select, delete all)"
          >
            <span>
              Page {totalPhotos > 0 ? currentPhotoIndex + 1 : 0}/{totalPhotos}
            </span>
            <Layers className="w-3 h-3 text-amber-400 shrink-0" />
          </button>
        </div>

        {/* Quick Page Actions: Clear Page & Delete Page */}
        <div className="flex items-center gap-0.5 ml-0.5">
          {totalPhotos > 0 && onClearPageStamps && currentPhotoStampsCount > 0 && (
            <button
              type="button"
              onClick={onClearPageStamps}
              aria-label="Clear stamps on this page"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-amber-300 hover:text-amber-200 active:scale-90 transition-all cursor-pointer"
              title="Clear all stamps on this page"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {totalPhotos > 0 && onDeleteCurrentPage && (
            <button
              type="button"
              onClick={onDeleteCurrentPage}
              aria-label="Delete this page"
              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 active:scale-90 transition-all cursor-pointer"
              title={`Delete Page #${currentPhotoIndex + 1}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle zone: Upcoming Number Stamp Pill + AI Auto-Number Button */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenSetup}
          aria-label="Configure upcoming stamp number"
          className="group flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 active:scale-95 transition-all shadow-sm"
        >
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Next</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 group-hover:text-amber-200">
            {nextFormatted}
          </span>
          <Hash className="w-3 h-3 text-slate-400" />
        </button>

        {onOpenAIAutoNumber && (
          <button
            type="button"
            onClick={onOpenAIAutoNumber}
            aria-label="AI auto-numbering for single photos and collages"
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-slate-800 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-400/40 text-amber-300 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="AI Image Auto-Numbering (Single & Collages)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold hidden xs:inline">AI Auto</span>
          </button>
        )}
      </div>

      {/* Right zone: Undo/Redo & Quick Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last stamp or action"
          className={`min-h-[44px] min-w-[36px] flex items-center justify-center rounded-lg transition-all ${
            canUndo
              ? 'text-slate-200 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo action"
          className={`min-h-[44px] min-w-[36px] flex items-center justify-center rounded-lg transition-all ${
            canRedo
              ? 'text-slate-200 hover:bg-slate-800 active:scale-95'
              : 'text-slate-600 opacity-40 cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenTutorial}
          aria-label="Show tutorial"
          className="min-h-[44px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          title="Tutorial & Tips"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenExport}
          aria-label="Export all numbered photos"
          className="min-h-[38px] px-2.5 py-1.5 ml-1 flex items-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs active:scale-95 transition-all shadow"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
