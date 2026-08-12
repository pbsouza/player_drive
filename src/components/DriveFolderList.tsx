import React from "react";
import { DriveFile, DriveFolder, WatchHistoryItem } from "../types";
import { formatDuration, formatFileSize } from "../services/drive";
import { Folder, Film, Play, Clock, ArrowLeft } from "lucide-react";

interface DriveFolderListProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onOpenFolder: (folder: DriveFolder) => void;
  onSelectVideo: (file: DriveFile) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
  watchHistoryMap: Record<string, WatchHistoryItem>;
  searchQuery: string;
}

export const DriveFolderList: React.FC<DriveFolderListProps> = ({
  folders,
  files,
  onOpenFolder,
  onSelectVideo,
  onGoBack,
  canGoBack,
  isLoading,
  watchHistoryMap,
  searchQuery,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-[#888]">
        <div className="w-10 h-10 border-2 border-[#333] border-t-white rounded-full animate-spin"></div>
        <p className="text-xs uppercase tracking-[0.3em] font-semibold animate-pulse text-[#aaa]">
          Carregando diretório do Google Drive...
        </p>
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  // Find most recent watch item if present in current files
  const featuredFile = files.find((f) => watchHistoryMap[f.id]) || files[0];
  const featuredHistory = featuredFile ? watchHistoryMap[featuredFile.id] : null;

  return (
    <div className="space-y-10 pb-16">
      {/* Back button option when inside subfolders */}
      {canGoBack && !searchQuery && (
        <div className="flex items-center gap-2">
          <button
            onClick={onGoBack}
            className="flex items-center gap-2.5 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] text-white rounded-xl text-xs uppercase tracking-wider font-semibold border border-[#222] hover:border-[#444] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 text-[#aaa]" />
            <span>Voltar para diretório anterior</span>
          </button>
        </div>
      )}

      {/* Featured / Continue Watching Hero Spotlight (if videos exist) */}
      {!isEmpty && featuredFile && !searchQuery && (
        <section className="relative min-h-[260px] md:min-h-[300px] rounded-2xl overflow-hidden bg-[#0c0c0c] border border-[#1a1a1a] shadow-2xl p-6 md:p-8 flex flex-col justify-end group">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent z-10" />

          {featuredFile.thumbnailLink ? (
            <img
              src={featuredFile.thumbnailLink}
              alt={featuredFile.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-[#111] opacity-40 flex items-center justify-center">
              <Film className="w-24 h-24 text-[#222]" />
            </div>
          )}

          <div className="relative z-20 max-w-2xl">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-2.5 py-1 bg-white text-black text-[9px] font-bold uppercase tracking-widest rounded-sm">
                {featuredHistory ? "Continuar Assistindo" : "Vídeo em Destaque"}
              </span>
              {featuredHistory && featuredHistory.duration > 0 && (
                <span className="text-xs text-[#aaa] font-medium font-mono">
                  {formatDuration((featuredHistory.timestamp * 1000).toString())} /{" "}
                  {formatDuration((featuredHistory.duration * 1000).toString())}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-4xl font-serif font-light text-white leading-tight mb-2 line-clamp-2">
              {featuredFile.name}
            </h2>
            <p className="text-[#888] text-xs uppercase tracking-wider mb-6">
              {formatFileSize(featuredFile.size) || "Arquivo de vídeo HD"}
            </p>

            <button
              onClick={() => onSelectVideo(featuredFile)}
              className="flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-[#e0e0e0] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xl focus:ring-4 focus:ring-white/40 outline-none"
            >
              <Play className="w-4 h-4 fill-black stroke-none" />
              <span>Reproduzir Agora</span>
            </button>
          </div>
        </section>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] text-center">
          <div className="w-16 h-16 rounded-full bg-[#111] border border-[#222] text-[#666] flex items-center justify-center mb-4">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-serif italic text-white mb-2">
            {searchQuery ? "Nenhum resultado encontrado" : "Diretório Vazio"}
          </h3>
          <p className="text-[#666] max-w-md text-xs tracking-wider uppercase">
            {searchQuery
              ? `Não encontramos arquivos para "${searchQuery}".`
              : "Nenhum arquivo de vídeo ou pasta encontrado neste diretório."}
          </p>
          {canGoBack && (
            <button
              onClick={onGoBack}
              className="mt-6 px-6 py-2.5 bg-white text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#e0e0e0] transition-all cursor-pointer"
            >
              Voltar
            </button>
          )}
        </div>
      )}

      {/* Folders Section */}
      {folders.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-[#666] font-bold">
              Pastas ({folders.length})
            </h3>
            <div className="h-[1px] flex-1 bg-[#1a1a1a] mx-6"></div>
            <span className="text-xs text-[#aaa] font-serif italic">Navegar pastas</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onOpenFolder(folder)}
                className="group relative flex flex-col items-start p-4 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] hover:border-[#444] focus:border-white/60 rounded-xl transition-all duration-200 focus:ring-2 focus:ring-white/40 focus:scale-[1.02] outline-none text-left cursor-pointer shadow-lg"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#aaa] group-hover:text-white flex items-center justify-center mb-3 transition-colors">
                  <Folder className="w-4 h-4" />
                </div>
                <span className="font-medium text-white group-hover:text-white text-xs line-clamp-2 w-full leading-snug">
                  {folder.name}
                </span>
                <span className="text-[9px] text-[#555] uppercase tracking-widest mt-1">Pasta</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Videos Section */}
      {files.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] uppercase tracking-[0.4em] text-[#666] font-bold">
              Arquivos de Vídeo ({files.length})
            </h3>
            <div className="h-[1px] flex-1 bg-[#1a1a1a] mx-6"></div>
            <span className="text-xs text-[#aaa] font-serif italic">Grade de reprodução</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {files.map((file) => {
              const duration = formatDuration(file.videoMediaMetadata?.durationMillis);
              const fileSize = formatFileSize(file.size);
              const history = watchHistoryMap[file.id];
              const progressPct =
                history && history.duration > 0
                  ? Math.min(100, Math.floor((history.timestamp / history.duration) * 100))
                  : 0;

              return (
                <button
                  key={file.id}
                  onClick={() => onSelectVideo(file)}
                  className="group relative flex flex-col bg-[#111] border border-[#222] hover:border-[#444] focus:border-white/60 rounded-xl overflow-hidden transition-all duration-200 focus:ring-2 focus:ring-white/40 focus:scale-[1.02] outline-none text-left cursor-pointer shadow-xl"
                >
                  {/* Thumbnail / Poster Area */}
                  <div className="relative aspect-video w-full bg-[#080808] overflow-hidden flex items-center justify-center">
                    {file.thumbnailLink ? (
                      <img
                        src={file.thumbnailLink}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#111] flex items-center justify-center">
                        <Film className="w-10 h-10 text-[#333] group-hover:text-[#666] transition-colors" />
                      </div>
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-10 h-10 rounded-full border border-white/30 bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-white text-white pl-0.5" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    {duration && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[#ddd] text-[10px] font-mono border border-[#333]">
                        {duration}
                      </div>
                    )}

                    {/* Progress bar */}
                    {progressPct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222]">
                        <div
                          className="h-full bg-white transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 bg-[#111]">
                    <h4
                      className="font-medium text-white group-hover:text-white text-xs line-clamp-2 leading-snug mb-2"
                      title={file.name}
                    >
                      {file.name}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-[#555] uppercase tracking-wider font-semibold">
                      <span>{fileSize || "VÍDEO"}</span>
                      {progressPct > 0 && (
                        <span className="text-[#00ff88]">
                          {progressPct === 100 ? "Concluído" : `${progressPct}%`}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
