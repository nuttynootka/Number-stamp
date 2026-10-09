import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  icon?: 'trash' | 'warning';
  previewImage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  icon = 'trash',
  previewImage,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-5 flex flex-col gap-4 text-center sm:text-left select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              confirmVariant === 'danger'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
            }`}
          >
            {icon === 'trash' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-bold text-base text-white">{title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
          </div>

          <button
            onClick={onCancel}
            aria-label="Close"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {previewImage && (
          <div className="w-full h-28 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
            <img
              src={previewImage}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs active:scale-98 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs active:scale-98 transition-all shadow-lg ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
