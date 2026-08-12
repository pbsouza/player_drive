import React, { useRef, useState, useEffect, useCallback } from "react";
import { DriveFile, WatchHistoryItem } from "../types";
import { formatDuration } from "../services/drive";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Settings,
  Tv,
  Check,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Film,
} from "lucide-react";

interface VideoPlayerProps {
  video: DriveFile;
  accessToken: string;
  playlist: DriveFile[];
  onClose: () => void;
  onSelectVideo: (video: DriveFile) => void;
  onUpdateWatchHistory: (item: WatchHistoryItem) => void;
  initialTimestamp?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  accessToken,
  playlist,
  onClose,
  onSelectVideo,
  onUpdateWatchHistory,
  initialTimestamp = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoNext, setAutoNext] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drive Transcoding Player is DEFAULT for maximum compatibility (converts AC3/DTS/EAC3 audio to AAC)
  const [useEmbedPlayer, setUseEmbedPlayer] = useState(true);

  // Reset player state whenever a new video is loaded
  useEffect(() => {
    setUseEmbedPlayer(true);
    setErrorMsg(null);
    setIsMuted(false);
    setVolume(1);
  }, [video]);

  const [resumePrompt, setResumePrompt] = useState<number | null>(
    initialTimestamp > 10 ? initialTimestamp : null
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Find index in playlist
  const currentIndex = playlist.findIndex((v) => v.id === video.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < playlist.length - 1;

  // Video proxy URL with mimeType hint
  const streamUrl = `/api/stream/${video.id}?token=${encodeURIComponent(
    accessToken
  )}&mimeType=${encodeURIComponent(video.mimeType || "video/mp4")}`;

  // Auto-hide controls overlay after 3.5 seconds of inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  }, []);

  useEffect(() => {
    handleMouseMove();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [handleMouseMove]);

  // Save watch progress to history periodically
  useEffect(() => {
    if (!isPlaying || !videoRef.current || useEmbedPlayer) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        onUpdateWatchHistory({
          fileId: video.id,
          fileName: video.name,
          timestamp: Math.floor(videoRef.current.currentTime),
          duration: Math.floor(videoRef.current.duration || 0),
          lastWatched: new Date().toISOString(),
          thumbnailLink: video.thumbnailLink,
          mimeType: video.mimeType,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, video, onUpdateWatchHistory, useEmbedPlayer]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (useEmbedPlayer) return;
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setErrorMsg(null);
        })
        .catch((err) => {
          console.error("Erro ao tocar vídeo:", err?.message || String(err));
          setErrorMsg(
            "O navegador ou a Smart TV não conseguiu iniciar a reprodução direta deste arquivo de vídeo."
          );
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  // Skip forward / backward
  const seekBy = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.min(
      Math.max(0, videoRef.current.currentTime + seconds),
      duration
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle speed change
  const changeSpeed = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSpeedMenu(false);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Erro no tela cheia:", err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Keyboard / TV Remote Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      handleMouseMove();

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
            setIsMuted(newVol === 0);
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
        case "M":
          e.preventDefault();
          if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
          }
          break;
        case "Escape":
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume, isMuted, duration, handleMouseMove, onClose, useEmbedPlayer]);

  // Handle Video Ended
  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);

    onUpdateWatchHistory({
      fileId: video.id,
      fileName: video.name,
      timestamp: Math.floor(duration),
      duration: Math.floor(duration),
      lastWatched: new Date().toISOString(),
      thumbnailLink: video.thumbnailLink,
      mimeType: video.mimeType,
    });

    if (autoNext && hasNext) {
      onSelectVideo(playlist[currentIndex + 1]);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Dual Engine: Drive Embed Player vs HTML5 Direct Stream */}
      {useEmbedPlayer ? (
        <div className="w-full h-full relative bg-black flex flex-col">
          <iframe
            src={`https://drive.google.com/file/d/${video.id}/preview`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            title={video.name}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={streamUrl}
          preload="auto"
          playsInline
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onSeeking={() => setIsBuffering(true)}
          onStalled={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
          onPlaying={() => {
            setIsBuffering(false);
            setIsPlaying(true);
          }}
          onSeeked={() => setIsBuffering(false)}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              if (!resumePrompt) {
                videoRef.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch((err) => {
                    console.error("Erro no auto-play:", err?.message || String(err));
                  });
              }
            }
          }}
          onEnded={handleEnded}
          onError={() => {
            const mediaErr = videoRef.current?.error;
            console.error(
              "Erro no elemento de vídeo HTML5:",
              mediaErr ? `${mediaErr.code}: ${mediaErr.message}` : "Erro de mídia"
            );
            setIsBuffering(false);

            fetch(streamUrl, { method: "HEAD" })
              .then((res) => {
                if (res.status === 401 || res.status === 403) {
                  setErrorMsg(
                    "Sua sessão com o Google Drive expirou. Por favor, volte e conecte-se novamente."
                  );
                } else {
                  setErrorMsg(
                    `O formato do vídeo (${video.name.split('.').pop()?.toUpperCase() || 'codec'}) não é suportado nativamente pelo navegador HTML5 da sua Smart TV. Alterne para o Player Transcodificado do Google Drive abaixo.`
                  );
                }
              })
              .catch(() => {
                setErrorMsg(
                  "Não foi possível conectar ao servidor de vídeo. Verifique sua conexão de rede."
                );
              });
          }}
        />
      )}

      {/* Buffering Indicator Overlay (HTML5 Mode) */}
      {!useEmbedPlayer && isBuffering && !errorMsg && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none z-20">
          <div className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <span className="text-white text-xs font-semibold uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/10">
            Carregando Vídeo...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 bg-[#080808]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
          <h3 className="text-2xl font-serif text-white mb-2">Formato Não Suportado no HTML5</h3>
          <p className="text-[#aaa] max-w-lg mb-8 text-xs leading-relaxed uppercase tracking-wider">{errorMsg}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setErrorMsg(null);
                setUseEmbedPlayer(true);
              }}
              className="px-6 py-3 bg-white text-black font-extrabold rounded-xl text-xs uppercase tracking-widest hover:bg-[#e0e0e0] focus:ring-4 focus:ring-white/40 outline-none transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Usar Transcodificação do Drive (MKV/WMV/AVI)</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#111] border border-[#333] hover:border-[#555] text-white font-semibold rounded-xl text-xs uppercase tracking-widest focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
            >
              Voltar para Lista
            </button>
          </div>
        </div>
      )}

      {/* Resume Playback Prompt Overlay */}
      {resumePrompt !== null && !useEmbedPlayer && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 z-40">
          <div className="bg-[#0c0c0c] border border-[#222] p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#333] text-white flex items-center justify-center mx-auto">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif italic text-white">Continuar assistindo?</h3>
              <p className="text-[#888] text-xs mt-1">
                Você parou este vídeo em{" "}
                <span className="text-white font-mono font-bold">
                  {formatDuration((resumePrompt * 1000).toString())}
                </span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = resumePrompt;
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                  setResumePrompt(null);
                }}
                className="flex-1 py-3 px-4 bg-white text-black font-extrabold rounded-xl text-xs uppercase tracking-wider hover:bg-[#e0e0e0] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer shadow-lg"
              >
                Continuar de {formatDuration((resumePrompt * 1000).toString())}
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                  }
                  setResumePrompt(null);
                }}
                className="flex-1 py-3 px-4 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] text-white font-semibold rounded-xl text-xs uppercase tracking-wider focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
              >
                Começar do início
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black via-black/80 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] text-white rounded-xl text-xs uppercase tracking-wider font-semibold border border-[#222] hover:border-[#444] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-lg md:text-xl font-serif text-white line-clamp-1 max-w-xl">
              {video.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#888]">Google Drive Video Player</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#222] text-[#ccc] border border-[#333] uppercase">
                {video.name.split(".").pop()?.toUpperCase() || "VÍDEO"}
              </span>
            </div>
          </div>
        </div>

        {/* Engine Switcher & Auto Next */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUseEmbedPlayer(!useEmbedPlayer);
              setErrorMsg(null);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#111] hover:bg-[#222] border border-[#333] hover:border-[#555] text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer shadow-lg"
            title="Alternar entre Player Nativo e Transcodificação Drive"
          >
            {useEmbedPlayer ? <Film className="w-3.5 h-3.5 text-blue-400" /> : <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden md:inline">
              {useEmbedPlayer ? "Modo: Transcodificação Drive (MKV/WMV)" : "Modo: Player Nativo HTML5"}
            </span>
            <span className="md:hidden">
              {useEmbedPlayer ? "Transcode Drive" : "Nativo HTML5"}
            </span>
          </button>

          {useEmbedPlayer && (
            <a
              href={`https://drive.google.com/file/d/${video.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] text-[#aaa] hover:text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir no Drive</span>
            </a>
          )}

          <label className="hidden sm:flex items-center gap-2 text-xs text-[#aaa] font-medium bg-[#111] border border-[#222] px-3 py-2 rounded-xl cursor-pointer hover:border-[#444] transition-colors">
            <input
              type="checkbox"
              checked={autoNext}
              onChange={(e) => setAutoNext(e.target.checked)}
              className="w-3.5 h-3.5 accent-white rounded focus:ring-2 focus:ring-white/40 cursor-pointer"
            />
            <span>Auto-próximo</span>
          </label>
        </div>
      </div>

      {/* Center Big Play/Pause Button (shows briefly on overlay in HTML5 mode) */}
      {!useEmbedPlayer && showControls && !resumePrompt && (
        <div className="absolute inset-0 flex items-center justify-center gap-8 pointer-events-none z-20">
          {hasPrev && (
            <button
              onClick={() => onSelectVideo(playlist[currentIndex - 1])}
              className="pointer-events-auto p-4 rounded-full bg-[#111]/90 text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all transform hover:scale-105 shadow-2xl border border-[#333]"
              title="Vídeo Anterior"
            >
              <SkipBack className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={togglePlay}
            className="pointer-events-auto p-5 rounded-full bg-white text-black hover:bg-[#e0e0e0] focus:ring-4 focus:ring-white/40 outline-none transition-all transform hover:scale-105 shadow-2xl"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 fill-black" />
            ) : (
              <Play className="w-10 h-10 fill-black pl-1" />
            )}
          </button>

          {hasNext && (
            <button
              onClick={() => onSelectVideo(playlist[currentIndex + 1])}
              className="pointer-events-auto p-4 rounded-full bg-[#111]/90 text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all transform hover:scale-105 shadow-2xl border border-[#333]"
              title="Próximo Vídeo"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Bottom Controls Bar Overlay (HTML5 Mode) */}
      {!useEmbedPlayer && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent transition-opacity duration-300 z-30 flex flex-col gap-3 ${
            showControls ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Scrubber / Progress Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#aaa] w-14 text-right font-semibold">
              {formatDuration((currentTime * 1000).toString()) || "00:00"}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value);
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime;
                  setCurrentTime(newTime);
                }
              }}
              className="flex-1 h-1.5 bg-[#222] rounded-lg appearance-none cursor-pointer accent-white focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <span className="text-xs font-mono text-[#666] w-14 font-semibold">
              {formatDuration((duration * 1000).toString()) || "00:00"}
            </span>
          </div>

          {/* Action Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            {/* Left Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-xl bg-[#111] text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer border border-[#222]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 pl-0.5" />}
              </button>

              <button
                onClick={() => seekBy(-10)}
                className="p-2.5 rounded-xl bg-[#111] text-[#aaa] hover:text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer border border-[#222]"
                title="Voltar 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekBy(10)}
                className="p-2.5 rounded-xl bg-[#111] text-[#aaa] hover:text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer border border-[#222]"
                title="Avançar 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume Control */}
              <div className="hidden sm:flex items-center gap-2 bg-[#111] border border-[#222] px-3 py-1.5 rounded-xl">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="text-[#aaa] hover:text-white focus:ring-2 focus:ring-white/40 rounded outline-none"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      setVolume(val);
                      setIsMuted(val === 0);
                    }
                  }}
                  className="w-16 h-1 bg-[#333] rounded-lg appearance-none cursor-pointer accent-white focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-[#222] text-[#e0e0e0] rounded-xl text-xs font-semibold border border-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[#aaa]" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 bg-[#111] border border-[#222] rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 w-28 z-50">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changeSpeed(rate)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-white/40 outline-none cursor-pointer ${
                          playbackRate === rate
                            ? "bg-white text-black font-extrabold"
                            : "text-[#aaa] hover:bg-[#222] hover:text-white"
                        }`}
                      >
                        <span>{rate}x</span>
                        {playbackRate === rate && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-[#111] text-[#aaa] hover:text-white hover:bg-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer border border-[#222]"
                title="Alternar Tela Cheia"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

