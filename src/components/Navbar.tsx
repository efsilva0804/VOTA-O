import React from 'react';
import { Palette, Tv, Sliders, QrCode, CheckCircle2, Sparkles, Heart, Trophy, Upload, Award } from 'lucide-react';

interface NavbarProps {
  currentTab: 'gallery' | 'stage' | 'results' | 'admin';
  onChangeTab: (tab: 'gallery' | 'stage' | 'results' | 'admin') => void;
  onOpenQrModal: () => void;
  onOpenInsertModal?: () => void;
  hasVoted: boolean;
  isLiveConnected: boolean;
  totalVotes: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onChangeTab,
  onOpenQrModal,
  onOpenInsertModal,
  hasVoted,
  isLiveConnected,
  totalVotes,
}) => {
  return (
    <nav className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Brand */}
          <div
            onClick={() => onChangeTab('gallery')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Palette className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Desenho<span className="text-amber-400">Nazaré</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Ao Vivo
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block">
                Exposição de Arte em Desenho • Votação Popular
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              onClick={() => onChangeTab('gallery')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'gallery'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Votação</span>
            </button>

            <button
              onClick={() => onChangeTab('stage')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'stage'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4 text-emerald-400" />
              <span>Telão</span>
            </button>

            <button
              onClick={() => onChangeTab('results')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'results'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Resultados</span>
            </button>

            <button
              onClick={() => onChangeTab('admin')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden md:inline">Organizador</span>
            </button>
          </div>

          {/* Right Action / QR Code / Voted Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator */}
            <div
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400"
              title={isLiveConnected ? 'SSE conectado em tempo real' : 'Conectando ao servidor...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-mono text-slate-300 font-semibold">{totalVotes}</span> votos
            </div>

            {/* User Voted Badge */}
            {hasVoted && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Voto Registrado
              </div>
            )}

            {/* Insert Images & Auto QR Code button */}
            {onOpenInsertModal && (
              <button
                onClick={onOpenInsertModal}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 active:scale-95 transition-all"
                title="Inserir novas fotos de desenhos e gerar QR Code automático"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Inserir Imagens & QR Code</span>
                <span className="sm:hidden">Inserir</span>
              </button>
            )}

            {/* QR Code Quick Button */}
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold transition-colors"
              title="Abrir QR Code para Votação Mobile"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
