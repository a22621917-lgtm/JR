import React from 'react';
import { AlertCircle, AlertTriangle, ExternalLink, Info, Wrench } from 'lucide-react';
import { TrafficInfo, MaintenanceInfo } from '../types';

interface TrafficAlertBannerProps {
  currentLineKey: string;
  trafficInfo: TrafficInfo | null;
  maintenanceInfo: MaintenanceInfo | null;
  onOpenTrafficModal: () => void;
}

export const TrafficAlertBanner: React.FC<TrafficAlertBannerProps> = ({
  currentLineKey,
  trafficInfo,
  maintenanceInfo,
  onOpenTrafficModal,
}) => {
  const lineTraffic = trafficInfo?.lines?.[currentLineKey];
  const hasMaintenance =
    maintenanceInfo &&
    (maintenanceInfo.status !== 0 ||
      Boolean(maintenanceInfo.notification?.text) ||
      Boolean(maintenanceInfo.maintenance?.title));

  const otherDelayedLinesCount = trafficInfo?.lines
    ? Object.entries(trafficInfo.lines).filter(
        ([k, v]) => k !== currentLineKey && (v.status.includes('遅延') || v.status.includes('見合わせ'))
      ).length
    : 0;

  if (!lineTraffic && !hasMaintenance && otherDelayedLinesCount === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 space-y-2">
      {/* Maintenance alert */}
      {hasMaintenance && (
        <div className="bg-amber-950/70 border border-amber-600/60 rounded-xl p-3 flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
          <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold flex items-center gap-2">
              <span>システムメンテナンス・お知らせ</span>
              {maintenanceInfo.notification?.duration && (
                <span className="text-[11px] text-amber-300 font-mono-num font-normal">
                  ({maintenanceInfo.notification.duration})
                </span>
              )}
            </div>
            <p className="text-amber-300/90 text-xs mt-0.5">
              {maintenanceInfo.notification?.text ||
                maintenanceInfo.maintenance?.text ||
                maintenanceInfo.maintenance?.title ||
                '現在、一部の案内でメンテナンスが実施されている可能性があります。'}
            </p>
          </div>
        </div>
      )}

      {/* Current line delay / disruption alert */}
      {lineTraffic && (
        <div className="bg-rose-950/80 border border-rose-600/70 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-rose-100 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                <span className="bg-rose-600 text-white text-xs px-2 py-0.5 rounded font-semibold">
                  {lineTraffic.status}
                </span>
                <span>
                  {lineTraffic.section?.from && lineTraffic.section?.to
                    ? `${lineTraffic.section.from}〜${lineTraffic.section.to} 間`
                    : '本路線'}
                </span>
              </div>
              <div className="text-rose-200/90 text-xs sm:text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>原因: {lineTraffic.cause || '運行確認中'}</span>
                {lineTraffic.count > 0 && <span>影響列車: 約{lineTraffic.count}本</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenTrafficModal}
              className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/60 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>運行情報詳細</span>
            </button>
            {lineTraffic.url && (
              <a
                href={lineTraffic.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-rose-300 hover:text-white p-1.5 transition-colors"
                title="JR西日本 列車運行情報（公式）"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Network alert snippet if other lines have delays */}
      {!lineTraffic && otherDelayedLinesCount > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              近畿エリアの他路線（{otherDelayedLinesCount}路線）に列車の遅れ・運転見合わせ等が発生しています。
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenTrafficModal}
            className="text-sky-400 hover:text-sky-300 underline font-medium cursor-pointer shrink-0 ml-2"
          >
            一覧を見る
          </button>
        </div>
      )}
    </div>
  );
};
