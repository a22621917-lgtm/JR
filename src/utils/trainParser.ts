import { ParsedTrainPosition, Station } from '../types';
export { getTrainTypeStyle, type TrainTypeStyle } from '../constants/lines';

/**
 * Parses a train position string according to JR West API specification:
 * - When stopped at a station: pos ends with "_####", e.g. "2509_####" (Stopped at 2509)
 * - When running between stations: pos is "{from}_{to}", e.g. "2511_2512" (In transit from 2511 to 2512)
 */
export function parseTrainPos(
  pos: string,
  stationsMap: Map<string, string>,
  direction: number
): ParsedTrainPosition {
  if (!pos) {
    return {
      isStopped: false,
      stationCode: null,
      fromStationCode: null,
      toStationCode: null,
      stationName: null,
      fromStationName: null,
      toStationName: null,
      statusLabel: '位置不明',
    };
  }

  // Check stopped state: pos ends with "_####"
  if (pos.endsWith('_####')) {
    const stationCode = pos.replace('_####', '').trim();
    const stationName = stationsMap.get(stationCode) || `駅コード:${stationCode}`;
    return {
      isStopped: true,
      stationCode,
      fromStationCode: null,
      toStationCode: null,
      stationName,
      fromStationName: null,
      toStationName: null,
      statusLabel: `${stationName} に停車中`,
    };
  }

  // Check running state: pos has "code1_code2"
  if (pos.includes('_')) {
    const parts = pos.split('_');
    const fromCode = parts[0];
    const toCode = parts[1];

    const fromName = stationsMap.get(fromCode) || fromCode;
    const toName = stationsMap.get(toCode) || toCode;

    // Depending on direction, order can be interpreted
    return {
      isStopped: false,
      stationCode: null,
      fromStationCode: fromCode,
      toStationCode: toCode,
      stationName: null,
      fromStationName: fromName,
      toStationName: toName,
      statusLabel: `${fromName} → ${toName} 間を走行中`,
    };
  }

  // Fallback single station
  const stationName = stationsMap.get(pos) || pos;
  return {
    isStopped: true,
    stationCode: pos,
    fromStationCode: null,
    toStationCode: null,
    stationName,
    fromStationName: null,
    toStationName: null,
    statusLabel: `${stationName} 付近`,
  };
}

/**
 * Build a lookup map of stationCode -> stationName from station list
 */
export function buildStationMap(stations: Station[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const st of stations) {
    if (st.info?.code && st.info?.name) {
      map.set(st.info.code, st.info.name);
    }
  }
  return map;
}

/**
 * Format delay minutes into human readable text
 */
export function formatDelay(delayMinutes: number): {
  text: string;
  isDelayed: boolean;
  colorClass: string;
} {
  if (!delayMinutes || delayMinutes <= 0) {
    return {
      text: '定時 (遅れなし)',
      isDelayed: false,
      colorClass: 'text-emerald-400',
    };
  }
  if (delayMinutes >= 30) {
    return {
      text: `約${delayMinutes}分遅れ`,
      isDelayed: true,
      colorClass: 'text-rose-400 font-bold',
    };
  }
  return {
    text: `約${delayMinutes}分遅れ`,
    isDelayed: true,
    colorClass: 'text-amber-400 font-semibold',
  };
}

/**
 * Parse facility code into human label
 */
export function getFacilityLabel(code: number): string {
  switch (code) {
    case 1:
      return '優先座席';
    case 2:
      return '車いす・ベビーカー対応';
    case 3:
      return '弱冷房車';
    case 4:
      return '女性専用車';
    default:
      return `設備 #${code}`;
  }
}

/**
 * Get congestion color and level label
 */
export function getCongestionStatus(percent: number): {
  label: string;
  colorClass: string;
  barColor: string;
} {
  if (!percent || percent <= 0) {
    return { label: '空席あり', colorClass: 'text-emerald-400', barColor: 'bg-emerald-500' };
  }
  if (percent < 100) {
    return { label: '空席あり・座れます', colorClass: 'text-emerald-400', barColor: 'bg-emerald-500' };
  }
  if (percent < 140) {
    return { label: '座席が埋まり立ち席あり', colorClass: 'text-sky-400', barColor: 'bg-sky-500' };
  }
  if (percent < 170) {
    return { label: 'やや混雑・肩が触れ合う', colorClass: 'text-amber-400', barColor: 'bg-amber-500' };
  }
  return { label: '混雑・ドア付近密集', colorClass: 'text-rose-400', barColor: 'bg-rose-500' };
}
