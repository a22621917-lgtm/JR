import React, { useMemo } from 'react';
import { Train, TrainMonitorData } from '../types';
import { parseTrainPos, getTrainTypeStyle, formatDelay, getCongestionStatus } from '../utils/trainParser';
import { KNOWN_LINES, LineMeta } from '../constants/lines';
import { Search, Filter, AlertTriangle, ChevronRight, Train as TrainIcon, Gauge, Thermometer } from 'lucide-react';

interface TrainListProps {
  currentLineKey: string;
  trains: Train[];
  stationsMap: Map<string, string>;
  trainMonitor: TrainMonitorData | null;
  selectedTrain: Train | null;
  onSelectTrain: (train: Train) => void;
  filterDirection: number | 'all';
  onSetFilterDirection: (dir: number | 'all') => void;
  filterDelayedOnly: boolean;
  onSetFilterDelayedOnly: (val: boolean) => void;
  searchQuery: string;
  onSetSearchQuery: (q: string) => void;
}

export const TrainList: React.FC<TrainListProps> = ({
  currentLineKey,
  trains,
  stationsMap,
  trainMonitor,
  selectedTrain,
  onSelectTrain,
  filterDirection,
  onSetFilterDirection,
  filterDelayedOnly,
  onSetFilterDelayedOnly,
  searchQuery,
  onSetSearchQuery,
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

  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      if (filterDirection !== 'all' && t.direction !== filterDirection) return false;
      if (filterDelayedOnly && (!t.delayMinutes || t.delayMinutes <= 0)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNo = t.no?.toLowerCase().includes(q);
        const matchDest = t.dest?.text?.toLowerCase().includes(q);
        const matchType = t.displayType?.toLowerCase().includes(q);
        if (!matchNo && !matchDest && !matchType) return false;
      }
      return true;
    });
  }, [trains, filterDirection, filterDelayedOnly, searchQuery]);

  return (
    <div className="w-full bg-slate-950/60 rounded-2xl border border-slate-800 p-3 sm:p-5 flex flex-col gap-4">
      {/* Control Bar: Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Direction filter pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => onSetFilterDirection('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterDirection === 'all'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            全方向 ({trains.length})
          </button>
          <button
            type="button"
            onClick={() => onSetFilterDirection(0)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterDirection === 0
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lineMeta.directionLabels[0]} (
            {trains.filter((t) => t.direction === 0).length})
          </button>
          <button
            type="button"
            onClick={() => onSetFilterDirection(1)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filterDirection === 1
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {lineMeta.directionLabels[1]} (
            {trains.filter((t) => t.direction === 1).length})
          </button>
        </div>

        {/* Delay filter toggle & Search */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => onSetFilterDelayedOnly(!filterDelayedOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterDelayedOnly
                ? 'bg-rose-950 border-rose-500 text-rose-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>遅延のみ</span>
          </button>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              placeholder="列車番号・行先・種別"
              className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Train Cards Grid */}
      {filteredTrains.length === 0 ? (
        <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
          <TrainIcon className="w-8 h-8 text-slate-600" />
          <p className="text-sm">該当する列車は見つかりませんでした</p>
          <button
            type="button"
            onClick={() => {
              onSetFilterDirection('all');
              onSetFilterDelayedOnly(false);
              onSetSearchQuery('');
            }}
            className="text-xs text-sky-400 hover:underline mt-1 cursor-pointer"
          >
            フィルターをクリア
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTrains.map((train) => {
            const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
            const typeStyle = getTrainTypeStyle(train.displayType);
            const delayInfo = formatDelay(train.delayMinutes);
            const isSelected = selectedTrain?.no === train.no;
            const dirLabel =
              train.direction === 0
                ? lineMeta.directionLabels[0]
                : lineMeta.directionLabels[1];

            // Monitor cars for this train
            const monitorInfo = trainMonitor?.trains?.[train.no]?.[0];
            const avgCongestion = monitorInfo?.cars?.length
              ? Math.round(
                  monitorInfo.cars.reduce((sum, c) => sum + c.congestion, 0) /
                    monitorInfo.cars.length
                )
              : null;
            const avgTemp = monitorInfo?.cars?.length
              ? Math.round(
                  monitorInfo.cars.reduce((sum, c) => sum + c.temp, 0) /
                    monitorInfo.cars.length
                )
              : null;
            const congestionStatus = avgCongestion
              ? getCongestionStatus(avgCongestion)
              : null;

            return (
              <div
                key={train.no}
                onClick={() => onSelectTrain(train)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Header row: Train type badge, Train No, Direction */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold shadow-sm ${typeStyle.badge}`}
                    >
                      {train.displayType}
                    </span>
                    <span className="font-mono-num font-bold text-white text-sm">
                      {train.no}
                    </span>
                    {train.nickname && (
                      <span className="text-xs text-rose-300 font-semibold">
                        {train.nickname}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      train.direction === 0
                        ? 'bg-sky-950 text-sky-300 border border-sky-800/60'
                        : 'bg-orange-950 text-orange-300 border border-orange-800/60'
                    }`}
                  >
                    {dirLabel.split(' ')[0]}
                  </span>
                </div>

                {/* Destination & Location Status */}
                <div>
                  <div className="text-xs text-slate-400">行先:</div>
                  <div className="text-base font-bold text-white tracking-wide">
                    {train.dest.text} 行
                    {train.via && (
                      <span className="text-xs text-slate-400 font-normal ml-1.5">
                        ({train.via}経由)
                      </span>
                    )}
                  </div>

                  {/* Real-time Position */}
                  <div className="mt-2 text-xs flex items-center gap-1.5">
                    {parsed.isStopped ? (
                      <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-md font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{parsed.statusLabel}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-sky-300 bg-sky-950/50 border border-sky-800/40 px-2 py-0.5 rounded-md font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        <span>{parsed.statusLabel}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Congestion & Climate Preview if available */}
                {avgCongestion !== null && congestionStatus && (
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">平均混雑:</span>
                      <span className={`font-mono-num font-bold ${congestionStatus.colorClass}`}>
                        {avgCongestion}%
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({congestionStatus.label.split('・')[0]})
                      </span>
                    </div>

                    {avgTemp && (
                      <div className="flex items-center gap-1 text-slate-400 font-mono-num text-[11px]">
                        <Thermometer className="w-3 h-3 text-sky-400" />
                        <span>{avgTemp}°C</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: Cars & Delay */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-mono-num">{train.numberOfCars || 8}両編成</span>
                    {train.typeChange && (
                      <span className="text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/60">
                        {train.typeChange}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] font-mono-num ${delayInfo.colorClass}`}>
                      {delayInfo.text}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
