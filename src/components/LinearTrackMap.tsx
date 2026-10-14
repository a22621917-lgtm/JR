import React, { useMemo } from 'react';
import { Train, Station } from '../types';
import { parseTrainPos, getTrainTypeStyle } from '../utils/trainParser';
import { KNOWN_LINES, LineMeta } from '../constants/lines';
import { ArrowLeft, ArrowRight, Train as TrainIcon } from 'lucide-react';

interface LinearTrackMapProps {
  currentLineKey: string;
  stations: Station[];
  trains: Train[];
  selectedTrain: Train | null;
  onSelectTrain: (train: Train) => void;
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  stationsMap: Map<string, string>;
  filterDirection: number | 'all';
  filterDelayedOnly: boolean;
  searchQuery: string;
}

export const LinearTrackMap: React.FC<LinearTrackMapProps> = ({
  currentLineKey,
  stations,
  trains,
  selectedTrain,
  onSelectTrain,
  selectedStation,
  onSelectStation,
  stationsMap,
  filterDirection,
  filterDelayedOnly,
  searchQuery,
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

  // Filter trains
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

  // Index map of stationCode -> index
  const stationIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    stations.forEach((st, idx) => {
      if (st.info?.code) map.set(st.info.code, idx);
    });
    return map;
  }, [stations]);

  // Group trains by direction and position
  // In dir 0: Upper / Inner (usually left-to-right or right-to-left)
  // In dir 1: Lower / Outer
  const trainsByStationAndDirection = useMemo(() => {
    // stoppedAtStation[stationCode][direction] = Train[]
    const stopped: Record<string, { 0: Train[]; 1: Train[] }> = {};
    // runningBetween[fromIndex_toIndex][direction] = Train[]
    const running: Record<string, { 0: Train[]; 1: Train[] }> = {};

    stations.forEach((s) => {
      if (s.info?.code) {
        stopped[s.info.code] = { 0: [], 1: [] };
      }
    });

    for (const train of filteredTrains) {
      const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
      const dir = (train.direction === 0 ? 0 : 1) as 0 | 1;

      if (parsed.isStopped && parsed.stationCode) {
        if (!stopped[parsed.stationCode]) {
          stopped[parsed.stationCode] = { 0: [], 1: [] };
        }
        stopped[parsed.stationCode][dir].push(train);
      } else if (parsed.fromStationCode && parsed.toStationCode) {
        const i1 = stationIndexMap.get(parsed.fromStationCode);
        const i2 = stationIndexMap.get(parsed.toStationCode);
        const key = i1 !== undefined && i2 !== undefined
          ? `${Math.min(i1, i2)}_${Math.max(i1, i2)}`
          : `${parsed.fromStationCode}_${parsed.toStationCode}`;

        if (!running[key]) {
          running[key] = { 0: [], 1: [] };
        }
        running[key][dir].push(train);
      }
    }

    return { stopped, running };
  }, [filteredTrains, stationsMap, stationIndexMap, stations]);

  const dir0Label = lineMeta.directionLabels[0];
  const dir1Label = lineMeta.directionLabels[1];

  return (
    <div className="w-full bg-slate-950/60 rounded-2xl border border-slate-800 p-3 sm:p-5 flex flex-col gap-4">
      {/* Top track legend & direction indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 pb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ backgroundColor: lineMeta.color, color: lineMeta.textColor }}
            >
              {lineMeta.symbol}
            </span>
            <span className="font-bold text-white text-sm">{lineMeta.name} 線路ダイアグラム</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-mono-num">全 {stations.length} 駅</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-num">
          <div className="flex items-center gap-1.5 text-sky-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">{dir0Label} (Track 1)</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange-400">
            <span className="font-semibold">{dir1Label} (Track 2)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Schematic Track */}
      <div className="overflow-x-auto pb-4 pt-2">
        <div className="min-w-max flex items-stretch">
          {stations.map((st, idx) => {
            const code = st.info.code;
            const isSelected = selectedStation?.info.code === code;
            const stoppedDir0 = trainsByStationAndDirection.stopped[code]?.[0] || [];
            const stoppedDir1 = trainsByStationAndDirection.stopped[code]?.[1] || [];

            // Segment key to next station
            const nextSt = stations[idx + 1];
            const segmentKey = nextSt ? `${idx}_${idx + 1}` : null;
            const runningDir0 = segmentKey ? trainsByStationAndDirection.running[segmentKey]?.[0] || [] : [];
            const runningDir1 = segmentKey ? trainsByStationAndDirection.running[segmentKey]?.[1] || [] : [];

            return (
              <div key={code} className="flex items-stretch">
                {/* Station Node Column */}
                <div className="flex flex-col items-center w-28 sm:w-32">
                  {/* Track 1 (Dir 0: Upper / Inner) Train Slot */}
                  <div className="h-20 w-full flex flex-col justify-end items-center pb-1 gap-1">
                    {stoppedDir0.map((train) => {
                      const isTrainSelected = selectedTrain?.no === train.no;
                      const typeStyle = getTrainTypeStyle(train.displayType);
                      const isDelayed = train.delayMinutes > 0;
                      return (
                        <button
                          key={train.no}
                          type="button"
                          onClick={() => onSelectTrain(train)}
                          className={`w-full max-w-[108px] px-1.5 py-1 rounded-md text-[10px] flex items-center justify-between border cursor-pointer transition-all shadow-md group ${
                            isTrainSelected
                              ? 'ring-2 ring-sky-400 border-white bg-sky-950'
                              : isDelayed
                              ? 'bg-rose-950/90 border-rose-600 text-rose-100 hover:bg-rose-900'
                              : 'bg-slate-900/90 border-sky-600/80 text-sky-100 hover:bg-slate-800'
                          }`}
                        >
                          <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${typeStyle.badge}`}>
                            {train.displayType.slice(0, 2)}
                          </span>
                          <span className="font-semibold truncate max-w-[44px]">
                            {train.dest.text}
                          </span>
                          <span className="font-mono-num text-[9px] text-slate-400">
                            {train.no}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Track 1 Line Segment & Station Platform */}
                  <div className="w-full flex items-center justify-center relative py-1">
                    <div className="absolute inset-x-0 h-1 bg-sky-600/40" />
                    <div
                      className={`relative z-10 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                        stoppedDir0.length > 0
                          ? 'bg-sky-500 border-white ring-4 ring-sky-500/30'
                          : 'bg-slate-900 border-sky-500'
                      }`}
                    >
                      {stoppedDir0.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Station Node Central Pillar */}
                  <button
                    type="button"
                    onClick={() => onSelectStation(st)}
                    className={`my-2 w-full py-2.5 px-1 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-950 border-sky-400 ring-2 ring-sky-400/50 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-white text-xs sm:text-sm tracking-wide">
                      {st.info.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono-num">
                      {code}
                    </span>

                    {/* Transfer line tags */}
                    {st.info.transfer && st.info.transfer.length > 0 && (
                      <div className="mt-1 flex flex-wrap justify-center gap-0.5 max-w-[110px]">
                        {st.info.transfer.slice(0, 2).map((t, i) => (
                          <span
                            key={i}
                            className="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded truncate max-w-[50px]"
                            title={t.name}
                          >
                            {t.name.replace(/電車|線/g, '')}
                          </span>
                        ))}
                        {st.info.transfer.length > 2 && (
                          <span className="text-[8px] text-slate-400 font-mono-num">
                            +{st.info.transfer.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Track 2 Line Segment & Station Platform */}
                  <div className="w-full flex items-center justify-center relative py-1">
                    <div className="absolute inset-x-0 h-1 bg-orange-600/40" />
                    <div
                      className={`relative z-10 w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                        stoppedDir1.length > 0
                          ? 'bg-orange-500 border-white ring-4 ring-orange-500/30'
                          : 'bg-slate-900 border-orange-500'
                      }`}
                    >
                      {stoppedDir1.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Track 2 (Dir 1: Lower / Outer) Train Slot */}
                  <div className="h-20 w-full flex flex-col justify-start items-center pt-1 gap-1">
                    {stoppedDir1.map((train) => {
                      const isTrainSelected = selectedTrain?.no === train.no;
                      const typeStyle = getTrainTypeStyle(train.displayType);
                      const isDelayed = train.delayMinutes > 0;
                      return (
                        <button
                          key={train.no}
                          type="button"
                          onClick={() => onSelectTrain(train)}
                          className={`w-full max-w-[108px] px-1.5 py-1 rounded-md text-[10px] flex items-center justify-between border cursor-pointer transition-all shadow-md group ${
                            isTrainSelected
                              ? 'ring-2 ring-orange-400 border-white bg-orange-950'
                              : isDelayed
                              ? 'bg-rose-950/90 border-rose-600 text-rose-100 hover:bg-rose-900'
                              : 'bg-slate-900/90 border-orange-600/80 text-orange-100 hover:bg-slate-800'
                          }`}
                        >
                          <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${typeStyle.badge}`}>
                            {train.displayType.slice(0, 2)}
                          </span>
                          <span className="font-semibold truncate max-w-[44px]">
                            {train.dest.text}
                          </span>
                          <span className="font-mono-num text-[9px] text-slate-400">
                            {train.no}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In-Between Track Segment (Between current station and next station) */}
                {nextSt && (
                  <div className="flex flex-col items-center justify-between w-20 sm:w-24 shrink-0">
                    {/* Track 1 In-Transit Trains (Dir 0: Moving right to left) */}
                    <div className="h-20 w-full flex flex-col justify-end items-center pb-1 gap-1">
                      {runningDir0.map((train) => {
                        const isTrainSelected = selectedTrain?.no === train.no;
                        const typeStyle = getTrainTypeStyle(train.displayType);
                        const isDelayed = train.delayMinutes > 0;
                        return (
                          <button
                            key={train.no}
                            type="button"
                            onClick={() => onSelectTrain(train)}
                            className={`w-full px-1 py-0.5 rounded text-[9px] flex items-center justify-center gap-1 border cursor-pointer transition-all shadow-md ${
                              isTrainSelected
                                ? 'ring-2 ring-sky-400 bg-sky-950 border-white text-white'
                                : isDelayed
                                ? 'bg-rose-950/90 border-rose-600 text-rose-200'
                                : 'bg-slate-800/90 border-sky-700/80 text-sky-200'
                            }`}
                          >
                            <ArrowLeft className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                            <span className="font-bold truncate">{train.dest.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Track 1 Rail Line */}
                    <div className="w-full flex items-center justify-center relative py-1">
                      <div className="w-full h-1 bg-sky-600/40 relative">
                        {runningDir0.length > 0 && (
                          <div className="absolute inset-y-0 w-4 bg-sky-400 rounded animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Empty middle space */}
                    <div className="my-2 py-2 flex items-center justify-center">
                      <span className="text-[10px] text-slate-600 font-mono-num">
                        ―
                      </span>
                    </div>

                    {/* Track 2 Rail Line */}
                    <div className="w-full flex items-center justify-center relative py-1">
                      <div className="w-full h-1 bg-orange-600/40 relative">
                        {runningDir1.length > 0 && (
                          <div className="absolute inset-y-0 w-4 bg-orange-400 rounded animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Track 2 In-Transit Trains (Dir 1: Moving left to right) */}
                    <div className="h-20 w-full flex flex-col justify-start items-center pt-1 gap-1">
                      {runningDir1.map((train) => {
                        const isTrainSelected = selectedTrain?.no === train.no;
                        const typeStyle = getTrainTypeStyle(train.displayType);
                        const isDelayed = train.delayMinutes > 0;
                        return (
                          <button
                            key={train.no}
                            type="button"
                            onClick={() => onSelectTrain(train)}
                            className={`w-full px-1 py-0.5 rounded text-[9px] flex items-center justify-center gap-1 border cursor-pointer transition-all shadow-md ${
                              isTrainSelected
                                ? 'ring-2 ring-orange-400 bg-orange-950 border-white text-white'
                                : isDelayed
                                ? 'bg-rose-950/90 border-rose-600 text-rose-200'
                                : 'bg-slate-800/90 border-orange-700/80 text-orange-200'
                            }`}
                          >
                            <span className="font-bold truncate">{train.dest.text}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
