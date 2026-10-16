import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import type { ContestData, PhotoEntry } from '../types/contest.ts';
import { playDrumroll, playWinnerFanfare } from '../utils/audio.ts';
import {
  Trophy,
  Crown,
  Flame,
  QrCode,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  Users,
  Eye,
  Radio,
  Clock,
  Play,
  RotateCcw,
  Smartphone
} from 'lucide-react';

interface LiveStageProps {
  data: ContestData | null;
  onSimulateVote: () => void;
  onSelectPhoto: (photo: PhotoEntry) => void;
}

export const LiveStage: React.FC<LiveStageProps> = ({
  data,
  onSimulateVote,
  onSelectPhoto,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'leaderboard' | 'podium'>('leaderboard');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showQrOnStage, setShowQrOnStage] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  const photos = data?.photos || [];
  const contest = data?.contest;
  const totalVotes = data?.totalVotes || 0;
  const topPhoto = photos[0];

  const votingUrl = typeof window !== 'undefined' ? `${window.location.origin}?mode=vote` : '';

  // Generate QR Code for Stage
  useEffect(() => {
    if (!votingUrl) return;
    QRCode.toDataURL(
      votingUrl,
      {
        width: 400,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) setQrDataUrl(url);
      }
    );
  }, [votingUrl]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      stageRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Fire Confetti explosion
  const triggerConfetti = () => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff', '#ec4899', '#6366f1'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff', '#ec4899', '#6366f1'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Dramatic Reveal sequence
  const startWinnerReveal = () => {
    if (isRevealing) return;
    setIsRevealing(true);
    setRevealed(false);
    setCountdown(3);

    // Audio suspense
    playDrumroll(3.2);

    let currentCount = 3;
    const timer = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(timer);
        setCountdown(null);
        setIsRevealing(false);
        setRevealed(true);
        triggerConfetti();
        playWinnerFanfare();
      }
    }, 1000);
  };

  const resetReveal = () => {
    setRevealed(false);
    setIsRevealing(false);
    setCountdown(null);
  };

  // Top 3 for podium
  const first = photos[0];
  const second = photos[1];
  const third = photos[2];

  return (
    <div
      ref={stageRef}
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 ${
        isFullscreen ? 'p-6 md:p-10' : 'p-4 sm:p-6 lg:p-8'
      }`}
    >
      {/* Top Stage Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Ao Vivo no Telão
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 hidden sm:inline">1 Voto por Pessoa</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
              {contest?.title || 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ'}
            </h1>
          </div>
        </div>

        {/* Live Counters & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Total Votes Counter */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total de Votos</div>
              <div className="text-xl sm:text-2xl font-black text-white leading-none font-mono">
                {totalVotes}
              </div>
            </div>
          </div>

          {/* Toggle View mode */}
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'leaderboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ranking
            </button>
            <button
              onClick={() => setViewMode('podium')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'podium'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pódio Top 3
            </button>
          </div>

          {/* QR Code toggle */}
          <button
            onClick={() => setShowQrOnStage(!showQrOnStage)}
            className={`p-2.5 rounded-2xl border transition-all ${
              showQrOnStage
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Exibir QR Code no Telão"
          >
            <QrCode className="w-5 h-5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Sair do Modo Tela Cheia' : 'Modo Telão Cheio'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Presentation Area */}
      <div className="flex-1 my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Section: Leaderboard or Podium */}
        <div className={`${showQrOnStage ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} space-y-4`}>
          {/* Winner Reveal Suspense Banner */}
          <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border border-amber-500/30 shadow-2xl">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold tracking-wider uppercase">
                  <Sparkles className="w-4 h-4" />
                  Momento de Ouro • Votação Popular
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {revealed
                    ? '🎉 Desenho Escolhido Revelado!'
                    : isRevealing
                    ? '🥁 Revelando o desenho escolhido...'
                    : 'Apresentação Oficial dos Resultados'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  A votação dos fiéis e participantes elege ao vivo o desenho representativo de Nossa Senhora de Nazaré.
                </p>
              </div>

              {/* Reveal trigger button */}
              <div className="flex items-center gap-2">
                {!revealed ? (
                  <button
                    onClick={startWinnerReveal}
                    disabled={isRevealing || photos.length === 0}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <Crown className="w-5 h-5" />
                    {isRevealing ? 'Aguarde...' : 'Revelar Desenho Escolhido!'}
                  </button>
                ) : (
                  <button
                    onClick={resetReveal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reiniciar Suspense
                  </button>
                )}
              </div>
            </div>

            {/* Countdown Overlay when revealing */}
            {isRevealing && countdown !== null && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
                <div className="text-7xl sm:text-9xl font-black text-amber-400 animate-bounce font-mono">
                  {countdown}
                </div>
                <div className="text-lg font-bold text-slate-200 mt-2 tracking-widest uppercase">
                  Quem será o grande vencedor?
                </div>
              </div>
            )}
          </div>

          {/* VIEW MODE 1: Dynamic Leaderboard */}
          {viewMode === 'leaderboard' && (
            <div className="space-y-3">
              {photos.map((photo, index) => {
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;

                return (
                  <div
                    key={photo.id}
                    onClick={() => onSelectPhoto(photo)}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
                      isTop1
                        ? 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : isTop2
                        ? 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500'
                        : isTop3
                        ? 'bg-slate-900/80 border-slate-800 hover:border-amber-700/60'
                        : 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Animated Progress Bar behind content */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out opacity-25 ${
                        isTop1
                          ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                          : isTop2
                          ? 'bg-gradient-to-r from-slate-300 to-slate-400'
                          : isTop3
                          ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      }`}
                      style={{ width: `${photo.votes > 0 ? Math.max(photo.percentage, 2) : 0}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between p-3.5 sm:p-4 gap-3 sm:gap-5">
                      {/* Left: Rank & Photo Thumb */}
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base shrink-0 shadow-md ${
                            isTop1
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-400/50'
                              : isTop2
                              ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950'
                              : isTop3
                              ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isTop1 ? <Crown className="w-5 h-5" /> : `#${index + 1}`}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-slate-700/80 bg-slate-950 group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-amber-400 border border-slate-700/60 hidden sm:inline-block">
                              {photo.category}
                            </span>
                            {isTop1 && photo.votes > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 uppercase tracking-wide flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-slate-950" /> Líder
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5 group-hover:text-amber-400 transition-colors">
                            {photo.title}
                          </h3>
                          <p className="text-xs text-slate-400 truncate">
                            Artista / Desenhista: <span className="text-slate-300 font-medium">{photo.photographer}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Votes & Percentage */}
                      <div className="text-right shrink-0">
                        <div className="flex items-baseline justify-end gap-1.5">
                          <span className="text-xl sm:text-2xl font-black text-white font-mono">
                            {photo.votes}
                          </span>
                          <span className="text-xs text-slate-400">
                            {photo.votes === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-amber-400 font-mono">
                          {photo.percentage}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 2: Podium View */}
          {viewMode === 'podium' && (
            <div className="pt-6 sm:pt-10 pb-8 flex flex-col items-center">
              <div className="w-full max-w-4xl grid grid-cols-3 gap-3 sm:gap-6 items-end">
                {/* 2nd Place (Left) */}
                {second && (
                  <div
                    onClick={() => onSelectPhoto(second)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative mb-3 w-28 sm:w-44 aspect-square rounded-2xl overflow-hidden border-2 border-slate-300 shadow-xl group-hover:scale-105 transition-all">
                      <img src={second.imageUrl} alt={second.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-300 text-slate-950 font-black text-xs">
                        2º Lugar
                      </div>
                    </div>
                    <div className="text-center w-full px-2">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">{second.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{second.photographer}</div>
                      <div className="text-base sm:text-lg font-black text-slate-200 mt-1">{second.votes} votos</div>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-slate-900 to-slate-800 rounded-t-2xl border-t border-x border-slate-700 flex items-center justify-center text-3xl sm:text-5xl font-black text-slate-500 mt-3 shadow-inner">
                      2
                    </div>
                  </div>
                )}

                {/* 1st Place (Center - Highest) */}
                {first && (
                  <div
                    onClick={() => onSelectPhoto(first)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative mb-3 w-32 sm:w-52 aspect-square rounded-2xl overflow-hidden border-4 border-amber-400 shadow-2xl shadow-amber-500/30 group-hover:scale-105 transition-all">
                      <img src={first.imageUrl} alt={first.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow">
                        <Crown className="w-3.5 h-3.5" /> {first.votes > 0 ? '1º Campeão' : 'Obra 01'}
                      </div>
                    </div>
                    <div className="text-center w-full px-2">
                      <div className="text-sm sm:text-base font-extrabold text-amber-300 truncate">{first.title}</div>
                      <div className="text-xs text-slate-300 truncate">{first.photographer}</div>
                      <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{first.votes} votos</div>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-40 sm:h-52 bg-gradient-to-t from-amber-950 to-amber-900/60 rounded-t-3xl border-t-2 border-x-2 border-amber-500/70 flex flex-col items-center justify-center text-4xl sm:text-6xl font-black text-amber-400 mt-3 shadow-2xl shadow-amber-500/20">
                      <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-amber-400 mb-1" />
                      1
                    </div>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {third && (
                  <div
                    onClick={() => onSelectPhoto(third)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div className="relative mb-3 w-28 sm:w-44 aspect-square rounded-2xl overflow-hidden border-2 border-amber-700 shadow-xl group-hover:scale-105 transition-all">
                      <img src={third.imageUrl} alt={third.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-700 text-amber-100 font-black text-xs">
                        3º Lugar
                      </div>
                    </div>
                    <div className="text-center w-full px-2">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">{third.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{third.photographer}</div>
                      <div className="text-base sm:text-lg font-black text-amber-600 mt-1">{third.votes} votos</div>
                    </div>
                    {/* Pedestal */}
                    <div className="w-full h-20 sm:h-28 bg-gradient-to-t from-slate-900 to-amber-950/40 rounded-t-2xl border-t border-x border-amber-800/60 flex items-center justify-center text-3xl sm:text-5xl font-black text-amber-800 mt-3 shadow-inner">
                      3
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Giant Stage QR Code & Live Ticker */}
        {showQrOnStage && (
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Interactive QR Code Box */}
            <div className="p-6 bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl shadow-2xl flex flex-col items-center text-center">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                Votação Pelo Celular
              </span>

              <h3 className="text-lg font-black text-white">
                Aponte a Câmera
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Escaneie o QR Code abaixo para escolher sua fotografia predileta.
              </p>

              {/* QR Image */}
              <div className="my-4 p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-500/50">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code para Votar"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-500">
                    Carregando QR...
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-300 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 break-all select-all">
                {votingUrl.replace(/^https?:\/\//, '')}
              </div>

              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Regra ativa: 1 voto por pessoa
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="p-5 bg-slate-900/70 border border-slate-800 rounded-3xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Votos Recentes em Tempo Real
                </h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data?.recentVotes && data.recentVotes.length > 0 ? (
                  data.recentVotes.map((v, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-center justify-between animate-in slide-in-from-top-1 duration-200"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-slate-200">
                          {v.voterName || 'Participante'}
                        </span>{' '}
                        votou em{' '}
                        <span className="text-amber-400 font-medium">"{v.photoTitle}"</span>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0">agora</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">
                    Aguardando primeiros votos da plateia...
                  </div>
                )}
              </div>
            </div>

            {/* Quick Demo Vote Simulation for rehearsals */}
            <div className="p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl text-center">
              <div className="text-[11px] text-slate-400 mb-2">
                Demonstração / Teste de Palco:
              </div>
              <button
                onClick={onSimulateVote}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                Simular 1 Voto ao Vivo
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Stage Bottom Footer */}
      <footer className="border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Sincronização instantânea ativa com todos os dispositivos</span>
        </div>
        <div>
          Clique em qualquer fotografia para abrir a visualização detalhada em alta resolução.
        </div>
      </footer>
    </div>
  );
};
