import React, { useState, useEffect, useRef } from 'react';
import type { ContestData, PhotoEntry } from '../types/contest.ts';
import { getFallbackImageUrl } from '../utils/seedData.ts';
import {
  Trophy,
  Crown,
  Download,
  Upload,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  FileText,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResultsViewProps {
  data: ContestData | null;
  onSelectPhoto?: (photo: PhotoEntry) => void;
  onUpdateSettings?: (settings: Partial<ContestData['contest']>) => Promise<{ success: boolean }>;
  onRestoreBackup?: (backup: any) => Promise<{ success: boolean; message: string }>;
  onDownloadBackup?: () => void;
  onDownloadCsv?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  data,
  onSelectPhoto,
  onUpdateSettings,
  onRestoreBackup,
  onDownloadBackup,
  onDownloadCsv,
}) => {
  const [showVoteLogs, setShowVoteLogs] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contest = data?.contest;
  const photos = data?.photos || [];
  const totalVotes = data?.totalVotes || 0;
  const totalVoters = data?.totalVoters || 0;
  const recentVotes = data?.recentVotes || [];

  const top1 = photos.length > 0 && photos[0].votes > 0 ? photos[0] : null;
  const top2 = photos.length > 1 && photos[1].votes > 0 ? photos[1] : null;
  const top3 = photos.length > 2 && photos[2].votes > 0 ? photos[2] : null;

  useEffect(() => {
    setLastSavedTime(new Date().toLocaleTimeString('pt-BR'));
  }, [totalVotes, photos]);

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#ffffff'],
    });
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleToggleStatus = async () => {
    if (!onUpdateSettings || !contest) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = contest.status === 'active' ? 'paused' : 'active';
      await onUpdateSettings({ status: nextStatus });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreBackup) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.photos || !Array.isArray(parsed.photos)) {
        setRestoreMessage({ text: 'Arquivo inválido: formato de backup não reconhecido.', success: false });
        return;
      }
      const res = await onRestoreBackup(parsed);
      setRestoreMessage({
        text: res.message || 'Backup restaurado com sucesso! Votação continuada de onde parou.',
        success: res.success,
      });
      if (res.success) {
        handleTriggerConfetti();
      }
    } catch (err: any) {
      setRestoreMessage({ text: 'Falha ao ler o arquivo JSON: ' + (err.message || 'erro desconhecido'), success: false });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setRestoreMessage(null), 7000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0 print:max-w-none">

      {/* Persistence and Notification Banner */}
      {restoreMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in ${
            restoreMessage.success
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {restoreMessage.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{restoreMessage.text}</span>
          </div>
          <button
            onClick={() => setRestoreMessage(null)}
            className="text-xs px-2.5 py-1 rounded bg-black/30 hover:bg-black/50"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header & Apuração Status (Screen View) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Apuração Oficial em Tempo Real
            </span>
            <span className="text-xs text-slate-400">
              Atualização: <span className="text-slate-200 font-mono">{lastSavedTime || 'Automática'}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            Apuração Oficial & Resultados dos Votos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {contest?.title || 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ'} • Classificação geral, total de votos apurados e auditoria oficial.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border ${
            contest?.status === 'active'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : contest?.status === 'paused'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}>
            {contest?.status === 'active'
              ? '● Votação Aberta'
              : contest?.status === 'paused'
              ? '⏸ Votação Pausada'
              : '⏹ Votação Encerrada'}
          </span>
        </div>
      </div>

      {/* Official Print Header (Visible ONLY on print) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
        <div className="text-center space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600">
            ARQUIDIOCESE DE BELÉM DO PARÁ • PARÓQUIA DE NOSSA SENHORA DE NAZARÉ
          </h2>
          <h1 className="text-xl font-black text-black">
            ATA OFICIAL DE APURAÇÃO DO CONCURSO DE DESENHOS
          </h1>
          <p className="text-xs text-slate-700">
            {contest?.title} • {contest?.subtitle}
          </p>
          <div className="text-xs font-mono text-slate-600 pt-1">
            Data e Hora de Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center justify-between text-slate-400 print:text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Votos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 print:text-black" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white print:text-black font-mono">
              {totalVotes}
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
              {totalVotes === 0 ? 'Aguardando votos' : '100% computados e salvos'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center justify-between text-slate-400 print:text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Eleitores Únicos</span>
            <Users className="w-4 h-4 text-amber-400 print:text-black" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white print:text-black font-mono">
              {totalVoters}
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
              1 voto por pessoa rigoroso
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center justify-between text-slate-400 print:text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Obras Inscritas</span>
            <Award className="w-4 h-4 text-cyan-400 print:text-black" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white print:text-black font-mono">
              {photos.length}
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
              Concorrentes ao título
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between print:bg-white print:border-slate-300 print:text-black">
          <div className="flex items-center justify-between text-slate-400 print:text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Status Atual</span>
            <Clock className="w-4 h-4 text-violet-400 print:text-black" />
          </div>
          <div>
            <div className="text-lg sm:text-xl font-black text-white print:text-black">
              {contest?.status === 'active' ? (
                <span className="text-emerald-400 print:text-black">Votação Aberta</span>
              ) : contest?.status === 'paused' ? (
                <span className="text-amber-400 print:text-black">Votação Pausada</span>
              ) : (
                <span className="text-slate-300 print:text-black">Votação Encerrada</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
              {contest?.status === 'active' ? 'Recebendo novos votos' : 'Pronto para apuração'}
            </div>
          </div>
        </div>
      </div>

      {/* Podium Section (when there are votes) */}
      {top1 ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 p-6 sm:p-8 shadow-2xl print:border-black print:bg-white print:text-black">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Winner Artwork Image */}
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl group cursor-pointer"
                 onClick={() => onSelectPhoto && onSelectPhoto(top1)}>
              <img
                src={top1.imageUrl}
                alt={top1.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedFallback) {
                    target.dataset.triedFallback = '1';
                    target.src = getFallbackImageUrl(top1.id, top1.imageUrl);
                  }
                }}
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow">
                <Crown className="w-3.5 h-3.5" /> 1º Lugar
              </div>
            </div>

            {/* Winner Details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Obra Líder / Mais Votada
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white print:text-black">
                {top1.title}
              </h2>
              <div className="text-sm font-semibold text-amber-300 print:text-slate-800">
                Artista: {top1.photographer} • <span className="text-slate-300 print:text-slate-600">{top1.category}</span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600 line-clamp-2 max-w-xl">
                {top1.description}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center print:border-black">
                  <div className="text-xl font-black text-amber-400 font-mono print:text-black">{top1.votes}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Votos Computados</div>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-950/80 border border-amber-500/30 text-center print:border-black">
                  <div className="text-xl font-black text-emerald-400 font-mono print:text-black">{top1.percentage}%</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Preferência Popular</div>
                </div>
                <button
                  onClick={handleTriggerConfetti}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all print:hidden"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Comemorar com Confetes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Concurso Iniciado do Zero • Votação Aberta</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Todos os votos foram zerados. Conforme os participantes votarem via leitura de QR Code ou na galeria, o pódio e a classificação geral atualizarão instantaneamente nesta tela.
          </p>
        </div>
      )}

      {/* Complete Classification Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl print:bg-white print:border-slate-300 print:text-black">
        <div className="p-5 sm:p-6 border-b border-slate-800 print:border-slate-300 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400 print:text-black" />
              Quadro Geral de Classificação & Apuração
            </h3>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Total de {photos.length} desenhos avaliados por votação direta e auditável.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400 print:text-slate-600">
            Ordenado por: Maior número de votos
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 print:bg-slate-100 print:text-black uppercase text-[11px] font-bold border-b border-slate-800 print:border-slate-300">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Posição</th>
                <th className="py-3 px-4 w-20">Obra</th>
                <th className="py-3 px-4">Título do Desenho & Artista</th>
                <th className="py-3 px-4 hidden md:table-cell">Técnica / Categoria</th>
                <th className="py-3 px-4 text-center w-28">Votos</th>
                <th className="py-3 px-4 text-center w-24">Percentual</th>
                <th className="py-3 px-4 w-36 hidden sm:table-cell">Distribuição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
              {photos.map((photo, index) => {
                const isWinner = index === 0 && photo.votes > 0;
                const isSecond = index === 1 && photo.votes > 0;
                const isThird = index === 2 && photo.votes > 0;

                return (
                  <tr
                    key={photo.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isWinner ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {isWinner ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow">
                          🥇 1º
                        </span>
                      ) : isSecond ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-xs shadow">
                          🥈 2º
                        </span>
                      ) : isThird ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-black text-xs shadow">
                          🥉 3º
                        </span>
                      ) : (
                        <span className="font-bold text-slate-400 font-mono">
                          {photo.rank}º
                        </span>
                      )}
                    </td>

                    {/* Artwork Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onSelectPhoto && onSelectPhoto(photo)}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.triedFallback) {
                              target.dataset.triedFallback = '1';
                              target.src = getFallbackImageUrl(photo.id, photo.imageUrl);
                            }
                          }}
                        />
                      </div>
                    </td>

                    {/* Title & Author */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white print:text-black">
                        {photo.title}
                      </div>
                      <div className="text-xs text-amber-400 print:text-slate-700 font-semibold mt-0.5">
                        Artista: {photo.photographer}
                      </div>
                    </td>

                    {/* Technique */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 print:text-slate-600 text-xs">
                      {photo.category}
                    </td>

                    {/* Votes Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-base text-white print:text-black">
                        {photo.votes}
                      </span>
                    </td>

                    {/* Percentage */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-950/80 border border-slate-800 print:border-none text-emerald-400 print:text-black">
                        {photo.percentage}%
                      </span>
                    </td>

                    {/* Visual Progress Bar */}
                    <td className="py-3.5 px-4 hidden sm:table-cell">
                      <div className="w-full h-2 rounded-full bg-slate-800 print:bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isWinner
                              ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                              : 'bg-gradient-to-r from-slate-500 to-slate-400'
                          }`}
                          style={{ width: `${photo.votes > 0 ? Math.max(photo.percentage, 3) : 0}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Section (Collapsible on screen, optional in print) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl print:bg-white print:border-slate-300 print:text-black space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Auditoria de Votos Registrados
            </h3>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Registro cronológico dos últimos votos computados no sistema com data e hora.
            </p>
          </div>
          <button
            onClick={() => setShowVoteLogs(!showVoteLogs)}
            className="text-xs px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors print:hidden"
          >
            {showVoteLogs ? 'Ocultar Detalhes' : `Exibir Logs Recentes (${recentVotes.length})`}
          </button>
        </div>

        {showVoteLogs && (
          <div className="border border-slate-800 rounded-2xl overflow-hidden mt-3">
            {recentVotes.length > 0 ? (
              <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                {recentVotes.map((vote, i) => (
                  <div key={i} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-800/40">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px]">
                        {i + 1}
                      </span>
                      <span className="font-bold text-white">{vote.voterName || 'Eleitor Anônimo'}</span>
                      <span className="text-slate-400">votou em</span>
                      <span className="font-bold text-amber-300">{vote.photoTitle}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(vote.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum voto registrado ainda. Quando os participantes votarem, os registros de auditoria aparecerão aqui.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Signatures Section (Formatted for Print / Formal Minutes) */}
      <div className="hidden print:block pt-12 space-y-12">
        <div className="text-xs text-slate-700 leading-relaxed text-justify">
          Pela presente ata, a comissão organizadora declara concluída a sessão de apuração e votação popular da <strong>{contest?.title}</strong>, certificando a integridade dos dados e a veracidade da apuração dos votos computados.
        </div>

        <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
          <div className="border-t border-black pt-2">
            <strong>Coordenador do Concurso</strong>
            <div className="text-[10px] text-slate-600">Comissão Organizadora</div>
          </div>
          <div className="border-t border-black pt-2">
            <strong>Representante dos Artistas</strong>
            <div className="text-[10px] text-slate-600">Comissão de Desenho</div>
          </div>
          <div className="border-t border-black pt-2">
            <strong>Secretário da Apuração</strong>
            <div className="text-[10px] text-slate-600">Auditoria do Concurso</div>
          </div>
        </div>
      </div>
    </div>
  );
};
