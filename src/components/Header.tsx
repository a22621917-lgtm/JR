import React from 'react';
import {
  RotateCw,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
  Train as TrainIcon,
  ChevronDown,
  Layers,
  Radio,
  Navigation,
} from 'lucide-react';
import { KNOWN_LINES, LineMeta } from '../constants/lines';

interface HeaderProps {
  currentLineKey: string;
  onSelectLine: (lineKey: string) => void;
  availableLines: { key: string; name: string }[];
  currentTimeStr: string;
  autoRefreshInterval: number;
  onSetAutoRefreshInterval: (interval: number) => void;
  countdown: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeTrainsCount: number;
  delayedTrainsCount: number;
  hasTrafficAlert: boolean;
  onOpenTrafficModal: () => void;
  viewMode: 'map' | 'list' | 'transit';
  onChangeViewMode: (mode: 'map' | 'list' | 'transit') => void;
  loopViewType: 'circular' | 'linear';
  onChangeLoopViewType: (type: 'circular' | 'linear') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLineKey,
  onSelectLine,
  availableLines,
  currentTimeStr,
  autoRefreshInterval,
  onSetAutoRefreshInterval,
  countdown,
  onManualRefresh,
  isRefreshing,
  soundEnabled,
  onToggleSound,
  activeTrainsCount,
  delayedTrainsCount,
  hasTrafficAlert,
  onOpenTrafficModal,
  viewMode,
  onChangeViewMode,
  loopViewType,
  onChangeLoopViewType,
}) => {
  const lineMeta: LineMeta = KNOWN_LINES[currentLineKey] || {
    key: currentLineKey,
    name: currentLineKey,
    symbol: 'JR',
    color: '#0072BC',
    textColor: '#ffffff',
    borderColor: '#0072BC',
    description: '',
    directionLabels: { 0: '上り', 1: '下り' },
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-3 py-2 sm:px-6 sm:py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* Top row: Brand & Main Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Line Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg shadow-md ring-2 ring-white/10 shrink-0 font-mono-num"
                style={{
                  backgroundColor: lineMeta.color,
                  color: lineMeta.textColor,
                }}
              >
                {lineMeta.symbol}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium tracking-wide">JR-WEST TRAIN LIVE</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="relative inline-block mt-0.5">
                  <select
                    value={currentLineKey}
                    onChange={(e) => onSelectLine(e.target.value)}
                    className="appearance-none bg-slate-800/90 hover:bg-slate-700/90 text-white font-bold text-base sm:text-lg pl-2 pr-7 py-0.5 rounded cursor-pointer border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
                  >
                    {availableLines.map((line) => (
                      <option key={line.key} value={line.key} className="bg-slate-900 text-white py-1">
                        {line.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Line Operational Stats */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono-num">
            <div className="flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/70 px-2.5 py-1.5 rounded-lg">
              <TrainIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400 text-[11px]">走行中:</span>
              <span className="font-bold text-white text-sm">{activeTrainsCount}</span>
              <span className="text-slate-500 text-[10px]">列車</span>
            </div>

            {delayedTrainsCount > 0 ? (
              <button
                type="button"
                onClick={onOpenTrafficModal}
                className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-600/60 hover:bg-amber-900/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-amber-300"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="font-bold">{delayedTrainsCount}</span>
                <span className="text-[11px]">列車に遅延あり</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-700/40 px-2.5 py-1.5 rounded-lg text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-[11px]">全列車 平常運転</span>
              </div>
            )}

            {hasTrafficAlert && (
              <button
                type="button"
                onClick={onOpenTrafficModal}
                className="flex items-center gap-1 bg-rose-950/70 border border-rose-600/70 hover:bg-rose-900/80 px-2 py-1.5 rounded-lg text-rose-300 text-xs transition-colors cursor-pointer animate-pulse"
                title="近畿エリア運行情報"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline font-semibold">運行情報あり</span>
              </button>
            )}
          </div>

          {/* Clock, Auto-refresh & Tools */}
          <div className="flex items-center gap-2">
            {/* Server Synced Clock */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono-num text-xs">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentTimeStr}</span>
            </div>

            {/* Refresh Interval Selector */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700/70 rounded-lg p-0.5 text-xs">
              {[
                { sec: 10, label: '10秒' },
                { sec: 15, label: '15秒' },
                { sec: 30, label: '30秒' },
                { sec: 0, label: '手動' },
              ].map((item) => (
                <button
                  key={item.sec}
                  type="button"
                  onClick={() => onSetAutoRefreshInterval(item.sec)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    autoRefreshInterval === item.sec
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="データを手動更新"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">更新</span>
              {autoRefreshInterval > 0 && (
                <span className="text-[10px] text-slate-400 font-mono-num">
                  ({countdown}s)
                </span>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-sky-400 hover:text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? '通知音: ON' : '通知音: OFF'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Sub-bar: View Switchers & Line Range */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-medium text-slate-300">{lineMeta.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px]">{lineMeta.description}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View Mode Toggle: Map vs List vs Transit */}
            <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onChangeViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>路線図</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrainIcon className="w-3.5 h-3.5" />
                <span>列車一覧</span>
                <span className="ml-0.5 px-1 py-0.2 bg-slate-800 rounded text-[10px] text-slate-300 font-mono-num">
                  {activeTrainsCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onChangeViewMode('transit')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'transit'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>乗換案内</span>
              </button>
            </div>

            {/* Loop Map Type Toggle (Only for osakaloop in map mode) */}
            {currentLineKey === 'osakaloop' && viewMode === 'map' && (
              <div className="flex items-center bg-slate-950/70 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onChangeLoopViewType('circular')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    loopViewType === 'circular'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  環状図 (円形)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLoopViewType('linear')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    loopViewType === 'linear'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  直線マップ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
