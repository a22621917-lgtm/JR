import { Train, TransitRoute, TransitLeg, TransitSearchOptions } from '../types';
import { KNOWN_LINES } from '../constants/lines';
import { parseTrainPos } from './trainParser';

// Station definitions per line
export interface LineStationDef {
  name: string;
  code?: string;
  minutesFromStart: number;
}

export const NETWORK_STATIONS: Record<string, { name: string; symbol: string; color: string; stations: string[]; defaultInterval: number }> = {
  osakaloop_inner: {
    name: '大阪環状線 (内回り)',
    symbol: 'O',
    color: '#E25227',
    stations: [
      '大阪', '福島', '野田', '西九条', '弁天町', '大正', '芦原橋', '今宮', '新今宮', '天王寺',
      '寺田町', '桃谷', '鶴橋', '玉造', '森ノ宮', '大阪城公園', '京橋', '桜ノ宮', '天満', '大阪'
    ],
    defaultInterval: 4,
  },
  osakaloop_outer: {
    name: '大阪環状線 (外回り)',
    symbol: 'O',
    color: '#E25227',
    stations: [
      '大阪', '天満', '桜ノ宮', '京橋', '大阪城公園', '森ノ宮', '玉造', '鶴橋', '桃谷', '寺田町',
      '天王寺', '新今宮', '今宮', '芦原橋', '大正', '弁天町', '西九条', '野田', '福島', '大阪'
    ],
    defaultInterval: 4,
  },
  yumesaki: {
    name: 'JRゆめ咲線',
    symbol: 'P',
    color: '#003580',
    stations: ['西九条', '安治川口', 'ユニバーサルシティ', '桜島'],
    defaultInterval: 6,
  },
  kyoto: {
    name: 'JR京都線',
    symbol: 'A',
    color: '#0072BC',
    stations: [
      '大阪', '新大阪', '東淀川', '吹田', '岸辺', '千里丘', '茨木', '摂津富田',
      'JR総持寺', '高槻', '島本', '山崎', '長岡京', '向日町', '桂川', '西大路', '京都'
    ],
    defaultInterval: 5,
  },
  kobesanyo: {
    name: 'JR神戸線',
    symbol: 'A',
    color: '#0072BC',
    stations: [
      '大阪', '塚本', '尼崎', '立花', '甲子園口', '西宮', 'さくら夙川', '芦屋',
      '甲南山手', '摂津本山', '住吉', '六甲道', '摩耶', '灘', '三ノ宮', '元町',
      '神戸', '兵庫', '新長田', '鷹取', '須磨', '垂水', '舞子', '明石', '西明石', '姫路'
    ],
    defaultInterval: 5,
  },
  yamatoji: {
    name: '大和路線',
    symbol: 'Q',
    color: '#00A650',
    stations: [
      'JR難波', '今宮', '新今宮', '天王寺', '東部市場前', '平野', '加美', '久宝寺',
      '八尾', '志紀', '柏原', '高井田', '河内堅上', '三郷', '王寺', '法隆寺',
      '大和小泉', '郡山', '奈良', '木津', '加茂'
    ],
    defaultInterval: 8,
  },
  hanwa: {
    name: '阪和線・関西空港線',
    symbol: 'R',
    color: '#F68B1F',
    stations: [
      '天王寺', '美章園', '南田辺', '鶴ケ丘', '長居', '我孫子町', '杉本町', '浅香',
      '堺市', '三国ケ丘', '百舌鳥', '上野芝', '津久野', '鳳', '富木', '北信太',
      '信太山', '和泉府中', '久米田', '下松', '東岸和田', '熊取', '日根野', 'りんくうタウン', '関西空港'
    ],
    defaultInterval: 6,
  },
  osakahigashi: {
    name: 'おおさか東線',
    symbol: 'F',
    color: '#4753A2',
    stations: [
      '大阪', '新大阪', '南吹田', 'JR淡路', '城北公園通', 'JR野江', '鴫野', '放出',
      'JR河内永和', 'JR俊徳道', 'JR長瀬', '衣摺加美北', '新加美', '久宝寺'
    ],
    defaultInterval: 12,
  },
  tozai: {
    name: 'JR東西線・学研都市線',
    symbol: 'H',
    color: '#D5007F',
    stations: [
      '尼崎', '加島', '御幣島', '海老江', '新福島', '北新地', '大阪天満宮', '大阪城北詰',
      '京橋', '鴫野', '放出', '徳庵', '鴻池新田', '住道', '四条畷', '松井山手', '木津'
    ],
    defaultInterval: 7,
  },
  nara: {
    name: '奈良線',
    symbol: 'D',
    color: '#9E5926',
    stations: ['京都', '東福寺', '稲荷', 'JR藤森', '桃山', '六地蔵', '黄檗', '宇治', '城陽', '玉水', '木津', '奈良'],
    defaultInterval: 10,
  },
};

// Popular station quick picks
export const POPULAR_STATIONS = [
  '大阪',
  '天王寺',
  '京橋',
  '西九条',
  'ユニバーサルシティ',
  '新大阪',
  '京都',
  '三ノ宮',
  '奈良',
  '関西空港',
  'JR難波',
  '鶴橋',
  '弁天町',
  '高槻',
  '尼崎',
];

// All distinct stations in the network
export const ALL_NETWORK_STATIONS: string[] = (() => {
  const set = new Set<string>();
  Object.values(NETWORK_STATIONS).forEach((line) => {
    line.stations.forEach((s) => set.add(s));
  });
  return Array.from(set);
})();

// Helper to add minutes to time "HH:mm"
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutesToAdd;
  const newTotal = (total % 1440 + 1440) % 1440;
  const newH = Math.floor(newTotal / 60);
  const newM = newTotal % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

// Difference in minutes between two "HH:mm" strings
export function diffMinutes(startTime: string, endTime: string): number {
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 1440;
  return diff;
}

// Calculate fare approximation in yen based on minutes
export function calculateFare(durationMinutes: number): number {
  if (durationMinutes <= 8) return 140;
  if (durationMinutes <= 15) return 170;
  if (durationMinutes <= 25) return 210;
  if (durationMinutes <= 35) return 250;
  if (durationMinutes <= 50) return 420;
  if (durationMinutes <= 70) return 660;
  return 890;
}

// Try to find a live train approaching fromStation
function findApproachingLiveTrain(
  fromStation: string,
  toStation: string,
  liveTrains: Train[],
  stationsMap: Map<string, string>,
  lineKey: string
): { train: Train; estimatedWaitMinutes: number } | null {
  if (!liveTrains || liveTrains.length === 0) return null;

  for (const train of liveTrains) {
    const parsed = parseTrainPos(train.pos, stationsMap, train.direction);
    // If stopped at fromStation
    if (parsed.isStopped && parsed.stationName === fromStation) {
      return { train, estimatedWaitMinutes: Math.max(0, train.delayMinutes) };
    }
    // If running toward fromStation
    if (parsed.toStationName === fromStation) {
      return { train, estimatedWaitMinutes: Math.max(1, 2 + train.delayMinutes) };
    }
  }

  // Fallback to first train on the line
  if (liveTrains[0]) {
    return { train: liveTrains[0], estimatedWaitMinutes: 3 };
  }

  return null;
}

// Search direct route on a single line
function findDirectRoute(
  from: string,
  to: string,
  baseTime: string,
  liveTrains: Train[],
  stationsMap: Map<string, string>
): TransitRoute[] {
  const routes: TransitRoute[] = [];

  for (const [key, lineDef] of Object.entries(NETWORK_STATIONS)) {
    const list = lineDef.stations;
    const fromIdx = list.indexOf(from);
    const toIdx = list.indexOf(to);

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
      // Loop lines or linear
      let stops: string[] = [];
      let duration = 0;

      if (key.startsWith('osakaloop')) {
        // Linear check in array order
        if (fromIdx < toIdx) {
          stops = list.slice(fromIdx, toIdx + 1);
          duration = Math.round((toIdx - fromIdx) * 1.9);
        } else {
          // Wrapped around loop
          const wrapped = list.slice(fromIdx).concat(list.slice(1, toIdx + 1));
          stops = wrapped;
          duration = Math.round((wrapped.length - 1) * 1.9);
        }
      } else {
        // Standard directional line
        if (fromIdx < toIdx) {
          stops = list.slice(fromIdx, toIdx + 1);
          duration = Math.max(3, Math.round((toIdx - fromIdx) * 2.1));
        } else {
          // Opposite direction
          stops = list.slice(toIdx, fromIdx + 1).reverse();
          duration = Math.max(3, Math.round((fromIdx - toIdx) * 2.1));
        }
      }

      if (stops.length > 1 && duration < 60) {
        // Check live train
        const liveInfo = findApproachingLiveTrain(from, to, liveTrains, stationsMap, key);
        const waitMins = liveInfo ? liveInfo.estimatedWaitMinutes : 2;
        const depTime = addMinutesToTime(baseTime, waitMins);
        const arrTime = addMinutesToTime(depTime, duration);

        const leg: TransitLeg = {
          lineKey: key.replace(/_inner|_outer/, ''),
          lineName: lineDef.name,
          lineSymbol: lineDef.symbol,
          lineColor: lineDef.color,
          trainType: liveInfo?.train?.displayType || (duration > 20 ? '快速' : '普通'),
          trainDest: liveInfo?.train?.dest?.text || to,
          trainNo: liveInfo?.train?.no,
          departureStation: from,
          departureTime: depTime,
          arrivalStation: to,
          arrivalTime: arrTime,
          durationMinutes: duration,
          stopsCount: stops.length - 1,
          stopStations: stops,
          trackPlatform: from === '大阪' ? '1・2番のりば' : from === '天王寺' ? '11・14番のりば' : '1番のりば',
          liveTrain: liveInfo?.train,
          delayMinutes: liveInfo?.train?.delayMinutes || 0,
          isRealtimeLinked: Boolean(liveInfo?.train),
        };

        routes.push({
          id: `direct-${key}-${depTime}`,
          departureTime: depTime,
          arrivalTime: arrTime,
          totalDurationMinutes: duration,
          transferCount: 0,
          fare: calculateFare(duration),
          tags: ['直通', duration <= 20 ? '早' : '楽'],
          legs: [leg],
          isRealtimeLinked: Boolean(liveInfo?.train),
          liveDelayMinutes: liveInfo?.train?.delayMinutes || 0,
        });
      }
    }
  }

  return routes;
}

// Major interchange transfer hubs
const TRANSFER_HUBS = ['大阪', '天王寺', '京橋', '西九条', '新大阪', '尼崎', '新今宮', '鶴橋', '今宮'];

// Search 1-transfer routes
function findTransferRoutes(
  from: string,
  to: string,
  baseTime: string,
  liveTrains: Train[],
  stationsMap: Map<string, string>
): TransitRoute[] {
  const routes: TransitRoute[] = [];

  for (const hub of TRANSFER_HUBS) {
    if (hub === from || hub === to) continue;

    const leg1Options = findDirectRoute(from, hub, baseTime, liveTrains, stationsMap);
    if (leg1Options.length === 0) continue;

    const bestLeg1 = leg1Options.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes)[0];
    const leg1 = bestLeg1.legs[0];

    // Transfer wait time at hub (typically 3-5 mins)
    const leg2BaseTime = addMinutesToTime(leg1.arrivalTime, 4);
    const leg2Options = findDirectRoute(hub, to, leg2BaseTime, liveTrains, stationsMap);
    if (leg2Options.length === 0) continue;

    const bestLeg2 = leg2Options.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes)[0];
    const leg2 = bestLeg2.legs[0];

    const totalDuration = diffMinutes(leg1.departureTime, leg2.arrivalTime);

    routes.push({
      id: `transfer-${hub}-${leg1.departureTime}`,
      departureTime: leg1.departureTime,
      arrivalTime: leg2.arrivalTime,
      totalDurationMinutes: totalDuration,
      transferCount: 1,
      fare: calculateFare(totalDuration),
      tags: ['早'],
      legs: [leg1, leg2],
      isRealtimeLinked: Boolean(leg1.isRealtimeLinked || leg2.isRealtimeLinked),
      liveDelayMinutes: Math.max(leg1.delayMinutes || 0, leg2.delayMinutes || 0),
    });
  }

  return routes;
}

// Main route search function
export function searchTransitRoutes(
  options: TransitSearchOptions,
  liveTrains: Train[],
  stationsMap: Map<string, string>
): TransitRoute[] {
  const { fromStation, toStation, timeMode, time } = options;

  if (!fromStation || !toStation || fromStation === toStation) {
    return [];
  }

  let baseTime = time;
  if (timeMode === 'now') {
    const now = new Date();
    baseTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  const direct = findDirectRoute(fromStation, toStation, baseTime, liveTrains, stationsMap);
  const transfer = findTransferRoutes(fromStation, toStation, baseTime, liveTrains, stationsMap);

  let all = [...direct, ...transfer];

  // If timeMode is 'arrival', adjust departure calculation
  if (timeMode === 'arrival') {
    all = all.map((r) => {
      const targetArrival = time;
      const calculatedDeparture = addMinutesToTime(targetArrival, -r.totalDurationMinutes);
      const shiftMins = diffMinutes(r.departureTime, calculatedDeparture);

      const shiftedLegs = r.legs.map((leg) => ({
        ...leg,
        departureTime: addMinutesToTime(leg.departureTime, shiftMins),
        arrivalTime: addMinutesToTime(leg.arrivalTime, shiftMins),
      }));

      return {
        ...r,
        departureTime: calculatedDeparture,
        arrivalTime: targetArrival,
        legs: shiftedLegs,
      };
    });
  }

  // Deduplicate and sort
  const seen = new Set<string>();
  const uniqueRoutes: TransitRoute[] = [];

  for (const route of all) {
    const key = `${route.departureTime}-${route.arrivalTime}-${route.transferCount}-${route.legs[0]?.lineName}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRoutes.push(route);
    }
  }

  // Sort by priority
  uniqueRoutes.sort((a, b) => {
    if (options.priority === 'transfer') {
      if (a.transferCount !== b.transferCount) return a.transferCount - b.transferCount;
      return a.totalDurationMinutes - b.totalDurationMinutes;
    }
    // Default fastest
    if (a.totalDurationMinutes !== b.totalDurationMinutes) {
      return a.totalDurationMinutes - b.totalDurationMinutes;
    }
    return a.transferCount - b.transferCount;
  });

  // Assign tags: First is '早', lowest transfer is '楽', etc.
  if (uniqueRoutes.length > 0) {
    const fastest = uniqueRoutes[0];
    if (!fastest.tags.includes('早')) fastest.tags.unshift('早');

    const lowestTransfer = [...uniqueRoutes].sort((a, b) => a.transferCount - b.transferCount)[0];
    if (lowestTransfer && !lowestTransfer.tags.includes('楽')) {
      lowestTransfer.tags.push('楽');
    }
  }

  // Also synthesize next departure candidates (e.g. 8 mins later, 16 mins later) if few results
  if (uniqueRoutes.length > 0 && uniqueRoutes.length < 3) {
    const template = uniqueRoutes[0];
    [8, 16].forEach((offsetMins, i) => {
      const nextDep = addMinutesToTime(template.departureTime, offsetMins);
      const nextArr = addMinutesToTime(template.arrivalTime, offsetMins);
      const nextLegs = template.legs.map((l) => ({
        ...l,
        departureTime: addMinutesToTime(l.departureTime, offsetMins),
        arrivalTime: addMinutesToTime(l.arrivalTime, offsetMins),
        isRealtimeLinked: false,
      }));

      uniqueRoutes.push({
        id: `candidate-${i + 1}-${nextDep}`,
        departureTime: nextDep,
        arrivalTime: nextArr,
        totalDurationMinutes: template.totalDurationMinutes,
        transferCount: template.transferCount,
        fare: template.fare,
        tags: [],
        legs: nextLegs,
        isRealtimeLinked: false,
        liveDelayMinutes: 0,
      });
    });
  }

  return uniqueRoutes.slice(0, 5);
}
