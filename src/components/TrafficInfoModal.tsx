import React from 'react';
import { TrafficInfo, MasterData } from '../types';
import { X, AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import { KNOWN_LINES } from '../constants/lines';

interface TrafficInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trafficInfo: TrafficInfo | null;
  masterData: MasterData | null;
  onSelectLine: (lineKey: string) => void;
}

export const TrafficInfoModal: React.FC<TrafficInfoModalProps> = ({
  isOpen,
  onClose,
  trafficInfo,
  masterData,
  onSelectLine,
}) => {
  if (!isOpen) return null;

  const linesWithIssues = trafficInfo?.lines
    ? Object.entries(trafficInfo.lines).filter(([_, info]) => info && info.status)
    : [];

  const expressWithIssues = trafficInfo?.express
    ? Object.entries(trafficInfo.express).filter(([_, info]) => info && info.status)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-lg font-bold text-white">
                JR西日本 近畿エリア運行情報
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                公式運行情報API (area_kinki_trafficinfo.json)
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
          {/* Summary Banner */}
          <div className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium bg-slate-950/70 border-slate-800">
            <span>近畿エリア運行状況サマリー</span>
            {linesWithIssues.length > 0 || expressWithIssues.length > 0 ? (
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {linesWithIssues.length + expressWithIssues.length} 件の運行情報あり
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                全路線 おおむね平常通り運行中
              </span>
            )}
          </div>

          {/* Active Disrupted Lines */}
          {linesWithIssues.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider">
                在来線 運行障害・遅延路線 ({linesWithIssues.length}路線)
              </h3>

              <div className="space-y-2">
                {linesWithIssues.map(([lineKey, info]) => {
                  const masterLine = masterData?.lines?.[lineKey];
                  const knownLine = KNOWN_LINES[lineKey];
                  const lineName = knownLine?.name || masterLine?.name || lineKey;

                  return (
                    <div
                      key={lineKey}
                      className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs text-white"
                            style={{
                              backgroundColor: knownLine?.color || '#0072BC',
                            }}
                          >
                            {knownLine?.symbol || 'JR'}
                          </span>
                          <span className="font-bold text-white text-base">
                            {lineName}
                          </span>
                        </div>

                        <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-md shadow-sm">
                          {info.status}
                        </span>
                      </div>

                      {/* Section & Cause */}
                      <div className="text-xs text-rose-200/90 space-y-0.5 pl-7">
                        {info.section?.from && info.section?.to && (
                          <div>
                            影響区間: <span className="font-semibold text-white">{info.section.from} 〜 {info.section.to}</span>
                          </div>
                        )}
                        <div>
                          原因: <span className="font-semibold text-white">{info.cause || '確認中'}</span>
                        </div>
                        {info.count > 0 && (
                          <div className="text-slate-300">
                            影響列車本数: 約 {info.count} 本
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-rose-900/60 flex items-center justify-between text-xs">
                        {masterData?.lines?.[lineKey] ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectLine(lineKey);
                              onClose();
                            }}
                            className="text-sky-300 hover:text-sky-100 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <span>この路線のモニターを開く</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {masterLine?.range || ''}
                          </span>
                        )}

                        {info.url && (
                          <a
                            href={info.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-rose-300 hover:text-white flex items-center gap-1"
                          >
                            <span>JR公式運行情報</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Express train delays */}
          {expressWithIssues.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider">
                特急列車 運行情報 ({expressWithIssues.length}件)
              </h3>

              <div className="space-y-2">
                {expressWithIssues.map(([key, info]) => (
                  <div
                    key={key}
                    className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-200 text-sm">
                        特急 {info.name}
                      </span>
                      <span className="bg-amber-600 text-slate-950 font-bold text-xs px-2 py-0.5 rounded">
                        {info.status}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300/80">
                      原因: {info.cause || '運行確認中'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* When everything is normal */}
          {linesWithIssues.length === 0 && expressWithIssues.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-bold text-white text-base">
                現在、近畿エリアの各線は平常通り運転しています
              </p>
              <p className="text-xs text-slate-400">
                事故・天候・車両点検等による遅延が発生した際は、ここに最新情報がリアルタイムで反映されます。
              </p>
            </div>
          )}
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
