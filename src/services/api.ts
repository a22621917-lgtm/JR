import {
  Train,
  Station,
  TrafficInfo,
  TrainMonitorData,
  MasterData,
  MaintenanceInfo,
} from '../types';

export const FALLBACK_OSAKALOOP_STATIONS: Station[] = [
  { info: { name: '大阪', code: '0416', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: 'JR京都線', type: 0, code: 'kyoto', link: 'kyoto', linkCode: '0416' }, { name: 'JR神戸線', type: 0, code: 'kobe', link: 'kobesanyo', linkCode: '0416' }] } },
  { info: { name: '福島', code: '2501', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '野田', code: '2502', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '西九条', code: '2503', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: 'JRゆめ咲線', type: 0, code: 'yumesaki', link: 'yumesaki', linkCode: '2503' }] } },
  { info: { name: '弁天町', code: '2504', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '中央線', type: 3, code: 'chuo', link: null, linkCode: null }] } },
  { info: { name: '大正', code: '2506', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '長堀鶴見緑地線', type: 3, code: 'nagahori', link: null, linkCode: null }] } },
  { info: { name: '芦原橋', code: '2507', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '今宮', code: '2508', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '大和路線', type: 0, code: 'yamatoji', link: 'yamatoji', linkCode: '2508' }] } },
  { info: { name: '新今宮', code: '2509', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '南海電鉄', type: 2, code: 'nankai', link: null, linkCode: null }] } },
  { info: { name: '天王寺', code: '2510', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '阪和線', type: 0, code: 'hanwa', link: 'hanwahagoromo', linkCode: '2510' }, { name: '大和路線', type: 0, code: 'yamatoji', link: 'yamatoji', linkCode: '2510' }] } },
  { info: { name: '寺田町', code: '2511', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '桃谷', code: '2512', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '鶴橋', code: '2513', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '近鉄電車', type: 2, code: 'kintetsu', link: null, linkCode: null }, { name: '千日前線', type: 3, code: 'sennichimae', link: null, linkCode: null }] } },
  { info: { name: '玉造', code: '2514', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '長堀鶴見緑地線', type: 3, code: 'nagahori', link: null, linkCode: null }] } },
  { info: { name: '森ノ宮', code: '2515', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '中央線', type: 3, code: 'chuo', link: null, linkCode: null }] } },
  { info: { name: '大阪城公園', code: '2516', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '京橋', code: '2517', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: 'JR東西線', type: 0, code: 'tozai', link: 'tozai', linkCode: '2517' }, { name: '学研都市線', type: 0, code: 'gakkentoshi', link: 'gakkentoshi', linkCode: '2517' }, { name: '京阪電車', type: 2, code: 'keihan', link: null, linkCode: null }] } },
  { info: { name: '桜ノ宮', code: '2518', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [] } },
  { info: { name: '天満', code: '2519', stopTrains: [2, 3, 4, 5], typeNotice: null, transfer: [{ name: '堺筋線', type: 3, code: 'sakaisuji', link: null, linkCode: null }] } },
];

export async function fetchMasterData(): Promise<MasterData | null> {
  try {
    const res = await fetch('/api/master');
    if (!res.ok) throw new Error('Master fetch failed');
    return await res.json();
  } catch (err) {
    console.warn('Using default master lines:', err);
    return null;
  }
}

export async function fetchStations(lineKey: string): Promise<Station[]> {
  try {
    const res = await fetch(`/api/lines/${lineKey}/stations`);
    if (!res.ok) throw new Error('Stations fetch failed');
    const data = await res.json();
    if (data.stations && Array.isArray(data.stations)) {
      return data.stations;
    }
    return FALLBACK_OSAKALOOP_STATIONS;
  } catch (err) {
    console.warn(`Stations fetch failed for ${lineKey}:`, err);
    return lineKey === 'osakaloop' ? FALLBACK_OSAKALOOP_STATIONS : [];
  }
}

export async function fetchTrains(lineKey: string): Promise<{
  update: string;
  trains: Train[];
}> {
  try {
    const res = await fetch(`/api/lines/${lineKey}/trains`);
    if (!res.ok) throw new Error('Trains fetch failed');
    const data = await res.json();
    return {
      update: data.update || new Date().toISOString(),
      trains: Array.isArray(data.trains) ? data.trains : [],
    };
  } catch (err) {
    console.warn(`Trains fetch failed for ${lineKey}:`, err);
    return {
      update: new Date().toISOString(),
      trains: [],
    };
  }
}

export async function fetchTrafficInfo(): Promise<TrafficInfo | null> {
  try {
    const res = await fetch('/api/trafficinfo');
    if (!res.ok) throw new Error('Traffic info fetch failed');
    return await res.json();
  } catch (err) {
    console.warn('Traffic info fetch failed:', err);
    return null;
  }
}

export async function fetchTrainMonitor(): Promise<TrainMonitorData | null> {
  try {
    const res = await fetch('/api/trainmonitor');
    if (!res.ok) throw new Error('Train monitor fetch failed');
    return await res.json();
  } catch (err) {
    console.warn('Train monitor fetch failed:', err);
    return null;
  }
}

export async function fetchCurrentTime(): Promise<string> {
  try {
    const res = await fetch('/api/currenttime');
    if (!res.ok) return new Date().toISOString();
    return await res.text();
  } catch {
    return new Date().toISOString();
  }
}

export async function fetchMaintenanceInfo(lineKey: string): Promise<MaintenanceInfo | null> {
  try {
    const res = await fetch(`/api/lines/${lineKey}/maintenance`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
