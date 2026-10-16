import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, Download, ExternalLink, X, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';
import type { PhotoEntry } from '../types/contest.ts';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestTitle: string;
  photos?: PhotoEntry[];
  initialPhotoId?: string | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  contestTitle,
  photos = [],
  initialPhotoId = null,
}) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | 'general'>(
    initialPhotoId || 'general'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Update selected photo if initialPhotoId changes on open
  useEffect(() => {
    if (isOpen) {
      setSelectedPhotoId(initialPhotoId || 'general');
    }
  }, [isOpen, initialPhotoId]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  // Calculate target URL
  const currentPhoto = photos.find((p) => p.id === selectedPhotoId);
  const votingUrl =
    selectedPhotoId === 'general' || !currentPhoto
      ? `${baseUrl}?mode=vote`
      : `${baseUrl}?voteFor=${currentPhoto.id}`;

  const currentTitle =
    selectedPhotoId === 'general' || !currentPhoto
      ? contestTitle
      : `${currentPhoto.title} (Artista: ${currentPhoto.photographer})`;

  // Generate QR Code dynamically
  useEffect(() => {
    if (!isOpen || !votingUrl) return;

    QRCode.toDataURL(
      votingUrl,
      {
        width: 600,
        margin: 2,
        color: {
          dark: '#020617', // slate-950
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, votingUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(votingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = votingUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const safeName = currentTitle.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
    link.download = `qrcode-votacao-${safeName}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[94vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col items-center overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shrink-0">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-center text-white mb-1">
          QR Code Automático de Votação
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 text-center max-w-sm mb-4">
          Aponte a câmera do celular para votar diretamente nesta exposição de arte.
        </p>

        {/* Target Selector (Geral vs Desenho Específico) */}
        {photos.length > 0 && (
          <div className="w-full mb-4">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
              Selecione o destino do QR Code:
            </label>
            <select
              value={selectedPhotoId}
              onChange={(e) => setSelectedPhotoId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
            >
              <option value="general">🌟 QR Code Geral (Todas as Obras da Exposição)</option>
              {photos.map((p, idx) => (
                <option key={p.id} value={p.id}>
                  #{idx + 1} - {p.title} (Artista: {p.photographer})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected target info badge */}
        <div className="mb-4 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold text-center flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-xs">{currentTitle}</span>
        </div>

        {/* QR Code Container */}
        <div className="relative p-5 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center border-4 border-amber-500/40">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code de Votação"
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-xl"
            />
          ) : (
            <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center text-slate-400">
              Gerando QR Code...
            </div>
          )}
          <div className="mt-2.5 flex items-center gap-1.5 text-slate-800 font-bold text-xs tracking-wider uppercase">
            <Smartphone className="w-3.5 h-3.5 text-amber-600" />
            Aponte a câmera do celular
          </div>
        </div>

        {/* 1 Vote badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Regulamento oficial: <strong>1 voto único por pessoa</strong></span>
        </div>

        {/* Link Input & Copy */}
        <div className="w-full mt-4">
          <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <input
              type="text"
              readOnly
              value={votingUrl}
              className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-slate-300 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          <button
            onClick={handleDownloadQr}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Baixar PNG
          </button>
          <a
            href={votingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold transition-colors shadow-lg shadow-amber-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Cédula
          </a>
        </div>
      </div>
    </div>
  );
};
