import React from "react";
import { WatchHistoryItem } from "../types";
import { formatDuration } from "../services/drive";
import { History, Play, Trash2, X, Film, Clock } from "lucide-react";

interface WatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: WatchHistoryItem[];
  onPlayFromHistory: (item: WatchHistoryItem) => void;
  onClearHistory: () => void;
}

export const WatchHistoryModal: React.FC<WatchHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onPlayFromHistory,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#222] w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-[#aaa]" />
            <h2 className="text-lg font-serif italic text-white">Histórico de Reprodução</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#111] hover:bg-[#1a1a1a] text-[#888] hover:text-white rounded-xl border border-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center text-[#666]">
              <Film className="w-12 h-12 mx-auto mb-3 text-[#333]" />
              <p className="text-xs uppercase tracking-widest font-semibold">Nenhum histórico registrado</p>
              <p className="text-[10px] text-[#555] mt-1 uppercase tracking-wider">
                Os vídeos assistidos aparecerão aqui para continuação rápida.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const progressPct =
                item.duration > 0
                  ? Math.min(100, Math.floor((item.timestamp / item.duration) * 100))
                  : 0;

              return (
                <div
                  key={item.fileId}
                  onClick={() => onPlayFromHistory(item)}
                  className="group flex items-center gap-4 p-3 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#444] rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-white/40 outline-none"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onPlayFromHistory(item);
                    }
                  }}
                >
                  {/* Thumbnail / Icon */}
                  <div className="relative w-24 aspect-video bg-[#080808] rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.thumbnailLink ? (
                      <img
                        src={item.thumbnailLink}
                        alt={item.fileName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-5 h-5 text-[#333]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <Play className="w-4 h-4 fill-white text-white group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-xs line-clamp-1 group-hover:text-white">
                      {item.fileName}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-[#888] font-mono mt-1">
                      <Clock className="w-3 h-3 text-[#888]" />
                      <span>
                        {formatDuration((item.timestamp * 1000).toString())} /{" "}
                        {formatDuration((item.duration * 1000).toString())}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[#222] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-[#222] flex justify-between items-center">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-red-400 hover:bg-red-950/40 rounded-xl transition-all focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar histórico</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0e0e0] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
