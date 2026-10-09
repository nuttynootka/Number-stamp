import React, { useState } from 'react';
import { PhotoItem, Stamp } from '../types';
import { exportAllPhotos, downloadBlob, ExportProgress, ExportResult } from '../utils/export';
import {
  Download,
  X,
  Share2,
  CheckCircle,
  FileArchive,
  Image as ImageIcon,
  Loader2,
  FolderDown,
  AlertTriangle,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoItem[];
  stamps: Stamp[];
  projectName: string;
  onBatchNumberAllPhotos?: () => void;
  onClearAllPages?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  photos,
  stamps,
  projectName,
  onBatchNumberAllPhotos,
  onClearAllPages,
}) => {
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [quality, setQuality] = useState<number>(0.95);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const photosWithStampsCount = photos.filter((p) =>
    stamps.some((s) => s.photoId === p.id)
  ).length;
  const unnumberedCount = photos.length - photosWithStampsCount;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgress({ current: 0, total: photos.length, currentPhotoName: 'Starting...' });
    setResult(null);
    setExportError(null);

    try {
      const res = await exportAllPhotos(
        photos,
        stamps,
        format,
        quality,
        (p) => setProgress(p)
      );
      setResult(res);
    } catch (err: any) {
      setExportError(err.message || 'Unknown export error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadZip = () => {
    if (!result?.zipBlob) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
    const zipName = `Sequential Photo Numberer - Export - ${dateStr} ${timeStr}.zip`;
    downloadBlob(result.zipBlob, zipName);
  };

  const handleShare = async () => {
    if (!result || !result.items.length) return;
    if (navigator.canShare) {
      try {
        const files: File[] = [];
        for (const item of result.items) {
          const file = new File([item.blob], item.exportName, { type: item.blob.type });
          files.push(file);
        }

        if (navigator.canShare({ files })) {
          await navigator.share({
            title: `${projectName} - Numbered Photos`,
            text: `Exported ${result.items.length} numbered photos from Sequential Photo Numberer`,
            files,
          });
          setShareSuccess('Successfully shared photos!');
          return;
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn('Share error', e);
        }
      }
    }
    // Fallback: download zip
    handleDownloadZip();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Full-Resolution Export</h3>
              <p className="text-[11px] text-slate-400">
                {photos.length} photos · {stamps.length} stamps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {exportError && (
            <div className="p-3 bg-rose-950/60 border border-rose-600/70 rounded-2xl text-xs text-rose-200">
              <span className="font-bold block mb-1">Export Error</span>
              {exportError}
            </div>
          )}

          {!result && !isExporting && (
            <>
              {/* Audit Warning if some photos have no stamps */}
              {unnumberedCount > 0 && (
                <div className="p-3.5 bg-amber-950/40 border border-amber-600/60 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      {photosWithStampsCount === 0
                        ? 'No photos have number stamps placed yet!'
                        : `Only ${photosWithStampsCount} of ${photos.length} photos have number stamps!`}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {unnumberedCount} photos currently have no stamps placed. If you export now, those {unnumberedCount} photos will be exported without numbers.
                  </p>
                  {onBatchNumberAllPhotos && (
                    <button
                      type="button"
                      onClick={onBatchNumberAllPhotos}
                      className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-md shadow-amber-400/10"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Number All {photos.length} Photos (1 to {photos.length})</span>
                    </button>
                  )}
                </div>
              )}

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-semibold text-slate-200">
                  Non-Destructive Permanent Flattening
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your original photos remain untouched. Stamps are rendered at full native resolution using normalized coordinates.
                </p>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Output Image Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('image/jpeg')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      format === 'image/jpeg'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>JPEG (.jpg)</div>
                    <div className="text-[10px] font-normal text-slate-400">Smaller file size</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormat('image/png')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left ${
                      format === 'image/png'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>PNG (.png)</div>
                    <div className="text-[10px] font-normal text-slate-400">Lossless quality</div>
                  </button>
                </div>
              </div>

              {/* Quality Slider (JPEG only) */}
              {format === 'image/jpeg' && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-300">JPEG Quality</span>
                    <span className="text-sky-400 font-mono">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Good (60%)</span>
                    <span>High (95%)</span>
                    <span>Max (100%)</span>
                  </div>
                </div>
              )}

              {/* Output folder & naming convention preview */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-slate-400 font-medium">Naming Convention:</span>
                <p className="font-mono text-[11px] text-slate-300">
                  {photos[0]?.name.replace(/\.[^/.]+$/, '') || 'photo'}_numbered.{format === 'image/png' ? 'png' : 'jpg'}
                </p>
              </div>
            </>
          )}

          {/* Export in Progress State */}
          {isExporting && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Rendering Full-Resolution Images...
                </h4>
                <p className="text-xs text-slate-400">
                  Photo {progress?.current} of {progress?.total}: {progress?.currentPhotoName}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-sky-400 h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${progress ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Completed Success State */}
          {result && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-200">
                    Export Completed Successfully!
                  </h4>
                  <p className="text-xs text-emerald-300/80">
                    {result.items.length} numbered photos generated at full native resolution.
                  </p>
                </div>
              </div>

              {/* Primary action: ZIP download */}
              <button
                onClick={handleDownloadZip}
                className="w-full py-3.5 px-4 bg-sky-500 hover:bg-sky-400 active:scale-98 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <FileArchive className="w-5 h-5" />
                <span>Download All as ZIP Archive</span>
              </button>

              {/* Secondary action: Android Web Share */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleShare}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-98 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-amber-400" />
                  <span>Share Photos (Android / System Share)</span>
                </button>
              )}

              {shareSuccess && (
                <p className="text-center text-xs text-emerald-400 font-medium">{shareSuccess}</p>
              )}

              {/* Individual photo downloads */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-2">
                  Or Download Individually:
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {result.items.map((item) => (
                    <div
                      key={item.photoId}
                      className="flex items-center justify-between p-2 bg-slate-800 rounded-xl border border-slate-700 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <img
                          src={item.url}
                          alt={item.exportName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded object-cover border border-slate-700"
                        />
                        <span className="text-white truncate">{item.exportName}</span>
                      </div>
                      <button
                        onClick={() => downloadBlob(item.blob, item.exportName)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <FolderDown className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isExporting}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                disabled={isExporting || photos.length === 0}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export All ({photos.length})</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {onClearAllPages && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onClearAllPages();
                  }}
                  className="flex-1 py-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
                  title="Clear all pages to finish and start fresh"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Finished? Clear All Pages</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
