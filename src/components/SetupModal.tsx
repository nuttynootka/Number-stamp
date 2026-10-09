import React, { useState } from 'react';
import { NumberingConfig } from '../types';
import { formatStampNumber } from '../utils/defaults';
import { Hash, Plus, Minus, ArrowRight, X, Sparkles } from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: NumberingConfig;
  onSave: (config: NumberingConfig) => void;
  title?: string;
  isInitialSetup?: boolean;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  title = 'Numbering Setup',
  isInitialSetup = false,
}) => {
  const [startNum, setStartNum] = useState(config.startNumber);
  const [currentNum, setCurrentNum] = useState(config.currentNumber);
  const [increment, setIncrement] = useState(config.increment);
  const [prefix, setPrefix] = useState(config.prefix);
  const [suffix, setSuffix] = useState(config.suffix);
  const [padding, setPadding] = useState(config.padding);

  if (!isOpen) return null;

  const tempConfig: NumberingConfig = {
    startNumber: startNum,
    increment,
    prefix,
    suffix,
    padding,
    currentNumber: currentNum,
  };

  const preview1 = formatStampNumber(currentNum, tempConfig);
  const preview2 = formatStampNumber(currentNum + increment, tempConfig);
  const preview3 = formatStampNumber(currentNum + increment * 2, tempConfig);

  const handleSave = () => {
    onSave({
      startNumber: startNum,
      increment,
      prefix,
      suffix,
      padding,
      currentNumber: isInitialSetup ? startNum : currentNum,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Configure sequence progression & formatting</p>
            </div>
          </div>
          {!isInitialSetup && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live Progression Preview */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5">
              Sequence Live Preview
            </span>
            <div className="flex items-center justify-center gap-2 font-mono font-bold text-amber-300 text-base sm:text-lg">
              <span className="px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">{preview1}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">{preview2}</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">{preview3}</span>
            </div>
          </div>

          {/* Current / Upcoming Number */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                {isInitialSetup ? 'Starting Number' : 'Upcoming Next Number'}
              </label>
              <span className="text-[10px] text-slate-400">Tap + / - or type directly</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const val = Math.max(0, (isInitialSetup ? startNum : currentNum) - increment);
                  if (isInitialSetup) setStartNum(val);
                  else setCurrentNum(val);
                }}
                className="w-12 h-11 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center border border-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                value={isInitialSetup ? startNum : currentNum}
                onChange={(e) => {
                  const val = Number(e.target.value) || 0;
                  if (isInitialSetup) setStartNum(val);
                  else setCurrentNum(val);
                }}
                className="flex-1 h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl text-center font-mono text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />

              <button
                type="button"
                onClick={() => {
                  const val = (isInitialSetup ? startNum : currentNum) + increment;
                  if (isInitialSetup) setStartNum(val);
                  else setCurrentNum(val);
                }}
                className="w-12 h-11 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl flex items-center justify-center border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Increment Step */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Increment Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 5, 10].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setIncrement(step)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    increment === step
                      ? 'bg-amber-400 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{step}
                </button>
              ))}
            </div>
          </div>

          {/* Padding / Leading Zeros */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Number Padding (Leading Zeros)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { pad: 1, label: '1, 2, 3' },
                { pad: 2, label: '01, 02' },
                { pad: 3, label: '001, 002' },
                { pad: 4, label: '0001, 0002' },
              ].map((item) => (
                <button
                  key={item.pad}
                  type="button"
                  onClick={() => setPadding(item.pad)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-mono font-semibold border transition-all ${
                    padding === item.pad
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix & Suffix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Prefix (Optional)
              </label>
              <input
                type="text"
                placeholder='e.g. "Photo ", "#"'
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Suffix (Optional)
              </label>
              <input
                type="text"
                placeholder='e.g. ")", ":"'
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* Common Prefix Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400">Quick:</span>
            {['', 'Photo ', 'Image ', 'Item ', 'A-', '#'].map((p) => (
              <button
                key={p || 'none'}
                type="button"
                onClick={() => setPrefix(p)}
                className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-slate-300"
              >
                {p === '' ? 'None' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex gap-2">
          {!isInitialSetup && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/10 flex items-center justify-center gap-1.5"
          >
            <span>{isInitialSetup ? 'Start Numbering' : 'Save Settings'}</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
