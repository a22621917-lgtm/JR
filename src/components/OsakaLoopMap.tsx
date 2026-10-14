import React, { useMemo } from 'react';
import { Train, Station, ParsedTrainPosition } from '../types';
import { parseTrainPos, getTrainTypeStyle, formatDelay } from '../utils/trainParser';
import { Clock, Navigation, AlertCircle } from 'lucide-react';

interface OsakaLoopMapProps {
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

// Station order along the loop in clockwise order (starting from Osaka at top)
const CLOCKWISE_STATION_CODES = [
  '0416', // 大阪
  '2519', // 天満
  '2518', // 桜ノ宮
  '2517', // 京橋
  '2516', // 大阪城公園
  '2515', // 森ノ宮
  '2514', // 玉造
  '2513', // 鶴橋
  '2512', // 桃谷
  '2511', // 寺田町
  '2510', // 天王寺
  '2509', // 新今宮
  '2508', // 今宮
  '2507', // 芦原橋
  '2506', // 大正
  '2504', // 弁天町
  '2503', // 西九条
  '2502', // 野田
  '2501', // 福島
];

export const OsakaLoopMap: React.FC<OsakaLoopMapProps> = ({
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
  const cx = 350;
  const cy = 350;
  const rOuter = 240; // Outer track: 外回り (direction 1, clockwise)
  const rInner = 190; // Inner track: 内回り (direction 0, counter-clockwise)
  const total = CLOCKWISE_STATION_CODES.length;

  // Station angle calculations
  const stationAngles = useMemo(() => {
    const map = new Map<string, { angle: number; rad: number }>();
    CLOCKWISE_STATION_CODES.forEach((code, i) => {
      // 0 is Osaka at top (-90 degrees)
      const deg = -90 + (i * 360) / total;
      const rad = (deg * Math.PI) / 180;
      map.set(code, { angle: deg, rad });
    });
    return map;
  }, [total]);

  // Map station object by code
  const stationObjMap = useMemo(() => {
    const map = new Map<string, Station>();
    stations.forEach((s) => {
      if (s.info?.code) map.set(s.info.code, s);
    });
    return map;
  }, [stations]);

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

  // Position calculation for each train
  const positionedTrains = useMemo(() => {
    return filteredTrains.map((train) => {
      const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
      const isInner = train.direction === 0;
      const r = isInner ? rInner : rOuter;

      let x = cx;
      let y = cy;
      let angle = 0;

      if (parsed.isStopped && parsed.stationCode) {
        // Stopped at station
        const posInfo = stationAngles.get(parsed.stationCode);
        if (posInfo) {
          angle = posInfo.angle;
          x = cx + r * Math.cos(posInfo.rad);
          y = cy + r * Math.sin(posInfo.rad);
        }
      } else if (parsed.fromStationCode && parsed.toStationCode) {
        // Between two stations
        const fromInfo = stationAngles.get(parsed.fromStationCode);
        const toInfo = stationAngles.get(parsed.toStationCode);
        if (fromInfo && toInfo) {
          let diff = toInfo.angle - fromInfo.angle;
          // Normalize diff
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          angle = fromInfo.angle + diff * 0.5;
          const rad = (angle * Math.PI) / 180;
          x = cx + r * Math.cos(rad);
          y = cy + r * Math.sin(rad);
        } else if (fromInfo) {
          angle = fromInfo.angle + (isInner ? -8 : 8);
          const rad = (angle * Math.PI) / 180;
          x = cx + r * Math.cos(rad);
          y = cy + r * Math.sin(rad);
        }
      }

      return {
        train,
        parsed,
        x,
        y,
        angle,
        isInner,
      };
    });
  }, [filteredTrains, stationsMap, stationAngles, rInner, rOuter]);

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center select-none bg-slate-950/60 rounded-2xl border border-slate-800 p-2 sm:p-4">
      {/* Legend & Track Guide */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-2 pb-2 text-xs border-b border-slate-800/80 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-orange-500 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">外回り (時計回り・外側)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1.5 rounded-full bg-sky-500 inline-block shadow-sm" />
            <span className="text-slate-300 font-medium">内回り (反時計回り・内側)</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            停車中: 駅マーカー
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            走行中: 駅間矢印
          </span>
        </div>
      </div>

      {/* SVG Loop Diagram */}
      <div className="w-full max-w-[700px] aspect-square relative flex items-center justify-center">
        <svg
          viewBox="0 0 700 700"
          className="w-full h-full drop-shadow-2xl"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Outer track gradient */}
            <linearGradient id="outerTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
            </linearGradient>

            {/* Inner track gradient */}
            <linearGradient id="innerTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
            </linearGradient>

            {/* Glowing train pulse */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Loop Badge */}
          <g transform={`translate(${cx}, ${cy})`}>
            <circle
              r="135"
              fill="#090d16"
              stroke="#1e293b"
              strokeWidth="2"
              className="transition-colors"
            />
            <circle
              r="130"
              fill="none"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Compass / Center Title */}
            <text
              y="-40"
              textAnchor="middle"
              className="fill-slate-500 font-bold text-[11px] tracking-widest"
            >
              JR WEST OSAKA LOOP LINE
            </text>
            <text
              y="-10"
              textAnchor="middle"
              className="fill-white font-extrabold text-2xl tracking-wider"
            >
              大阪環状線
            </text>
            <text
              y="18"
              textAnchor="middle"
              className="fill-orange-400 font-semibold text-xs tracking-wider"
            >
              [O] 環状運行モニター
            </text>

            {/* Quick center stats */}
            <g transform="translate(0, 48)">
              <rect
                x="-80"
                y="-12"
                width="160"
                height="28"
                rx="6"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                className="fill-slate-300 font-mono-num text-[11px] font-medium"
              >
                在線列車: <tspan className="fill-white font-bold">{filteredTrains.length}</tspan> 編成
              </text>
            </g>
          </g>

          {/* Outer Track (外回り) */}
          <circle
            cx={cx}
            cy={cy}
            r={rOuter}
            fill="none"
            stroke="url(#outerTrackGrad)"
            strokeWidth="5"
            strokeDasharray="8 3"
            opacity="0.9"
          />

          {/* Inner Track (内回り) */}
          <circle
            cx={cx}
            cy={cy}
            r={rInner}
            fill="none"
            stroke="url(#innerTrackGrad)"
            strokeWidth="5"
            strokeDasharray="8 3"
            opacity="0.9"
          />

          {/* Direction indicator arrows along track */}
          {/* Clockwise arrows (Outer) */}
          {[45, 135, 225, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = cx + rOuter * Math.cos(rad);
            const y = cy + rOuter * Math.sin(rad);
            const rot = deg + 90;
            return (
              <path
                key={`outer-arr-${deg}`}
                d="M -4 -6 L 5 0 L -4 6 Z"
                fill="#f97316"
                opacity="0.75"
                transform={`translate(${x}, ${y}) rotate(${rot})`}
              />
            );
          })}

          {/* Counter-clockwise arrows (Inner) */}
          {[45, 135, 225, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x = cx + rInner * Math.cos(rad);
            const y = cy + rInner * Math.sin(rad);
            const rot = deg - 90;
            return (
              <path
                key={`inner-arr-${deg}`}
                d="M -4 -6 L 5 0 L -4 6 Z"
                fill="#38bdf8"
                opacity="0.75"
                transform={`translate(${x}, ${y}) rotate(${rot})`}
              />
            );
          })}

          {/* Station Rungs / Bridges connecting inner and outer tracks */}
          {CLOCKWISE_STATION_CODES.map((code) => {
            const info = stationAngles.get(code);
            if (!info) return null;
            const station = stationObjMap.get(code);
            const isSelected = selectedStation?.info?.code === code;
            const isMajorStation = ['0416', '2510', '2517', '2503', '2509', '2513', '2504'].includes(code);

            // Radian and coords
            const rad = info.rad;
            const xInner = cx + (rInner - 12) * Math.cos(rad);
            const yInner = cy + (rInner - 12) * Math.sin(rad);
            const xOuter = cx + (rOuter + 12) * Math.cos(rad);
            const yOuter = cy + (rOuter + 12) * Math.sin(rad);

            // Platform node center (midway between tracks)
            const rMid = (rInner + rOuter) / 2;
            const xMid = cx + rMid * Math.cos(rad);
            const yMid = cy + rMid * Math.sin(rad);

            // Text label position (outside the outer track)
            const rText = rOuter + 38;
            const xText = cx + rText * Math.cos(rad);
            const yText = cy + rText * Math.sin(rad);

            const stName = station?.info?.name || stationsMap.get(code) || code;

            return (
              <g
                key={`st-${code}`}
                onClick={() => station && onSelectStation(station)}
                className="cursor-pointer group"
              >
                {/* Connecting Platform Bar between tracks */}
                <line
                  x1={xInner}
                  y1={yInner}
                  x2={xOuter}
                  y2={yOuter}
                  stroke={isSelected ? '#38bdf8' : isMajorStation ? '#94a3b8' : '#475569'}
                  strokeWidth={isMajorStation ? '6' : '4'}
                  strokeLinecap="round"
                  className="transition-colors group-hover:stroke-sky-400"
                />

                {/* Inner Track Station Marker */}
                <circle
                  cx={cx + rInner * Math.cos(rad)}
                  cy={cy + rInner * Math.sin(rad)}
                  r="4.5"
                  fill="#0f172a"
                  stroke={isSelected ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  className="transition-colors group-hover:stroke-white"
                />

                {/* Outer Track Station Marker */}
                <circle
                  cx={cx + rOuter * Math.cos(rad)}
                  cy={cy + rOuter * Math.sin(rad)}
                  r="4.5"
                  fill="#0f172a"
                  stroke={isSelected ? '#38bdf8' : '#64748b'}
                  strokeWidth="2"
                  className="transition-colors group-hover:stroke-white"
                />

                {/* Platform Badge Mid */}
                <circle
                  cx={xMid}
                  cy={yMid}
                  r={isMajorStation ? '6' : '4'}
                  fill={isSelected ? '#38bdf8' : isMajorStation ? '#e2e8f0' : '#64748b'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all group-hover:scale-125"
                />

                {/* Station Name Pill / Label */}
                <g transform={`translate(${xText}, ${yText})`}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`font-semibold transition-all ${
                      isSelected
                        ? 'fill-sky-300 font-bold text-xs scale-110'
                        : isMajorStation
                        ? 'fill-white font-bold text-[11px] group-hover:fill-sky-200'
                        : 'fill-slate-300 text-[10px] group-hover:fill-white'
                    }`}
                  >
                    {stName}
                  </text>
                  {/* Station Code subtext */}
                  <text
                    y="11"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-500 font-mono-num text-[8px]"
                  >
                    {code}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Trains Layer */}
          {positionedTrains.map(({ train, parsed, x, y, isInner }) => {
            const isSelected = selectedTrain?.no === train.no;
            const typeStyle = getTrainTypeStyle(train.displayType);
            const isDelayed = train.delayMinutes > 0;
            const isStopped = parsed.isStopped;

            return (
              <g
                key={`train-${train.no}`}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectTrain(train)}
                className="cursor-pointer group"
                filter={isSelected ? 'url(#glow)' : undefined}
              >
                {/* Active halo or selection ring */}
                {isSelected && (
                  <circle
                    r="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ transformOrigin: '0 0', animationDuration: '6s' }}
                  />
                )}

                {/* Stop glow if stopped at station */}
                {isStopped && (
                  <circle
                    r="14"
                    fill={isInner ? 'rgba(56, 189, 248, 0.25)' : 'rgba(249, 115, 22, 0.25)'}
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                )}

                {/* Train body box */}
                <rect
                  x="-13"
                  y="-11"
                  width="26"
                  height="22"
                  rx="6"
                  fill={isDelayed ? '#7f1d1d' : isInner ? '#0369a1' : '#c2410c'}
                  stroke={isSelected ? '#ffffff' : isDelayed ? '#ef4444' : isInner ? '#38bdf8' : '#fb923c'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  className="transition-all group-hover:scale-110 shadow-lg"
                />

                {/* Train Icon / Type short text */}
                <text
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-bold text-[9px] pointer-events-none"
                >
                  {train.displayType.slice(0, 2)}
                </text>

                {/* Delay badge bubble if delayed */}
                {isDelayed && (
                  <g transform="translate(10, -9)">
                    <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                    <text
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-bold text-[7px] font-mono-num"
                    >
                      !
                    </text>
                  </g>
                )}

                {/* Direction arrow badge */}
                <g transform="translate(-10, -9)">
                  <circle
                    r="5"
                    fill="#0f172a"
                    stroke={isInner ? '#38bdf8' : '#fb923c'}
                    strokeWidth="1"
                  />
                  <text
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-white font-bold text-[7px]"
                  >
                    {isInner ? '内' : '外'}
                  </text>
                </g>

                {/* Train Label Below (No & Destination) */}
                <g transform="translate(0, 18)" className="pointer-events-none">
                  <rect
                    x="-24"
                    y="-6"
                    width="48"
                    height="13"
                    rx="3"
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke="rgba(51, 65, 85, 0.8)"
                    strokeWidth="0.5"
                  />
                  <text
                    y="1"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-200 text-[8px] font-semibold"
                  >
                    {train.dest.text.slice(0, 4)}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Train Summary Bar at bottom of map */}
      <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {selectedTrain ? (
              <span className="text-white font-medium">
                選択中: 列車番号 {selectedTrain.no}（{selectedTrain.displayType} {selectedTrain.dest.text}行）
              </span>
            ) : selectedStation ? (
              <span className="text-white font-medium">
                選択中: {selectedStation.info.name}駅（駅コード: {selectedStation.info.code}）
              </span>
            ) : (
              '列車または駅をクリックすると詳細情報と車内混雑度を確認できます'
            )}
          </span>
        </div>

        {(selectedTrain || selectedStation) && (
          <button
            type="button"
            onClick={() => {
              if (selectedTrain) onSelectTrain(selectedTrain);
              if (selectedStation) onSelectStation(selectedStation);
            }}
            className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline text-[11px]"
          >
            詳細パネルを開く →
          </button>
        )}
      </div>
    </div>
  );
};
