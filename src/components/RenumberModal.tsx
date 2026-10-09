import React, { useState } from 'react';
import { Stamp, PhotoItem, NumberingConfig } from '../types';
import { formatStampNumber } from '../utils/defaults';
import { RefreshCw, X, ArrowRight, AlertTriangle, Check } from 'lucide-react';

interface RenumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  stamps: Stamp[];
  photos: PhotoItem[];
  currentConfig: NumberingConfig;
  onApplyRenumber: (renumberedStamps: Stamp[], newConfig: NumberingConfig) => void;
}

export const RenumberModal: React.FC<RenumberModalProps> = ({
  isOpen,
  onClose,
  stamps,
  photos,
  currentConfig,
  onApplyRenumber,
}) => {
  const [startNum, setStartNum] = useState(currentConfig.startNumber);
  const [increment, setIncrement] = useState(currentConfig.increment);
  const [prefix, setPrefix] = useState(currentConfig.prefix);
  const [suffix, setSuffix] = useState(currentConfig.suffix);
  const [padding, setPadding] = useState(currentConfig.padding);
  const [targetScope, setTargetScope] = useState<'existing' | 'all_photos'>(
    stamps.length < photos.length ? 'all_photos' : 'existing'
  );

  if (!isOpen) return null;

  const previewConfig: NumberingConfig = {
    startNumber: startNum,
    increment,
    prefix,
    suffix,
    padding,
    currentNumber: startNum,
  };

  // Order stamps by photo order, then by creation / sequence
  const photoOrderMap = new Map(photos.map((p, idx) => [p.id, idx]));

  const sortedStamps = [...stamps].sort((a, b) => {
    const photoDiff = (photoOrderMap.get(a.photoId) || 0) - (photoOrderMap.get(b.photoId) || 0);
    if (photoDiff !== 0) return photoDiff;
    return (a.sequenceIndex || 0) - (b.sequenceIndex || 0);
  });

  const existingFirst = sortedStamps[0];

  const previewList =
    targetScope === 'all_photos'
      ? photos.map((photo, idx) => {
          const newNumber = startNum + idx * increment;
          const newText = formatStampNumber(newNumber, previewConfig);
          const existingOnPhoto = stamps.find((s) => s.photoId === photo.id);
          return {
            stampId: existingOnPhoto?.id || `new_${photo.id}`,
            oldText: existingOnPhoto ? existingOnPhoto.text : '(No stamp)',
            newText,
            photoName: photo.name,
            newNumber,
            idx,
          };
        })
      : sortedStamps.map((stamp, idx) => {
          const newNumber = startNum + idx * increment;
          const newText = formatStampNumber(newNumber, previewConfig);
          const photo = photos.find((p) => p.id === stamp.photoId);
          return {
            stampId: stamp.id,
            oldText: stamp.text,
            newText,
            photoName: photo?.name || 'Photo',
            newNumber,
            idx,
          };
        });

  const handleApply = () => {
    let updatedStamps: Stamp[] = [];

    if (targetScope === 'all_photos') {
      const targetX = existingFirst ? existingFirst.x : 0.85;
      const targetY = existingFirst ? existingFirst.y : 0.90;
      const stampStyle = existingFirst ? { ...existingFirst.style } : (stamps[0]?.style || undefined);

      updatedStamps = photos.map((photo, idx) => {
        const newNum = startNum + idx * increment;
        const existingOnPhoto = stamps.find((s) => s.photoId === photo.id);
        return {
          id: existingOnPhoto?.id || `stamp_batch_${Date.now()}_${idx}`,
          photoId: photo.id,
          text: formatStampNumber(newNum, previewConfig),
          sequenceIndex: newNum,
          x: existingOnPhoto ? existingOnPhoto.x : targetX,
          y: existingOnPhoto ? existingOnPhoto.y : targetY,
          scale: existingOnPhoto?.scale || existingFirst?.scale || 1,
          rotation: existingOnPhoto?.rotation || existingFirst?.rotation || 0,
          style: existingOnPhoto ? { ...existingOnPhoto.style } : stampStyle || (stamps[0]?.style as any),
          createdAt: existingOnPhoto?.createdAt || Date.now() + idx,
        };
      });
    } else {
      updatedStamps = sortedStamps.map((s, idx) => {
        const newNum = startNum + idx * increment;
        return {
          ...s,
          sequenceIndex: idx + 1,
          text: formatStampNumber(newNum, previewConfig),
        };
      });
    }

    const nextUpcomingNumber = startNum + updatedStamps.length * increment;
    const updatedConfig: NumberingConfig = {
      ...previewConfig,
      currentNumber: nextUpcomingNumber,
    };

    onApplyRenumber(updatedStamps, updatedConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Renumber All Stamps</h3>
              <p className="text-[11px] text-slate-400">Sequential re-indexing across all photos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Scope Selector: All Photos vs Existing Stamps */}
          {photos.length > 1 && (
            <div className="grid grid-cols-2 p-1 bg-slate-800/90 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => setTargetScope('all_photos')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  targetScope === 'all_photos'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All {photos.length} Photos (1 to {photos.length})
              </button>
              <button
                type="button"
                onClick={() => setTargetScope('existing')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  targetScope === 'existing'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Existing Stamps ({stamps.length})
              </button>
            </div>
          )}

          <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              {targetScope === 'all_photos'
                ? `This will place consecutive number stamps across all ${photos.length} photos in sequence.`
                : `This will re-index the ${stamps.length} existing stamps across photos.`}
            </span>
          </div>

          {/* Quick config options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start From
              </label>
              <input
                type="number"
                value={startNum}
                onChange={(e) => setStartNum(Number(e.target.value) || 1)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center text-sm font-bold text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Increment Step
              </label>
              <input
                type="number"
                value={increment}
                onChange={(e) => setIncrement(Number(e.target.value) || 1)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl font-mono text-center text-sm font-bold text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Prefix
              </label>
              <input
                type="text"
                placeholder='e.g. "Photo "'
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Padding
              </label>
              <select
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="1">1 (No padding)</option>
                <option value="2">01 (2 digits)</option>
                <option value="3">001 (3 digits)</option>
                <option value="4">0001 (4 digits)</option>
              </select>
            </div>
          </div>

          {/* Preview list */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Live Changes Preview
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800">
              {previewList.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-4">No stamps placed yet</div>
              ) : (
                previewList.map((item) => (
                  <div
                    key={item.stampId}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-900 rounded-lg text-xs"
                  >
                    <span className="text-slate-400 truncate max-w-[120px]">{item.photoName}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-400 line-through">{item.oldText}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-amber-300 font-bold">{item.newText}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={stamps.length === 0}
            className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-400/10"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Renumber All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
