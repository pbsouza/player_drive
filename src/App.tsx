import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, logout, clearStoredAccessToken } from "./lib/firebase";
import { listDriveItems, getFolderDetails } from "./services/drive";
import {
  DriveFile,
  DriveFolder,
  BreadcrumbItem,
  WatchHistoryItem,
  UserProfile,
} from "./types";
import { CONFIG } from "./config";
import { Header } from "./components/Header";
import { DriveFolderList } from "./components/DriveFolderList";
import { VideoPlayer } from "./components/VideoPlayer";
import { WatchHistoryModal } from "./components/WatchHistoryModal";
import { TvRemoteGuideModal } from "./components/TvRemoteGuideModal";
import { Tv, ShieldCheck, Film, AlertCircle } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive Browsing State
  const [currentFolderId, setCurrentFolderId] = useState(
    CONFIG.GOOGLE_DRIVE_FOLDER_ID || "root"
  );
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    {
      id: CONFIG.GOOGLE_DRIVE_FOLDER_ID || "root",
      name:
        CONFIG.GOOGLE_DRIVE_FOLDER_ID && CONFIG.GOOGLE_DRIVE_FOLDER_ID !== "root"
          ? "Pasta Inicial"
          : "Meu Drive",
    },
  ]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Video Player & History State
  const [selectedVideo, setSelectedVideo] = useState<DriveFile | null>(null);
  const [watchHistoryMap, setWatchHistoryMap] = useState<
    Record<string, WatchHistoryItem>
  >({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTvGuideOpen, setIsTvGuideOpen] = useState(false);

  // Load Watch History from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("drivetv_watch_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setWatchHistoryMap(parsed);
      }
    } catch (err) {
      console.error("Erro ao carregar histórico local:", err);
    }
  }, []);

  // Save Watch History to localStorage
  const updateWatchHistory = useCallback((item: WatchHistoryItem) => {
    setWatchHistoryMap((prev) => {
      const updated = { ...prev, [item.fileId]: item };
      try {
        localStorage.setItem("drivetv_watch_history", JSON.stringify(updated));
      } catch (err) {
        console.error("Erro ao salvar histórico local:", err);
      }
      return updated;
    });
  }, []);

  const clearWatchHistory = useCallback(() => {
    setWatchHistoryMap({});
    try {
      localStorage.removeItem("drivetv_watch_history");
    } catch (err) {}
  }, []);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (fbUser: User, accessToken: string) => {
        setUser({
          displayName: fbUser.displayName,
          email: fbUser.email,
          photoURL: fbUser.photoURL,
        });
        setToken(accessToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch Drive Items
  const loadDriveData = useCallback(
    async (folderId: string, search: string) => {
      if (!token) return;
      setIsLoadingDrive(true);
      setDriveError(null);

      try {
        const { files: videoFiles, folders: subFolders } = await listDriveItems(
          token,
          folderId,
          search
        );
        setFiles(videoFiles);
        setFolders(subFolders);
      } catch (err: any) {
        if (err?.message === "UNAUTHORIZED") {
          console.warn("Sessão do Google Drive expirada.");
          clearStoredAccessToken();
          setNeedsAuth(true);
          setToken(null);
          setAuthError("Sua sessão com o Google Drive expirou. Por favor, conecte-se novamente.");
        } else {
          console.error("Erro ao carregar arquivos do Drive:", err?.message || String(err));
          setDriveError(
            err?.message || "Erro ao carregar seus arquivos do Google Drive."
          );
        }
      } finally {
        setIsLoadingDrive(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token && !needsAuth) {
      loadDriveData(currentFolderId, searchQuery);
    }
  }, [token, needsAuth, currentFolderId, searchQuery, loadDriveData]);

  // Handle Google Login
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const result = await googleSignIn();
      if (result) {
        setUser({
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        });
        setToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      setAuthError(
        err.message ||
          "Não foi possível conectar ao Google Drive. Tente novamente."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    setSelectedVideo(null);
  };

  // Handle Folder Navigation
  const handleOpenFolder = async (folder: DriveFolder) => {
    setSearchQuery("");
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    const targetCrumb = breadcrumbs[index];
    setSearchQuery("");
    setCurrentFolderId(targetCrumb.id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleGoBack = () => {
    if (breadcrumbs.length > 1) {
      handleNavigateBreadcrumb(breadcrumbs.length - 2);
    }
  };

  // Play video from history
  const handlePlayFromHistory = (item: WatchHistoryItem) => {
    const driveFile: DriveFile = {
      id: item.fileId,
      name: item.fileName,
      mimeType: item.mimeType || "video/mp4",
      thumbnailLink: item.thumbnailLink,
    };
    setSelectedVideo(driveFile);
    setIsHistoryOpen(false);
  };

  const historyList = (Object.values(watchHistoryMap) as WatchHistoryItem[]).sort(
    (a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime()
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] selection:bg-white selection:text-black">
      {/* Unauthenticated Login Screen */}
      {needsAuth ? (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505]">
          <div className="max-w-md w-full bg-[#0c0c0c] border border-[#222] rounded-2xl p-8 text-center shadow-2xl space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#888] font-semibold">
                SMART TV VIDEO PLAYER
              </span>
              <h1 className="text-3xl font-serif italic text-white tracking-tight">
                Google Drive TV
              </h1>
              <p className="text-[#888] text-xs leading-relaxed">
                Conecte sua conta do Google Drive para assistir e navegar seus arquivos de vídeo em tela cheia direto na Smart TV.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-950/40 border border-red-900 rounded-xl text-red-300 text-xs text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* Official Material Google Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full relative group overflow-hidden rounded-xl border border-[#333] hover:border-[#666] bg-[#111] hover:bg-[#1a1a1a] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer shadow-lg"
            >
              <div className="py-3.5 px-6 flex items-center justify-center gap-3">
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span className="font-semibold text-white text-xs uppercase tracking-wider">
                  {isLoggingIn ? "Conectando..." : "Entrar com Google"}
                </span>
              </div>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#666] pt-2 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-[#888]" />
              <span>Acesso seguro ao seu armazenamento</span>
            </div>
          </div>
        </div>
      ) : (
        /* Main Authenticated Application Dashboard */
        <div className="flex flex-col min-h-screen bg-[#050505]">
          <Header
            user={user}
            breadcrumbs={breadcrumbs}
            onNavigateBreadcrumb={handleNavigateBreadcrumb}
            onSearch={(query) => setSearchQuery(query)}
            onRefresh={() => loadDriveData(currentFolderId, searchQuery)}
            onLogout={handleLogout}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenTvGuide={() => setIsTvGuideOpen(true)}
            searchQuery={searchQuery}
          />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
            {/* Error banner */}
            {driveError && (
              <div className="mb-6 p-4 bg-red-950/40 border border-red-900 rounded-xl flex items-center justify-between gap-4 text-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-xs">{driveError}</span>
                </div>
                <button
                  onClick={() => loadDriveData(currentFolderId, searchQuery)}
                  className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-white rounded-lg text-xs font-semibold transition-all focus:ring-2 focus:ring-red-400 outline-none"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Folder & File Grid */}
            <DriveFolderList
              folders={folders}
              files={files}
              onOpenFolder={handleOpenFolder}
              onSelectVideo={(video) => setSelectedVideo(video)}
              onGoBack={handleGoBack}
              canGoBack={breadcrumbs.length > 1}
              isLoading={isLoadingDrive}
              watchHistoryMap={watchHistoryMap}
              searchQuery={searchQuery}
            />
          </main>

          {/* Video Player Modal/Overlay */}
          {selectedVideo && token && (
            <VideoPlayer
              video={selectedVideo}
              accessToken={token}
              playlist={files}
              onClose={() => setSelectedVideo(null)}
              onSelectVideo={(v) => setSelectedVideo(v)}
              onUpdateWatchHistory={updateWatchHistory}
              initialTimestamp={watchHistoryMap[selectedVideo.id]?.timestamp || 0}
            />
          )}

          {/* Watch History Modal */}
          <WatchHistoryModal
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            history={historyList}
            onPlayFromHistory={handlePlayFromHistory}
            onClearHistory={clearWatchHistory}
          />

          {/* TV Remote Shortcut Guide */}
          <TvRemoteGuideModal
            isOpen={isTvGuideOpen}
            onClose={() => setIsTvGuideOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
