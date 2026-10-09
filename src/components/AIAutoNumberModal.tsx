import React from 'react';
import {
  Sparkles,
  X,
  Play,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Move,
  CornerDownRight,
  ShieldCheck,
} from 'lucide-react';
import { PhotoItem, NumberingConfig } from '../types';
import { formatStampNumber } from '../utils/defaults';

interface AIAutoNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  currentIndex: number;
  numberingConfig: NumberingConfig;
  isRunning: boolean;
  progress: { current: number; total: number; message: string; step?: string } | null;
  onStartAutoNumber: (scope: 'all' | 'current') => void;
}

export const AIAutoNumberModal: React.FC<AIAutoNumberModalProps> = ({
  isOpen,
  onClose,
  photos,
  currentIndex,
  numberingConfig,
  isRunning,
  progress,
  onStartAutoNumber,
}) => {
  if (!isOpen) return null;

  const currentFormatted = formatStampNumber(numberingConfig.currentNumber, numberingConfig);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={() => {
        if (!isRunning) onClose();
      }}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Image Auto-Numbering</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Gemini Vision
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sequentially numbers photos & sub-image collages cleanly
              </p>
            </div>
          </div>

          {!isRunning && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-200">
          {/* Progress Banner if Running */}
          {isRunning && progress && (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Processing Page {progress.current} of {progress.total}</span>
                </span>
                <span className="font-mono text-slate-400">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>

              <p className="text-xs text-slate-300 italic">{progress.message}</p>
            </div>
          )}

          {/* Current Sequence info */}
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Starting Stamp Number:</span>
            <span className="text-sm font-mono font-bold text-amber-300 px-2.5 py-0.5 rounded-lg bg-amber-400/10 border border-amber-400/30">
              {currentFormatted}
            </span>
          </div>

          {/* Specification Steps Explanation Cards */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Automated Rules Specification
            </span>

            {/* Step 1 */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-200">Image Classification</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  Analyzes input to classify as a <strong>Single Image</strong> or a <strong>Composite/Collage</strong> with multiple sub-images.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-200">Preferred Placement Priority</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  Evaluates corners in exact order: <strong>Upper-Left → Upper-Right → Lower-Left → Lower-Right</strong>. Rejects any corner obscuring subjects or focal points.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-200">Fallback Margins (If No Corners Valid)</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  Adds clean white top border without scaling or distorting original image content. For collages, inserts white spacing above rows.
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div className="text-xs space-y-0.5">
                <div className="font-semibold text-slate-200">Manual Override Exception</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  If collage structure cannot be split cleanly, pauses queue and prompts you to tap positions, then seamlessly resumes from the next sequence number!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center gap-2.5">
          {!isRunning ? (
            <>
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => onStartAutoNumber('all')}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Number All {photos.length} Pages</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onStartAutoNumber('current')}
                className={`w-full sm:flex-1 py-3 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer ${
                  photos.length === 1
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Auto-Number Current Page (#{currentIndex + 1})</span>
              </button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs text-amber-300 font-semibold animate-pulse">
              AI Vision is running... please wait
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
