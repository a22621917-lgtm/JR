import React, { useState, useMemo, useEffect } from 'react';
import { Train, TrainMonitorData, TransitRoute, TransitSearchOptions } from '../types';
import {
  ALL_NETWORK_STATIONS,
  POPULAR_STATIONS,
  searchTransitRoutes,
  addMinutesToTime,
} from '../utils/transitRouter';
import { getTrainTypeStyle, getCongestionStatus } from '../utils/trainParser';
import {
  ArrowUpDown,
  Search,
  Clock,
  Navigation,
  Train as TrainIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertTriangle,
  Gauge,
  Thermometer,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface TransitPlannerProps {
  liveTrains: Train[];
  stationsMap: Map<string, string>;
  trainMonitor: TrainMonitorData | null;
  onSelectTrain: (train: Train) => void;
  onNavigateToMap: () => void;
  initialFromStation?: string;
  initialToStation?: string;
}

export const TransitPlanner: React.FC<TransitPlannerProps> = ({
  liveTrains,
  stationsMap,
  trainMonitor,
  onSelectTrain,
  onNavigateToMap,
  initialFromStation = '大阪',
  initialToStation = '天王寺',
}) => {
  const [fromStation, setFromStation] = useState<string>(initialFromStation);
  const [toStation, setToStation] = useState<string>(initialToStation);
  const [timeMode, setTimeMode] = useState<'now' | 'departure' | 'arrival'>('now');
  const [targetTime, setTargetTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [priority, setPriority] = useState<'time' | 'transfer'>('time');

  // Search results
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});

  // Auto-complete suggestion state
  const [showFromSuggestions, setShowFromSuggestions] = useState<boolean>(false);
  const [showToSuggestions, setShowToSuggestions] = useState<boolean>(false);

  // Suggestions filtered
  const fromSuggestions = useMemo(() => {
    if (!fromStation) return POPULAR_STATIONS.slice(0, 8);
    return ALL_NETWORK_STATIONS.filter((s) => s.includes(fromStation) && s !== fromStation).slice(0, 6);
  }, [fromStation]);

  const toSuggestions = useMemo(() => {
    if (!toStation) return POPULAR_STATIONS.filter((s) => s !== fromStation).slice(0, 8);
    return ALL_NETWORK_STATIONS.filter((s) => s.includes(toStation) && s !== toStation).slice(0, 6);
  }, [toStation, fromStation]);

  // Execute search
  const handleSearch = () => {
    const searchOptions: TransitSearchOptions = {
      fromStation: fromStation.trim(),
      toStation: toStation.trim(),
      timeMode,
      time: targetTime,
      priority,
    };
    const results = searchTransitRoutes(searchOptions, liveTrains, stationsMap);
    setRoutes(results);
    setSelectedRouteIndex(0);
    setExpandedStops({});
  };

  // Run search when stations or time changes
  useEffect(() => {
    if (fromStation && toStation && fromStation !== toStation) {
      handleSearch();
    }
  }, [fromStation, toStation, timeMode, targetTime, priority, liveTrains]);

  // Station Swap
  const handleSwap = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
  };

  // Quick time adjustments
  const handleAdjustTime = (minutes: number) => {
    setTargetTime((prev) => addMinutesToTime(prev, minutes));
    setTimeMode('departure');
  };

  const handleResetToNow = () => {
    const now = new Date();
    setTargetTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setTimeMode('now');
  };

  const selectedRoute = routes[selectedRouteIndex];

  return (
    <div className="w-full space-y-4">
      {/* Search Header Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">JR西日本 乗り換え案内・時刻検索</h2>
              <p className="text-xs text-slate-400">
                走行中の列車位置・号車混雑度・遅延分数を自動反映したリアルタイム経路案内
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              在線列車リアルタイム連動
            </span>
          </div>
        </div>

        {/* Departure & Arrival Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-2 relative">
          {/* Departure Station */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              出発駅 (From)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fromStation}
                onChange={(e) => {
                  setFromStation(e.target.value);
                  setShowFromSuggestions(true);
                }}
                onFocus={() => setShowFromSuggestions(true)}
                placeholder="例: 大阪、西九条、天王寺"
                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-bold placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Suggestions dropdown */}
            {showFromSuggestions && fromSuggestions.length > 0 && (
              <div
                className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 space-y-0.5"
                onMouseDown={(e) => e.preventDefault()}
              >
                {fromSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setFromStation(s);
                      setShowFromSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{s} 駅</span>
                    <span className="text-[10px] text-slate-500">JR線</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center md:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm"
              title="出発地と目的地を入れ替え"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Arrival Station */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              到着駅 (To)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={toStation}
                onChange={(e) => {
                  setToStation(e.target.value);
                  setShowToSuggestions(true);
                }}
                onFocus={() => setShowToSuggestions(true)}
                placeholder="例: 天王寺、ユニバーサルシティ、京都"
                className="w-full bg-slate-950 border border-slate-700 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-bold placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Suggestions dropdown */}
            {showToSuggestions && toSuggestions.length > 0 && (
              <div
                className="absolute z-30 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1.5 space-y-0.5"
                onMouseDown={(e) => e.preventDefault()}
              >
                {toSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setToStation(s);
                      setShowToSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <span>{s} 駅</span>
                    <span className="text-[10px] text-slate-500">JR線</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Station Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-500 text-[11px]">よく使われる駅:</span>
          {['大阪', '天王寺', '京橋', '西九条', 'ユニバーサルシティ', '新大阪', '京都', '三ノ宮', '奈良'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                if (!fromStation || fromStation === st) {
                  setToStation(st);
                } else {
                  setToStation(st);
                }
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-[11px] cursor-pointer"
            >
              {st}
            </button>
          ))}
        </div>

        {/* Time Mode, Target Time & Priority Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          {/* Time Mode Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              日時指定
            </label>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTimeMode('now')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  timeMode === 'now'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                現在時刻
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('departure')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  timeMode === 'departure'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                出発指定
              </button>
              <button
                type="button"
                onClick={() => setTimeMode('arrival')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  timeMode === 'arrival'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                到着指定
              </button>
            </div>
          </div>

          {/* Time Picker & Quick adjustment */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              {timeMode === 'arrival' ? '到着希望時刻' : '出発時刻'}
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => {
                    setTargetTime(e.target.value);
                    if (timeMode === 'now') setTimeMode('departure');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2 py-1.5 text-xs font-mono-num text-white font-bold outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAdjustTime(10)}
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-num text-[11px] border border-slate-700 cursor-pointer"
                title="10分後"
              >
                +10分
              </button>
              <button
                type="button"
                onClick={() => handleAdjustTime(30)}
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-num text-[11px] border border-slate-700 cursor-pointer"
                title="30分後"
              >
                +30分
              </button>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              優先条件
            </label>
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPriority('time')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  priority === 'time'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                時間順 (早い)
              </button>
              <button
                type="button"
                onClick={() => setPriority('transfer')}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  priority === 'transfer'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                乗換少ない順
              </button>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleSearch}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer text-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>この条件で検索</span>
            </button>
          </div>
        </div>
      </div>

      {/* Popular Trip Recommendations (if no search or empty) */}
      {routes.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <TrainIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <h3 className="font-bold text-white text-base">おすすめの人気ルートから検索</h3>
            <p className="text-xs text-slate-400 mt-1">ワンクリックで出発駅と到着駅がセットされます</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
            {[
              { from: '大阪', to: '天王寺', label: '大阪環状線（内回り/外回り）' },
              { from: '大阪', to: 'ユニバーサルシティ', label: '西九条乗り換え USJ直通' },
              { from: '大阪', to: '京都', label: 'JR京都線（新快速・快速）' },
              { from: '天王寺', to: '奈良', label: '大和路線（大和路快速）' },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setFromStation(item.from);
                  setToStation(item.to);
                }}
                className="p-3 bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-xl text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-white text-sm group-hover:text-sky-300 flex items-center gap-1">
                  <span>{item.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
                  <span>{item.to}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{item.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results Display */}
      {routes.length > 0 && (
        <div className="space-y-4">
          {/* Route Candidate Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {routes.map((route, idx) => {
              const isSelected = selectedRouteIndex === idx;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRouteIndex(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-sm ${
                    isSelected
                      ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/40'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">
                        第{idx + 1}候補
                      </span>
                      {route.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            tag === '早'
                              ? 'bg-rose-600 text-white'
                              : tag === '楽'
                              ? 'bg-emerald-600 text-white'
                              : tag === '直通'
                              ? 'bg-sky-600 text-white'
                              : 'bg-amber-600 text-slate-950'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {route.isRealtimeLinked && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        リアルタイム
                      </span>
                    )}
                  </div>

                  {/* Times & Duration */}
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="font-mono-num font-bold text-white text-lg">
                      {route.departureTime}{' '}
                      <span className="text-xs text-slate-400 font-normal">発</span> →{' '}
                      {route.arrivalTime}{' '}
                      <span className="text-xs text-slate-400 font-normal">着</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span className="font-medium text-slate-300">
                      所要時間: <strong className="text-white font-mono-num">{route.totalDurationMinutes}分</strong>
                    </span>
                    <span>
                      {route.transferCount === 0 ? '乗換 0回 (直通)' : `乗換 ${route.transferCount}回`}
                    </span>
                    <span className="font-mono-num text-slate-300">
                      ¥{route.fare}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Route Detail Card */}
          {selectedRoute && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
              {/* Route Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <div className="flex flex-wrap items-baseline gap-3">
                  <div className="text-xl sm:text-2xl font-black text-white font-mono-num tracking-wide">
                    {selectedRoute.departureTime}{' '}
                    <span className="text-xs text-slate-400 font-normal">発</span>
                    <span className="text-slate-600 mx-1.5">→</span>
                    {selectedRoute.arrivalTime}{' '}
                    <span className="text-xs text-slate-400 font-normal">着</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    (所要時間: <strong className="text-sky-400 font-bold">{selectedRoute.totalDurationMinutes}分</strong>)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                    {selectedRoute.transferCount === 0 ? '直通（乗り換えなし）' : `乗り換え ${selectedRoute.transferCount}回`}
                  </span>
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg font-mono-num text-slate-200">
                    IC運賃目安: ¥{selectedRoute.fare}
                  </span>
                </div>
              </div>

              {/* Real-time Linked Train Highlight Banner */}
              {selectedRoute.isRealtimeLinked && (
                <div className="bg-emerald-950/40 border border-emerald-600/50 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-emerald-200 shadow-md">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-mono-num">
                          LIVE
                        </span>
                        <span>現在走行中の列車位置と同期しています</span>
                      </div>
                      <p className="text-xs text-emerald-300/90 mt-0.5">
                        {selectedRoute.legs[0]?.liveTrain?.no && (
                          <>
                            対象列車: <strong>#{selectedRoute.legs[0].liveTrain.no}</strong>（{selectedRoute.legs[0].trainType} {selectedRoute.legs[0].trainDest}行）
                          </>
                        )}
                        {selectedRoute.liveDelayMinutes > 0 ? (
                          <span className="text-rose-400 font-bold ml-2">
                            ※現在約{selectedRoute.liveDelayMinutes}分遅れが発生中（時刻に反映済み）
                          </span>
                        ) : (
                          <span className="text-emerald-300 ml-2">※定時運行中</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {selectedRoute.legs[0]?.liveTrain && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRoute.legs[0].liveTrain) {
                          onSelectTrain(selectedRoute.legs[0].liveTrain);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>この列車の車内混雑を見る</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Step-by-Step Vertical Itinerary Timeline */}
              <div className="space-y-0 relative pl-4 sm:pl-6 before:absolute before:left-7 sm:before:left-9 before:top-4 before:bottom-4 before:w-1 before:bg-slate-800">
                {selectedRoute.legs.map((leg, legIdx) => {
                  const typeStyle = getTrainTypeStyle(leg.trainType);
                  const isStopsExpanded = Boolean(expandedStops[legIdx]);

                  // Retrieve per-car monitoring data for this train if available
                  const monitorEntry = leg.liveTrain?.no
                    ? trainMonitor?.trains?.[leg.liveTrain.no]?.[0]
                    : null;
                  const avgCongestion = monitorEntry?.cars?.length
                    ? Math.round(
                        monitorEntry.cars.reduce((sum, c) => sum + c.congestion, 0) /
                          monitorEntry.cars.length
                      )
                    : null;
                  const congestionStatus = avgCongestion
                    ? getCongestionStatus(avgCongestion)
                    : null;

                  return (
                    <div key={legIdx} className="relative pb-6 last:pb-0 space-y-3">
                      {/* Departure Station Node */}
                      <div className="flex items-center gap-3 relative z-10">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md ring-4 ring-slate-900 shrink-0 font-mono-num"
                          style={{ backgroundColor: leg.lineColor }}
                        >
                          {leg.lineSymbol}
                        </div>
                        <div className="flex-1 flex flex-wrap items-baseline justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base sm:text-lg text-white">
                              {leg.departureStation}
                            </span>
                            <span className="text-xs text-slate-400 font-mono-num">
                              {leg.trackPlatform || 'のりば'}
                            </span>
                          </div>
                          <span className="text-base font-bold font-mono-num text-sky-400">
                            {leg.departureTime} <span className="text-xs text-slate-400 font-normal">発</span>
                          </span>
                        </div>
                      </div>

                      {/* Travel Line Body / Segment */}
                      <div className="ml-10 sm:ml-12 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold shadow-sm ${typeStyle.badge}`}
                            >
                              {leg.trainType}
                            </span>
                            <span className="font-bold text-white text-sm">
                              {leg.lineName}
                            </span>
                            <span className="text-xs text-slate-300">
                              （{leg.trainDest} 行）
                            </span>
                          </div>

                          <span className="text-xs font-mono-num text-slate-400">
                            所要 {leg.durationMinutes}分 ({leg.stopsCount}駅)
                          </span>
                        </div>

                        {/* Train Live status & Congestion if linked */}
                        {leg.liveTrain && (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-num text-slate-400">
                                列車番号: <strong>#{leg.liveTrain.no}</strong>
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-400">
                                {leg.liveTrain.numberOfCars || 8}両編成
                              </span>
                            </div>

                            {avgCongestion !== null && congestionStatus && (
                              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                                <Gauge className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-400">混雑:</span>
                                <span className={`font-bold font-mono-num ${congestionStatus.colorClass}`}>
                                  {avgCongestion}%
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({congestionStatus.label.split('・')[0]})
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Expandable intermediate stops list */}
                        {leg.stopStations && leg.stopStations.length > 2 && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedStops((prev) => ({
                                  ...prev,
                                  [legIdx]: !prev[legIdx],
                                }))
                              }
                              className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <span>停車駅一覧（{leg.stopStations.length - 2}駅を通過/停車）</span>
                              {isStopsExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isStopsExpanded && (
                              <div className="mt-2 pl-3 border-l-2 border-slate-800 space-y-1 text-[11px] text-slate-400 py-1 animate-in fade-in duration-150">
                                {leg.stopStations.slice(1, -1).map((s, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                    <span>{s}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Transfer waiting box between legs */}
                      {legIdx < selectedRoute.legs.length - 1 && (
                        <div className="ml-10 sm:ml-12 p-2.5 bg-amber-950/30 border border-amber-700/40 rounded-lg flex items-center justify-between text-xs text-amber-200">
                          <div className="flex items-center gap-2 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span>
                              {leg.arrivalStation}駅 にて乗り換え (接続待ち約3〜4分)
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-400/80">
                            ホーム移動
                          </span>
                        </div>
                      )}

                      {/* Final Arrival Station Node */}
                      {legIdx === selectedRoute.legs.length - 1 && (
                        <div className="flex items-center gap-3 relative z-10 pt-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs text-white shadow-md ring-4 ring-slate-900 shrink-0">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-extrabold text-base sm:text-lg text-white">
                              {leg.arrivalStation}
                            </span>
                            <span className="text-base font-bold font-mono-num text-orange-400">
                              {leg.arrivalTime} <span className="text-xs text-slate-400 font-normal">着</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-10)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer transition-colors"
                  >
                    ← 1本前の列車
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(10)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer transition-colors"
                  >
                    1本後の列車 →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onNavigateToMap}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>この路線の走行位置マップを見る</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
