import React, { useState, useMemo } from 'react';
import type { ContestData, PhotoEntry } from '../types/contest.ts';
import { getFallbackImageUrl } from '../utils/seedData.ts';
import {
  Heart,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Trophy,
  Maximize2,
  Lock,
  Camera,
  AlertCircle,
  HelpCircle,
  QrCode,
  Upload,
  UserPlus,
} from 'lucide-react';

interface VotingGalleryProps {
  data: ContestData | null;
  votedPhotoId: string | null;
  onSelectPhoto: (photo: PhotoEntry) => void;
  onVoteClick: (photo: PhotoEntry) => void;
  onOpenQrModal: () => void;
  onOpenQrForPhoto?: (photo: PhotoEntry) => void;
  onReleaseForNewVote?: () => void;
}

export const VotingGallery: React.FC<VotingGalleryProps> = ({
  data,
  votedPhotoId,
  onSelectPhoto,
  onVoteClick,
  onOpenQrModal,
  onOpenQrForPhoto,
  onReleaseForNewVote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'rank' | 'title' | 'author'>('rank');

  const photos = data?.photos || [];
  const contest = data?.contest;
  const isVotingClosed = contest?.status !== 'active';
  const allowRevote = contest?.allowRevote || false;

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todas', ...Array.from(set)];
  }, [photos]);

  // Filtered and sorted photos
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    if (selectedCategory !== 'Todas') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.photographer.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (sortBy === 'rank') {
      result.sort((a, b) => a.rank - b.rank);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'author') {
      result.sort((a, b) => a.photographer.localeCompare(b.photographer));
    }

    return result;
  }, [photos, selectedCategory, searchTerm, sortBy]);

  const votedPhoto = photos.find((p) => p.id === votedPhotoId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Contest Presentation */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            EXPOSIÇÃO DE ARTE EM DESENHO
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            {contest?.title || 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ'}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {contest?.subtitle || 'Aprecie as obras de arte e ilustrações dedicadas a Nossa Senhora de Nazaré e registre seu voto único.'}
          </p>
        </div>

        {/* Voting Status and 1-Vote Banner */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          {votedPhoto ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex flex-wrap items-center justify-between gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs sm:text-sm">Último voto computado com sucesso!</div>
                  <div className="text-[11px] text-emerald-300/80">
                    Obra votada: <strong>"{votedPhoto.title}"</strong>. Aparelho liberado para novos participantes.
                  </div>
                </div>
              </div>
              {onReleaseForNewVote && (
                <button
                  type="button"
                  onClick={onReleaseForNewVote}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Liberar para Novo Voto
                </button>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-3 text-xs sm:text-sm">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Regra do Concurso: 1 Voto Por Nome</span>
                <span className="text-slate-400 text-xs">Várias pessoas podem votar pelo mesmo aparelho. Cada pessoa só pode votar 1 vez com seu nome.</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {/* QR Code trigger */}
            <button
              onClick={onOpenQrModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:bg-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/40 shadow-lg shadow-amber-500/10 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              QR Codes da Exposição
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por desenho ou desenhista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <span className="text-xs text-slate-400">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rank' | 'title' | 'author')}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="rank">Classificação Atual</option>
            <option value="title">Título da Foto</option>
            <option value="author">Nome do Fotógrafo</option>
          </select>
        </div>
      </div>

      {/* Photo Cards Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
          <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Nenhum desenho encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tente buscar com outro termo ou selecione a categoria "Todas".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPhotos.map((photo) => {
            const isUserChoice = votedPhotoId === photo.id;
            const hasVotedAny = !!votedPhotoId;

            return (
              <div
                key={photo.id}
                className={`group relative rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 flex flex-col justify-between ${
                  isUserChoice
                    ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-2xl hover:shadow-black/60'
                }`}
              >
                {/* Photo Image with Overlay */}
                <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => onSelectPhoto(photo)}>
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedFallback) {
                        target.dataset.triedFallback = '1';
                        target.src = getFallbackImageUrl(photo.id, photo.imageUrl);
                      }
                    }}
                  />

                  {/* Gradient shade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                  {/* Category badge */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-slate-800 shadow">
                      {photo.category}
                    </span>
                  </div>

                  {/* Rank badge */}
                  <div className="absolute top-3.5 right-3.5 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black shadow flex items-center gap-1 ${
                      photo.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : photo.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : photo.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800'
                    }`}>
                      #{photo.rank}
                    </span>
                  </div>

                  {/* Voted badge if chosen */}
                  {isUserChoice && (
                    <div className="absolute bottom-3.5 left-3.5 z-10 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sua Escolha
                    </div>
                  )}

                  {/* Zoom hint on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPhoto(photo);
                    }}
                    className="absolute bottom-3.5 right-3.5 z-10 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-slate-300 hover:text-white border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ver detalhes e alta resolução"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3
                      onClick={() => onSelectPhoto(photo)}
                      className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
                    >
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Por <span className="text-slate-200 font-semibold">{photo.photographer}</span>
                    </p>

                    {photo.description && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                  </div>

                  {/* Votes count & Progress bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total acumulado:</span>
                      <span className="font-bold text-white font-mono">
                        {photo.votes} votos <span className="text-amber-400 ml-1">({photo.percentage}%)</span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${photo.votes > 0 ? Math.max(photo.percentage, 2) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="space-y-2">
                    {/* Secondary Utility: QR Code do Desenho */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenQrForPhoto) onOpenQrForPhoto(photo);
                        else onOpenQrModal();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-800 hover:border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                      title="Ver e baixar QR Code individual deste desenho"
                    >
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>QR Code do Desenho</span>
                    </button>

                    {/* Vote Action Button */}
                    <button
                      onClick={() => onVoteClick(photo)}
                      disabled={isVotingClosed}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        isVotingClosed
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                      }`}
                    >
                      {isVotingClosed ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          Votação Encerrada
                        </>
                      ) : (
                        <>
                          <Heart className="w-3.5 h-3.5 fill-slate-950" />
                          Votar neste Desenho
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
