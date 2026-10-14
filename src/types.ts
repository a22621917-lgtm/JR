export interface TrainDest {
  text: string;
  code: string;
  line: string;
}

export interface Train {
  no: string;
  pos: string;
  direction: number; // 0: 内回り/上り, 1: 外回り/下り
  nickname: string;
  type: string;
  displayType: string;
  dest: TrainDest;
  via: string;
  delayMinutes: number;
  typeChange?: string;
  numberOfCars: number;
  stopTime?: string;
  iconId?: string;
  aSeatInfo?: string;
}

export interface TransferLine {
  name: string;
  type: number;
  code: string;
  link: string | null;
  linkCode: string | null;
}

export interface StationInfo {
  name: string;
  code: string;
  stopTrains?: number[];
  typeNotice?: string | null;
  transfer?: TransferLine[];
  line?: string | null;
  pairDisplay?: string | null;
  lines?: string[] | null;
}

export interface Station {
  info: StationInfo;
  design?: unknown;
}

export interface CarInfo {
  carNo: number;
  status: number;
  congestion: number; // percentage (e.g. 150)
  temp: number;       // temperature in °C (e.g. 24)
  facilities: number[]; // 1: priority seats, 2: wheelchair/stroller space, etc.
  types: number[];      // 3: mild AC (弱冷車), 4: women-only (女性専用車), etc.
}

export interface TrainMonitorEntry {
  cars: CarInfo[];
}

export interface TrainMonitorData {
  update: string;
  trains: Record<string, TrainMonitorEntry[]>;
}

export interface TrafficLineDetail {
  count: number;
  section?: {
    from: string;
    to: string;
  };
  status: string; // e.g. "遅延", "一部列車遅延", "運転見合わせ"
  mark: number;
  cause: string;  // e.g. "動物と接触", "車両確認"
  transfer: boolean;
  url: string;
}

export interface TrafficExpressDetail {
  count: number;
  unique: number;
  name: string;
  status: string;
  mark: number;
  cause: string;
  url: string;
}

export interface TrafficInfo {
  lines: Record<string, TrafficLineDetail>;
  express?: Record<string, TrafficExpressDetail>;
}

export interface MasterLineItem {
  name: string;
  range: string;
  st: string;
  pos: string;
  index: number;
  dest: {
    upper: string;
    lower: string;
  };
}

export interface MasterData {
  lines: Record<string, MasterLineItem>;
}

export interface MaintenanceInfo {
  status: number;
  notification: {
    groupId: number;
    text: string;
    duration: string;
  } | null;
  maintenance: {
    title: string;
    text: string;
    duration: string;
    linkTitle: string;
    linkUrl: string;
  } | null;
}

export interface ParsedTrainPosition {
  isStopped: boolean;
  stationCode: string | null;
  fromStationCode: string | null;
  toStationCode: string | null;
  stationName: string | null;
  fromStationName: string | null;
  toStationName: string | null;
  statusLabel: string;
}

export interface TransitLeg {
  lineKey: string;
  lineName: string;
  lineSymbol: string;
  lineColor: string;
  trainType: string;
  trainDest: string;
  trainNo?: string;
  departureStation: string;
  departureTime: string; // HH:mm
  arrivalStation: string;
  arrivalTime: string;   // HH:mm
  durationMinutes: number;
  stopsCount: number;
  stopStations: string[];
  trackPlatform?: string;
  liveTrain?: Train;
  delayMinutes?: number;
  isRealtimeLinked?: boolean;
}

export interface TransitRoute {
  id: string;
  departureTime: string; // HH:mm
  arrivalTime: string;   // HH:mm
  totalDurationMinutes: number;
  transferCount: number;
  fare: number; // in yen
  tags: ('早' | '楽' | '安' | '直通')[];
  legs: TransitLeg[];
  isRealtimeLinked: boolean;
  liveDelayMinutes: number;
}

export interface TransitSearchOptions {
  fromStation: string;
  toStation: string;
  timeMode: 'now' | 'departure' | 'arrival';
  time: string; // HH:mm
  priority: 'time' | 'transfer';
}
