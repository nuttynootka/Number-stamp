import React from 'react';
import { X, Touchpad, Move, Sliders, CheckCircle } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="font-bold text-base text-white">How Sequential Numbering Works</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl text-amber-200">
            <Touchpad className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block text-sm mb-0.5">1. Tap to Place Numbers</strong>
              Tap anywhere on the photo to place the current number. The next number is prepared automatically for your next tap!
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <Move className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">2. Collages & Multi-Picture Photos</strong>
              Place multiple sequential numbers across a collage (e.g. 1 to 8 on a single image), then swipe to the next photo without resetting the count.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <Sliders className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">3. Pinch to Zoom & Move</strong>
              Pinch with two fingers to zoom in on tiny details. Tap any existing number stamp to drag, resize, change text, or adjust its style.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-98"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Got It, Let's Number!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
