import React, { useState } from 'react';
import { PhotoItem, Stamp } from '../types';
import {
  Layers,
  X,
  Trash2,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  Plus,
  Hash,
  AlertCircle,
} from 'lucide-react';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  stamps: Stamp[];
  currentIndex: number;
  onSelectPhoto: (index: number) => void;
  onDeletePhoto: (photoId: string) => void;
  onDeleteMultiplePhotos: (photoIds: string[]) => void;
  onDeleteAllPages?: () => void;
  onMovePhoto: (index: number, direction: 'prev' | 'next') => void;
  onAddPhotos: (files: FileList) => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  photos,
  stamps,
  currentIndex,
  onSelectPhoto,
  onDeletePhoto,
  onDeleteMultiplePhotos,
  onDeleteAllPages,
  onMovePhoto,
  onAddPhotos,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onDeleteMultiplePhotos(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[800px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Manage Pages ({photos.length})</h3>
              <p className="text-[11px] text-slate-400">
                Tap a page to jump to it or delete unwanted pages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setIsSelectMode((v) => !v);
                setSelectedIds(new Set());
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelectMode
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {isSelectMode ? 'Cancel Selection' : 'Select Multiple'}
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Multi-select Action Bar */}
        {isSelectMode && (
          <div className="bg-slate-950 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
            >
              {selectedIds.size === photos.length ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-500" />
              )}
              <span>Select All ({photos.length})</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          </div>
        )}

        {/* Pages Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {photos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-semibold">No pages in this project.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, idx) => {
                const isCurrent = idx === currentIndex;
                const isChecked = selectedIds.has(photo.id);
                const pageStamps = stamps.filter((s) => s.photoId === photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (isSelectMode) {
                        toggleSelect(photo.id);
                      } else {
                        onSelectPhoto(idx);
                        onClose();
                      }
                    }}
                    className={`relative group rounded-2xl border-2 overflow-hidden bg-slate-950 flex flex-col cursor-pointer transition-all ${
                      isChecked
                        ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]'
                        : isCurrent
                        ? 'border-amber-400 shadow-lg ring-1 ring-amber-400/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative aspect-4/3 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={photo.dataUrl}
                        alt={photo.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />

                      {/* Top Left Page Badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-xs font-mono font-bold text-xs text-white shadow">
                        #{idx + 1}
                      </div>

                      {/* Top Right Checkbox (if multi-select) or Quick Delete Button */}
                      {isSelectMode ? (
                        <div className="absolute top-2 right-2">
                          {isChecked ? (
                            <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                              <CheckSquare className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-black/60 border border-slate-500 flex items-center justify-center shadow">
                              <Square className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePhoto(photo.id);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                          title="Delete this page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Bottom Stamps Count Pill */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-xs font-semibold text-[10px] text-amber-300 shadow flex items-center gap-1 border border-slate-800">
                        <Hash className="w-3 h-3 text-amber-400" />
                        <span>{pageStamps.length} stamps</span>
                      </div>
                    </div>

                    {/* Footer with Page Name and Move Controls */}
                    <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-1">
                      <span className="text-[11px] font-medium text-slate-300 truncate flex-1">
                        {photo.name}
                      </span>

                      {!isSelectMode && (
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMovePhoto(idx, 'prev');
                            }}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                            title="Move left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMovePhoto(idx, 'next');
                            }}
                            disabled={idx === photos.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 rounded"
                            title="Move right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Add Pages CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddPhotos(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-98 transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Pages</span>
            </button>

            {photos.length > 0 && onDeleteAllPages && (
              <button
                type="button"
                onClick={() => {
                  onDeleteAllPages();
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-semibold text-xs flex items-center gap-1.5 active:scale-98 transition-all"
                title="Delete all pages to finish and start fresh"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete All Pages</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs active:scale-98 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
