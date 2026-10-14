import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Train,
  Station,
  TrafficInfo,
  TrainMonitorData,
  MasterData,
  MaintenanceInfo,
} from './types';
import {
  fetchMasterData,
  fetchStations,
  fetchTrains,
  fetchTrafficInfo,
  fetchTrainMonitor,
  fetchCurrentTime,
  fetchMaintenanceInfo,
  FALLBACK_OSAKALOOP_STATIONS,
} from './services/api';
import { buildStationMap } from './utils/trainParser';
import { KNOWN_LINES } from './constants/lines';
import { playChime } from './utils/audio';

import { Header } from './components/Header';
import { TrafficAlertBanner } from './components/TrafficAlertBanner';
import { OsakaLoopMap } from './components/OsakaLoopMap';
import { LinearTrackMap } from './components/LinearTrackMap';
import { TrainList } from './components/TrainList';
import { TransitPlanner } from './components/TransitPlanner';
import { TrainDetailModal } from './components/TrainDetailModal';
import { StationDetailModal } from './components/StationDetailModal';
import { TrafficInfoModal } from './components/TrafficInfoModal';
import { Info, HelpCircle } from 'lucide-react';

export default function App() {
  // Line & Network Data State
  const [currentLineKey, setCurrentLineKey] = useState<string>('osakaloop');
  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [stations, setStations] = useState<Station[]>(FALLBACK_OSAKALOOP_STATIONS);
  const [trains, setTrains] = useState<Train[]>([]);
  const [trafficInfo, setTrafficInfo] = useState<TrafficInfo | null>(null);
  const [trainMonitor, setTrainMonitor] = useState<TrainMonitorData | null>(null);
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo | null>(null);

  // Time & Refresh State
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(10); // 10s default
  const [countdown, setCountdown] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // View & Filter State
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'transit'>('map');
  const [loopViewType, setLoopViewType] = useState<'circular' | 'linear'>('circular');
  const [filterDirection, setFilterDirection] = useState<number | 'all'>('all');
  const [filterDelayedOnly, setFilterDelayedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [transitFromStation, setTransitFromStation] = useState<string>('大阪');
  const [transitToStation, setTransitToStation] = useState<string>('天王寺');

  // Modals & Selection
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Stations map
  const stationsMap = useMemo(() => {
    return buildStationMap(stations);
  }, [stations]);

  // Available lines list
  const availableLines = useMemo(() => {
    if (masterData?.lines) {
      return Object.entries(masterData.lines).map(([k, v]) => ({
        key: k,
        name: v.name,
      }));
    }
    // Fallback known lines
    return Object.entries(KNOWN_LINES).map(([k, v]) => ({
      key: k,
      name: v.name,
    }));
  }, [masterData]);

  // Load master line list on mount
  useEffect(() => {
    fetchMasterData().then((data) => {
      if (data) setMasterData(data);
    });
  }, []);

  // Fetch line stations when line changes
  useEffect(() => {
    let cancelled = false;
    fetchStations(currentLineKey).then((data) => {
      if (!cancelled && data.length > 0) {
        setStations(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [currentLineKey]);

  // Core refresh function for active dynamic data
  const refreshData = useCallback(async (isManual: boolean = false) => {
    setIsRefreshing(true);
    try {
      const [trainsResult, trafficResult, monitorResult, timeResult, maintResult] =
        await Promise.allSettled([
          fetchTrains(currentLineKey),
          fetchTrafficInfo(),
          fetchTrainMonitor(),
          fetchCurrentTime(),
          fetchMaintenanceInfo(currentLineKey),
        ]);

      if (trainsResult.status === 'fulfilled') {
        setTrains(trainsResult.value.trains);
      }
      if (trafficResult.status === 'fulfilled' && trafficResult.value) {
        setTrafficInfo(trafficResult.value);
      }
      if (monitorResult.status === 'fulfilled' && monitorResult.value) {
        setTrainMonitor(monitorResult.value);
      }
      if (maintResult.status === 'fulfilled') {
        setMaintenanceInfo(maintResult.value);
      }

      // Format server time
      let timeDate = new Date();
      if (timeResult.status === 'fulfilled' && timeResult.value) {
        const parsed = new Date(timeResult.value.trim());
        if (!isNaN(parsed.getTime())) timeDate = parsed;
      }
      setCurrentTimeStr(
        timeDate.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );

      if (isManual && soundEnabled) {
        playChime('refresh');
      }
    } finally {
      setIsRefreshing(false);
      setCountdown(autoRefreshInterval);
    }
  }, [currentLineKey, autoRefreshInterval, soundEnabled]);

  // Initial fetch on line change
  useEffect(() => {
    refreshData(false);
    setSelectedTrain(null);
    setSelectedStation(null);
  }, [currentLineKey]);

  // Auto-refresh timer loop
  const autoRefreshIntervalRef = useRef(autoRefreshInterval);
  autoRefreshIntervalRef.current = autoRefreshInterval;

  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    setCountdown(autoRefreshInterval);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshData(false);
          return autoRefreshIntervalRef.current;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshInterval, refreshData]);

  // Real-time clock ticker for seconds
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Train click handler
  const handleSelectTrain = useCallback((train: Train) => {
    setSelectedTrain(train);
    if (soundEnabled) playChime('select');
  }, [soundEnabled]);

  // Station click handler
  const handleSelectStation = useCallback((station: Station) => {
    setSelectedStation(station);
    if (soundEnabled) playChime('select');
  }, [soundEnabled]);

  // Line stats
  const activeTrainsCount = trains.length;
  const delayedTrainsCount = trains.filter(
    (t) => t.delayMinutes && t.delayMinutes > 0
  ).length;
  const hasTrafficAlert = Boolean(trafficInfo?.lines?.[currentLineKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentLineKey={currentLineKey}
        onSelectLine={setCurrentLineKey}
        availableLines={availableLines}
        currentTimeStr={currentTimeStr}
        autoRefreshInterval={autoRefreshInterval}
        onSetAutoRefreshInterval={setAutoRefreshInterval}
        countdown={countdown}
        onManualRefresh={() => refreshData(true)}
        isRefreshing={isRefreshing}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        activeTrainsCount={activeTrainsCount}
        delayedTrainsCount={delayedTrainsCount}
        hasTrafficAlert={hasTrafficAlert}
        onOpenTrafficModal={() => setIsTrafficModalOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        loopViewType={loopViewType}
        onChangeLoopViewType={setLoopViewType}
      />

      {/* Traffic Disruption Banner */}
      <TrafficAlertBanner
        currentLineKey={currentLineKey}
        trafficInfo={trafficInfo}
        maintenanceInfo={maintenanceInfo}
        onOpenTrafficModal={() => setIsTrafficModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        {viewMode === 'map' ? (
          currentLineKey === 'osakaloop' && loopViewType === 'circular' ? (
            <OsakaLoopMap
              stations={stations}
              trains={trains}
              selectedTrain={selectedTrain}
              onSelectTrain={handleSelectTrain}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
              stationsMap={stationsMap}
              filterDirection={filterDirection}
              filterDelayedOnly={filterDelayedOnly}
              searchQuery={searchQuery}
            />
          ) : (
            <LinearTrackMap
              currentLineKey={currentLineKey}
              stations={stations}
              trains={trains}
              selectedTrain={selectedTrain}
              onSelectTrain={handleSelectTrain}
              selectedStation={selectedStation}
              onSelectStation={handleSelectStation}
              stationsMap={stationsMap}
              filterDirection={filterDirection}
              filterDelayedOnly={filterDelayedOnly}
              searchQuery={searchQuery}
            />
          )
        ) : viewMode === 'list' ? (
          <TrainList
            currentLineKey={currentLineKey}
            trains={trains}
            stationsMap={stationsMap}
            trainMonitor={trainMonitor}
            selectedTrain={selectedTrain}
            onSelectTrain={handleSelectTrain}
            filterDirection={filterDirection}
            onSetFilterDirection={setFilterDirection}
            filterDelayedOnly={filterDelayedOnly}
            onSetFilterDelayedOnly={setFilterDelayedOnly}
            searchQuery={searchQuery}
            onSetSearchQuery={setSearchQuery}
          />
        ) : (
          <TransitPlanner
            liveTrains={trains}
            stationsMap={stationsMap}
            trainMonitor={trainMonitor}
            onSelectTrain={handleSelectTrain}
            onNavigateToMap={() => setViewMode('map')}
            initialFromStation={transitFromStation}
            initialToStation={transitToStation}
          />
        )}

        {/* API Specification & Pos format guide footer bar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              <strong className="text-slate-200">列車位置(pos)の仕様:</strong>{' '}
              停車中は駅コードの後ろが <code className="text-sky-300 font-mono font-bold bg-slate-950 px-1 py-0.2 rounded border border-slate-800">_####</code> になります（例: 2509_#### は新今宮駅に停車中）。駅間走行中は <code className="text-amber-300 font-mono font-bold bg-slate-950 px-1 py-0.2 rounded border border-slate-800">2511_2512</code> のように区間コードで表されます。
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 cursor-pointer font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>API・仕様詳細</span>
          </button>
        </div>
      </main>

      {/* Train Detail Modal */}
      {selectedTrain && (
        <TrainDetailModal
          train={selectedTrain}
          onClose={() => setSelectedTrain(null)}
          stationsMap={stationsMap}
          trainMonitor={trainMonitor}
          currentLineKey={currentLineKey}
        />
      )}

      {/* Station Detail Modal */}
      {selectedStation && (
        <StationDetailModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          trains={trains}
          stationsMap={stationsMap}
          currentLineKey={currentLineKey}
          onSelectTrain={handleSelectTrain}
          onPlanTransit={(from, to) => {
            if (from) setTransitFromStation(from);
            if (to) setTransitToStation(to);
            setViewMode('transit');
          }}
        />
      )}

      {/* Traffic Info Modal */}
      <TrafficInfoModal
        isOpen={isTrafficModalOpen}
        onClose={() => setIsTrafficModalOpen(false)}
        trafficInfo={trafficInfo}
        masterData={masterData}
        onSelectLine={(key) => {
          setCurrentLineKey(key);
        }}
      />

      {/* Help & API Documentation Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">JR西日本 列車走行位置システム仕様</h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-300 leading-relaxed">
              <div>
                <strong className="text-white">1. 車両位置 (pos) 判定ルール</strong>
                <p className="mt-1 text-slate-400">
                  ・<strong>停車中:</strong> <code className="text-sky-300">pos</code> の末尾が <code className="text-sky-300">_####</code>（例: <code>2509_####</code>）。先頭が対象の駅コードです。<br />
                  ・<strong>走行中:</strong> <code className="text-amber-300">fromCode_toCode</code>（例: <code>2511_2512</code>）。現在走行している前後の駅コードを表します。
                </p>
              </div>

              <div>
                <strong className="text-white">2. 走行方向 (direction)</strong>
                <p className="mt-1 text-slate-400">
                  ・大阪環状線: <code className="text-sky-300">0 = 内回り</code> (反時計回り), <code className="text-orange-300">1 = 外回り</code> (時計回り)<br />
                  ・一般幹線: <code className="text-sky-300">0 = 上り</code> (京都・大阪方面等), <code className="text-orange-300">1 = 下り</code> (方面行)
                </p>
              </div>

              <div>
                <strong className="text-white">3. 連携APIエンドポイント</strong>
                <ul className="mt-1 space-y-1 font-mono text-[11px] text-slate-400">
                  <li>• 路線一覧: <span className="text-sky-300">area_kinki_master.json</span></li>
                  <li>• 車両位置: <span className="text-sky-300">osakaloop.json / {`{line}`}.json</span></li>
                  <li>• 駅マスター: <span className="text-sky-300">osakaloop_st.json</span></li>
                  <li>• 車両詳細 (混雑・温度): <span className="text-sky-300">trainmonitorinfo.json</span></li>
                  <li>• 運行情報 (遅延): <span className="text-sky-300">area_kinki_trafficinfo.json</span></li>
                  <li>• サーバー時刻: <span className="text-sky-300">currenttime.txt</span></li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium cursor-pointer"
              >
                理解しました
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
