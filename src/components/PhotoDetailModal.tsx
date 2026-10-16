import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { PhotoEntry } from '../types/contest.ts';
import { X, Camera, Award, ChevronLeft, ChevronRight, CheckCircle2, Heart, QrCode, Download, Copy, Check } from 'lucide-react';
import { getFallbackImageUrl } from '../utils/seedData.ts';

const ArtworkDetailQr: React.FC<{ photoId: string; photoTitle: string }> = ({ photoId, photoTitle }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const votingUrl = `${baseUrl}?voteFor=${photoId}`;

  useEffect(() => {
    if (!votingUrl) return;
    QRCode.toDataURL(
      votingUrl,
      {
        width: 300,
        margin: 1,
        color: { dark: '#020617', light: '#ffffff' },
      },
      (err, url) => {
        if (!err && url) setQrUrl(url);
      }
    );
  }, [votingUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(votingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.download = `qrcode-voto-${photoTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    a.href = qrUrl;
    a.click();
  };

  return (
    <>
      {qrUrl && (
        <img
          src={qrUrl}
          alt={`QR Code ${photoTitle}`}
          className="w-16 h-16 bg-white p-1 rounded-xl shadow border border-slate-700 shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" /> QR Code deste Desenho
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Aponte a câmera para votar diretamente nesta obra
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={handleDownload}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 border border-slate-700"
          >
            <Download className="w-3 h-3 text-amber-400" /> Baixar
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold flex items-center gap-1 border border-slate-700"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado!' : 'Copiar Link'}
          </button>
        </div>
      </div>
    </>
  );
};

interface PhotoDetailModalProps {
  photo: PhotoEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onVoteClick: (photo: PhotoEntry) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasVotedForThis: boolean;
  hasAlreadyVoted: boolean;
  allowRevote: boolean;
  isVotingClosed: boolean;
}

export const PhotoDetailModal: React.FC<PhotoDetailModalProps> = ({
  photo,
  isOpen,
  onClose,
  onVoteClick,
  onPrev,
  onNext,
  hasVotedForThis,
  hasAlreadyVoted,
  allowRevote,
  isVotingClosed,
}) => {
  if (!isOpen || !photo) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-700/50 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Previous / Next buttons */}
        {onPrev && (
          <button
            onClick={onPrev}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-700/50 transition-colors"
            title="Foto anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="hidden sm:flex absolute md:left-[58%] right-4 md:right-auto top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-700/50 transition-colors"
            title="Próxima foto"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Image Stage */}
        <div className="relative md:w-3/5 bg-slate-950 flex items-center justify-center min-h-[280px] sm:min-h-[420px] max-h-[50vh] md:max-h-[92vh] overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-contain max-h-[92vh] select-none"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = '1';
                target.src = getFallbackImageUrl(photo.id, photo.imageUrl);
              }
            }}
          />
          {hasVotedForThis && (
            <div className="absolute top-4 left-4 z-10 px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
              Seu Voto Registrado
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[48vh] md:max-h-[92vh] bg-slate-900/95 border-t md:border-t-0 md:border-l border-slate-800">
          <div className="space-y-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
                {photo.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {photo.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Por <span className="text-slate-200 font-semibold text-base">{photo.photographer}</span>
              </p>
            </div>

            {/* Description */}
            {photo.description && (
              <div className="pt-2">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Sobre a Obra
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {photo.description}
                </p>
              </div>
            )}

            {/* Art technique and specs */}
            {photo.cameraInfo && (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Técnica & Materiais</div>
                  <div className="font-mono text-slate-200 text-xs mt-0.5">{photo.cameraInfo}</div>
                </div>
              </div>
            )}

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  Total de Votos
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {photo.votes}
                  <span className="text-xs font-normal text-slate-400 ml-1">votos</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Classificação
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {photo.rank}º <span className="text-xs font-normal text-slate-400">lugar ({photo.percentage}%)</span>
                </div>
              </div>
            </div>

            {/* Artwork Specific QR Code Section */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5 mt-2">
              <ArtworkDetailQr photoId={photo.id} photoTitle={photo.title} />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-slate-800/80 mt-6">
            {hasVotedForThis ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Esta é a sua escolha na exposição!
              </div>
            ) : (
              <button
                onClick={() => onVoteClick(photo)}
                disabled={isVotingClosed || (hasAlreadyVoted && !allowRevote)}
                className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
                  isVotingClosed
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : hasAlreadyVoted && !allowRevote
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95'
                }`}
              >
                {isVotingClosed ? (
                  'Votação Encerrada'
                ) : hasAlreadyVoted && !allowRevote ? (
                  'Você já votou em outro desenho'
                ) : hasAlreadyVoted && allowRevote ? (
                  'Mudar meu voto para este desenho'
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-slate-950" />
                    Votar neste Desenho (1 Voto)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
