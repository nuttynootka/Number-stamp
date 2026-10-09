import React, { useState } from 'react';
import { PhotoItem, NumberingConfig } from '../types';
import { formatStampNumber } from '../utils/defaults';
import { Sparkles, X, ArrowRight, Check, CheckCircle2 } from 'lucide-react';

interface BatchNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPhotos: number;
  config: NumberingConfig;
  currentPhotoIndex: number;
  onApplyBatchNumber: (position: { x: number; y: number; name: string }) => void;
}

export const BatchNumberModal: React.FC<BatchNumberModalProps> = ({
  isOpen,
  onClose,
  totalPhotos,
  config,
  currentPhotoIndex,
  onApplyBatchNumber,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<string>('bottom-right');

  if (!isOpen) return null;

  const positions = [
    { id: 'bottom-right', name: 'Bottom Right (Page Number)', x: 0.88, y: 0.92 },
    { id: 'bottom-center', name: 'Bottom Center', x: 0.50, y: 0.92 },
    { id: 'top-right', name: 'Top Right', x: 0.88, y: 0.08 },
    { id: 'top-center', name: 'Top Center', x: 0.50, y: 0.08 },
    { id: 'bottom-left', name: 'Bottom Left', x: 0.12, y: 0.92 },
    { id: 'top-left', name: 'Top Left', x: 0.12, y: 0.08 },
  ];

  const currentPosObj = positions.find((p) => p.id === selectedPosition) || positions[0];

  const start = config.startNumber || 1;
  const inc = config.increment || 1;
  const endNum = start + (totalPhotos - 1) * inc;
  const previewStart = formatStampNumber(start, config);
  const previewMid = formatStampNumber(start + inc, config);
  const previewEnd = formatStampNumber(endNum, config);

  const handleApply = () => {
    onApplyBatchNumber(currentPosObj);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Number All {totalPhotos} Pages</h3>
              <p className="text-[11px] text-slate-400">
                Place consecutive sequential stamps across every page
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live Progression Preview */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
              Sequence across all {totalPhotos} pages
            </span>
            <div className="flex items-center justify-center gap-2 font-mono font-bold text-amber-300 text-sm sm:text-base flex-wrap">
              <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
                Page 1: {previewStart}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">
                Page 2: {previewMid}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg shadow-sm">
                Page {totalPhotos}: {previewEnd}
              </span>
            </div>
          </div>

          {/* Position Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Stamp Location on Each Page:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {positions.map((pos) => {
                const isSelected = pos.id === selectedPosition;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setSelectedPosition(pos.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{pos.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Position Diagram */}
          <div className="w-full h-32 bg-slate-950 rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden p-3">
            <div className="w-24 h-28 bg-slate-900 border border-slate-700 rounded-lg relative shadow-inner">
              <div
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-amber-400 rounded-md text-slate-950 font-mono font-bold text-[9px] flex items-center justify-center shadow-lg transition-all"
                style={{
                  left: `${currentPosObj.x * 100}%`,
                  top: `${currentPosObj.y * 100}%`,
                }}
              >
                #
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-medium">
                Page Preview
              </div>
            </div>
            <div className="ml-4 text-xs text-slate-400 flex-1 leading-relaxed">
              Every page will have its sequential stamp placed at <span className="text-amber-300 font-bold">{currentPosObj.name}</span>.
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 active:scale-98"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[2] py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply to All {totalPhotos} Pages</span>
          </button>
        </div>
      </div>
    </div>
  );
};
