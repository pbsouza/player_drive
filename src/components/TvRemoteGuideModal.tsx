import React from "react";
import { Tv, X, Play, Volume2, Maximize, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";

interface TvRemoteGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TvRemoteGuideModal: React.FC<TvRemoteGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#222] w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <Tv className="w-5 h-5 text-[#aaa]" />
            <h2 className="text-lg font-serif italic text-white">Guia de Controle Smart TV</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#111] hover:bg-[#1a1a1a] text-[#888] hover:text-white rounded-xl border border-[#222] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#111] p-4 rounded-xl border border-[#222] space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Play className="w-3.5 h-3.5" />
              <span>Player de Vídeo</span>
            </h3>
            <ul className="space-y-2 text-[#aaa] text-[11px]">
              <li className="flex items-center justify-between">
                <span>Play / Pausar:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px]">
                  OK / Espaço
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Voltar 10s:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px] flex items-center gap-1">
                  <ArrowLeft className="w-2.5 h-2.5" /> Esquerda
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Avançar 10s:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px] flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" /> Direita
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Ajustar Volume:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px] flex items-center gap-1">
                  <ArrowUp className="w-2.5 h-2.5" /> <ArrowDown className="w-2.5 h-2.5" /> Setas
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Tela Cheia:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px]">
                  Tecla F
                </kbd>
              </li>
            </ul>
          </div>

          <div className="bg-[#111] p-4 rounded-xl border border-[#222] space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Tv className="w-3.5 h-3.5" />
              <span>Navegação Geral</span>
            </h3>
            <ul className="space-y-2 text-[#aaa] text-[11px]">
              <li className="flex items-center justify-between">
                <span>Mover Seleção:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px]">
                  Setas do Controle
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Abrir Vídeo / Pasta:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px]">
                  Botão OK / Enter
                </kbd>
              </li>
              <li className="flex items-center justify-between">
                <span>Fechar / Voltar:</span>
                <kbd className="px-2 py-0.5 bg-[#080808] text-white rounded border border-[#333] font-mono text-[10px]">
                  Voltar / Esc
                </kbd>
              </li>
            </ul>
          </div>
        </div>

        {/* Tip Box */}
        <div className="bg-[#111] border border-[#222] p-3.5 rounded-xl text-[11px] text-[#aaa]">
          <strong className="text-white">Dica para Smart TVs:</strong> Todos os botões possuem borda de foco destacada em alta visibilidade ao usar o controle remoto.
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#e0e0e0] focus:ring-2 focus:ring-white/40 outline-none transition-all cursor-pointer"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
