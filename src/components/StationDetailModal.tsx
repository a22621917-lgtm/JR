import React, { useMemo } from 'react';
import { Station, Train } from '../types';
import { parseTrainPos, getTrainTypeStyle, formatDelay } from '../utils/trainParser';
import { KNOWN_LINES, LineMeta } from '../constants/lines';
import { X, MapPin, ArrowRightLeft, Train as TrainIcon, Navigation, Clock } from 'lucide-react';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  trains: Train[];
  stationsMap: Map<string, string>;
  currentLineKey: string;
  onSelectTrain: (train: Train) => void;
  onPlanTransit?: (fromStation?: string, toStation?: string) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  trains,
  stationsMap,
  currentLineKey,
  onSelectTrain,
  onPlanTransit,
}) => {
  if (!station) return null;

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

  const stCode = station.info.code;
  const stName = station.info.name;

  // Trains currently stopped at this station
  const stoppedTrains = useMemo(() => {
    return trains.filter((t) => {
      const parsed = parseTrainPos(t.pos, stationsMap, t.direction);
      return parsed.isStopped && parsed.stationCode === stCode;
    });
  }, [trains, stationsMap, stCode]);

  // Trains approaching this station (running toward this station)
  const approachingTrains = useMemo(() => {
    return trains.filter((t) => {
      const parsed = parseTrainPos(t.pos, stationsMap, t.direction);
      return !parsed.isStopped && parsed.toStationCode === stCode;
    });
  }, [trains, stationsMap, stCode]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md font-mono-num"
              style={{ backgroundColor: lineMeta.color }}
            >
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">
                  {stName} 駅
                </h2>
                <span className="text-xs text-slate-400 font-mono-num bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  CODE: {stCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lineMeta.name} 所属駅
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Quick Transit Actions */}
          {onPlanTransit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlanTransit(stName, undefined);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-950/80 hover:bg-sky-900/80 border border-sky-700/70 text-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>ここを出発駅に設定</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPlanTransit(undefined, stName);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-orange-950/80 hover:bg-orange-900/80 border border-orange-700/70 text-orange-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span>ここを到着駅に設定</span>
              </button>
            </div>
          )}

          {/* Transfer lines */}
          {station.info.transfer && station.info.transfer.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>乗り換え可能路線</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {station.info.transfer.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-800/80 text-slate-200 border border-slate-700/80 px-2.5 py-1 rounded-lg font-medium"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Currently Stopped Trains */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                当駅に停車中の列車 ({stoppedTrains.length}本)
              </span>
            </div>

            {stoppedTrains.length === 0 ? (
              <div className="py-4 px-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-500 text-center">
                現在、当駅に停車中の列車はありません
              </div>
            ) : (
              <div className="space-y-2">
                {stoppedTrains.map((train) => {
                  const typeStyle = getTrainTypeStyle(train.displayType);
                  const delayInfo = formatDelay(train.delayMinutes);
                  const dirLabel =
                    train.direction === 0
                      ? lineMeta.directionLabels[0]
                      : lineMeta.directionLabels[1];

                  return (
                    <div
                      key={train.no}
                      onClick={() => {
                        onClose();
                        onSelectTrain(train);
                      }}
                      className="p-3 bg-slate-950/70 border border-slate-800 hover:border-sky-500 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${typeStyle.badge}`}
                        >
                          {train.displayType}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {train.dest.text} 行
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono-num flex items-center gap-2">
                            <span>#{train.no}</span>
                            <span>•</span>
                            <span>{dirLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-mono-num font-semibold ${delayInfo.colorClass}`}>
                          {delayInfo.text}
                        </div>
                        <span className="text-[10px] text-sky-400 group-hover:underline">
                          詳細を表示 →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approaching Trains */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                当駅へ接近中の列車 ({approachingTrains.length}本)
              </span>
            </div>

            {approachingTrains.length === 0 ? (
              <div className="py-4 px-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-500 text-center">
                直近の駅間を走行中の接近列車はありません
              </div>
            ) : (
              <div className="space-y-2">
                {approachingTrains.map((train) => {
                  const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
                  const typeStyle = getTrainTypeStyle(train.displayType);
                  const delayInfo = formatDelay(train.delayMinutes);
                  const dirLabel =
                    train.direction === 0
                      ? lineMeta.directionLabels[0]
                      : lineMeta.directionLabels[1];

                  return (
                    <div
                      key={train.no}
                      onClick={() => {
                        onClose();
                        onSelectTrain(train);
                      }}
                      className="p-3 bg-slate-950/70 border border-slate-800 hover:border-sky-500 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${typeStyle.badge}`}
                        >
                          {train.displayType}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {train.dest.text} 行
                          </div>
                          <div className="text-[11px] text-sky-300 font-mono-num">
                            {parsed.fromStationName} より進行中
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xs font-mono-num font-semibold ${delayInfo.colorClass}`}>
                          {delayInfo.text}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {dirLabel.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
