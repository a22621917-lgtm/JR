import React from 'react';
import { Train, TrainMonitorData, Station } from '../types';
import { parseTrainPos, getTrainTypeStyle, formatDelay, getCongestionStatus, getFacilityLabel } from '../utils/trainParser';
import { KNOWN_LINES, LineMeta } from '../constants/lines';
import {
  X,
  Clock,
  Train as TrainIcon,
  Navigation,
  Thermometer,
  Gauge,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface TrainDetailModalProps {
  train: Train | null;
  onClose: () => void;
  stationsMap: Map<string, string>;
  trainMonitor: TrainMonitorData | null;
  currentLineKey: string;
}

export const TrainDetailModal: React.FC<TrainDetailModalProps> = ({
  train,
  onClose,
  stationsMap,
  trainMonitor,
  currentLineKey,
}) => {
  if (!train) return null;

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

  const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
  const typeStyle = getTrainTypeStyle(train.displayType);
  const delayInfo = formatDelay(train.delayMinutes);
  const dirLabel =
    train.direction === 0
      ? lineMeta.directionLabels[0]
      : lineMeta.directionLabels[1];

  // Retrieve per-car monitoring data
  const monitorEntry = trainMonitor?.trains?.[train.no]?.[0];
  const monitoredCars = monitorEntry?.cars;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-lg text-sm font-bold shadow-md ${typeStyle.badge}`}
            >
              {train.displayType}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-mono-num">
                  {train.no}
                </h2>
                {train.nickname && (
                  <span className="text-sm font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                    {train.nickname}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lineMeta.name} • {dirLabel}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status & Destination Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Destination Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-xs text-slate-400 font-medium">行先・系統</span>
              <div className="text-xl font-bold text-white mt-1">
                {train.dest.text} 行
              </div>
              {train.via && (
                <div className="text-xs text-slate-400 mt-1">
                  経由: {train.via}
                </div>
              )}
              {train.typeChange && (
                <div className="mt-2 text-xs text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded">
                  種別変更: {train.typeChange}
                </div>
              )}
            </div>

            {/* Current Position & Delay Card */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">現在位置</span>
                <span className={`text-xs font-mono-num font-bold ${delayInfo.colorClass}`}>
                  {delayInfo.text}
                </span>
              </div>

              <div className="mt-2">
                {parsed.isStopped ? (
                  <div className="flex items-center gap-2 text-emerald-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <div className="font-bold text-sm sm:text-base">
                        {parsed.statusLabel}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        駅コード: {parsed.stationCode}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sky-300">
                    <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <div className="font-bold text-sm sm:text-base">
                        {parsed.statusLabel}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        区間: {parsed.fromStationCode} → {parsed.toStationCode}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {train.stopTime && (
                <div className="mt-2 text-[11px] text-slate-500 font-mono-num flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>位置情報更新: {new Date(train.stopTime).toLocaleTimeString('ja-JP')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Train specs bar */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <TrainIcon className="w-4 h-4 text-sky-400" />
              <span>編成両数:</span>
              <span className="font-bold text-white font-mono-num">
                {train.numberOfCars || 8} 両編成
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>方向:</span>
              <span className="font-bold text-white">{dirLabel}</span>
            </div>

            {train.aSeatInfo && (
              <div className="flex items-center gap-1.5 text-sky-300 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                <span>有料座席 (Aシート):</span>
                <span className="font-semibold">{train.aSeatInfo}</span>
              </div>
            )}
          </div>

          {/* Real-time Car Congestion & Climate Monitor */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-white text-sm">
                  号車別 リアルタイム混雑度・車内環境
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono-num">
                trainmonitorinfo.json
              </span>
            </div>

            {monitoredCars && monitoredCars.length > 0 ? (
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {monitoredCars.map((car) => {
                    const status = getCongestionStatus(car.congestion);
                    const isMildAC = car.types?.includes(3);
                    const isWomenOnly = car.types?.includes(4);
                    const hasWheelchair = car.facilities?.includes(2);

                    return (
                      <div
                        key={car.carNo}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-sm"
                      >
                        {/* Car Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs font-mono-num bg-slate-800 px-1.5 py-0.5 rounded">
                            {car.carNo}号車
                          </span>
                          <span className="font-bold text-xs text-sky-400 font-mono-num flex items-center gap-0.5">
                            <Thermometer className="w-3 h-3 text-sky-400" />
                            {car.temp}°C
                          </span>
                        </div>

                        {/* Congestion Meter */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-slate-400">混雑率</span>
                            <span className={`font-bold font-mono-num ${status.colorClass}`}>
                              {car.congestion}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${status.barColor} transition-all duration-500`}
                              style={{ width: `${Math.min(car.congestion, 200) / 2}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-400 mt-1 truncate">
                            {status.label}
                          </div>
                        </div>

                        {/* Facility tags */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
                          {isMildAC && (
                            <span className="text-[8px] bg-sky-950 text-sky-300 border border-sky-800 px-1 rounded">
                              弱冷房車
                            </span>
                          )}
                          {isWomenOnly && (
                            <span className="text-[8px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded">
                              女性専用車
                            </span>
                          )}
                          {hasWheelchair && (
                            <span className="text-[8px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded">
                              車いす
                            </span>
                          )}
                          {!isMildAC && !isWomenOnly && !hasWheelchair && (
                            <span className="text-[8px] text-slate-500">標準設備</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 px-4 bg-slate-900/40 rounded-xl text-center space-y-2">
                <Info className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">
                  この列車の号車別センサーデータ（混雑度・温度）は現在未受信または非対応編成です。
                </p>
                <div className="text-[11px] text-slate-500">
                  ※JR西日本の新型車両（323系・225系・227系等）搭載のモニタリングシステム対応列車で自動配信されます。
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <span>JR西日本 列車走行位置データ (JSON v3)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
