import React, { useRef } from 'react';
import { PhotoItem } from '../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, ArrowLeft, ArrowRight, Layers, Image as ImageIcon } from 'lucide-react';

interface PhotoStripProps {
  photos: PhotoItem[];
  currentIndex: number;
  onSelectPhoto: (index: number) => void;
  onAddPhotos: (files: FileList) => void;
  onDeletePhoto: (photoId: string) => void;
  onMovePhoto: (index: number, direction: 'prev' | 'next') => void;
  onOpenPageManager?: () => void;
}

export const PhotoStrip: React.FC<PhotoStripProps> = ({
  photos,
  currentIndex,
  onSelectPhoto,
  onAddPhotos,
  onDeletePhoto,
  onMovePhoto,
  onOpenPageManager,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddPhotos(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2 px-3 flex items-center gap-2 select-none">
      {/* Manage / Grid Button */}
      {onOpenPageManager && (
        <button
          onClick={onOpenPageManager}
          aria-label="Manage all pages"
          className="h-16 w-14 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-amber-300 active:scale-95 transition-all shadow-sm"
          title="Manage all pages (view grid, reorder, delete)"
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-bold leading-none">Pages</span>
        </button>
      )}

      {/* Add Photos Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        aria-label="Add more photos to project"
        className="h-16 w-14 shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-medium leading-none">Add</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Horizontal Scrollable Thumbnails */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth">
        {photos.map((photo, idx) => {
          const isActive = idx === currentIndex;
          const stampsCount = photo.stampsCount || 0;

          return (
            <div
              key={photo.id}
              className={`group relative h-16 w-20 shrink-0 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                isActive
                  ? 'border-amber-400 shadow-md ring-2 ring-amber-400/20 scale-102'
                  : 'border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
              onClick={() => onSelectPhoto(idx)}
            >
              {/* Thumbnail Image */}
              <img
                src={photo.dataUrl}
                alt={photo.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Index number badge */}
              <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-xs text-[10px] font-bold text-white px-1.5 py-0.5 rounded leading-none">
                #{idx + 1}
              </div>

              {/* Stamps count badge */}
              {stampsCount > 0 && !isActive && (
                <div className="absolute bottom-1 right-1 bg-amber-400 text-slate-950 font-bold text-[9px] px-1 py-0.5 rounded-full leading-none shadow">
                  {stampsCount}
                </div>
              )}

              {/* Active Photo Delete Button (no confirm popup blocking) */}
              {isActive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePhoto(photo.id);
                  }}
                  className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center rounded bg-rose-600 hover:bg-rose-500 text-white shadow-md active:scale-90 transition-transform"
                  title="Delete this page"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              {/* Reordering controls on active photo */}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-between px-1.5 py-0.5 z-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePhoto(idx, 'prev');
                    }}
                    disabled={idx === 0}
                    className="p-1 text-slate-300 disabled:opacity-20 hover:text-white"
                    title="Move left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[9px] font-bold text-amber-300">
                    {stampsCount > 0 ? `${stampsCount} #` : 'Empty'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePhoto(idx, 'next');
                    }}
                    disabled={idx === photos.length - 1}
                    className="p-1 text-slate-300 disabled:opacity-20 hover:text-white"
                    title="Move right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
