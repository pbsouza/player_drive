import React, { useState } from "react";
import { BreadcrumbItem, UserProfile } from "../types";
import {
  Tv,
  Search,
  Folder,
  ChevronRight,
  LogOut,
  History,
  Info,
  RefreshCw,
  Video,
} from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  breadcrumbs: BreadcrumbItem[];
  onNavigateBreadcrumb: (index: number) => void;
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenTvGuide: () => void;
  searchQuery: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  breadcrumbs,
  onNavigateBreadcrumb,
  onSearch,
  onRefresh,
  onLogout,
  onOpenHistory,
  onOpenTvGuide,
  searchQuery,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Breadcrumbs */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#888] font-semibold">STORAGE CONECTADO</span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif italic text-white tracking-tight">Google Drive Player</h1>
            </div>
          </div>

          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full text-xs font-medium">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id + idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />}
                  <button
                    onClick={() => onNavigateBreadcrumb(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all focus:ring-2 focus:ring-white/50 focus:bg-[#1a1a1a] outline-none border ${
                      isLast
                        ? "text-white font-semibold bg-[#1a1a1a] border-[#333]"
                        : "text-[#aaa] hover:text-white hover:bg-[#111] border-transparent"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-[#888] flex-shrink-0" />
                    <span className="truncate max-w-[140px] md:max-w-[180px]">{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Action Controls & Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Network Status Badge */}
          <div className="hidden lg:flex text-right mr-2 flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#666]">Status do Drive</span>
            <span className="text-xs text-[#00ff88] font-medium flex items-center justify-end gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse"></span>
              Conectado · Ultra HD
            </span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-56 min-w-[180px]">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar no Drive..."
              className="w-full bg-[#111] border border-[#222] text-white placeholder-[#666] rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-[#444] transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  onSearch("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888] hover:text-white text-xs px-1.5 py-0.5 rounded focus:ring-1 focus:ring-white outline-none"
              >
                ✕
              </button>
            )}
          </form>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            title="Atualizar lista"
            className="p-2.5 bg-[#111] hover:bg-[#1a1a1a] text-[#aaa] hover:text-white rounded-xl border border-[#222] hover:border-[#444] focus:ring-2 focus:ring-white/40 outline-none transition-all flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] text-[#e0e0e0] hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider border border-[#222] hover:border-[#444] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#aaa]" />
            <span className="hidden sm:inline">Histórico</span>
          </button>

          {/* TV Remote Help Guide Button */}
          <button
            onClick={onOpenTvGuide}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-[#1a1a1a] text-[#e0e0e0] hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider border border-[#222] hover:border-[#444] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-[#888]" />
            <span className="hidden sm:inline">Controle</span>
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#222]">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Usuário"}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-[#333] object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-bold text-xs border border-[#333]">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 bg-[#111] hover:bg-red-950/60 hover:text-red-400 text-[#888] rounded-xl border border-[#222] hover:border-red-900 focus:ring-2 focus:ring-red-500 outline-none transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
