import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { PhotoEntry } from '../types/contest.ts';
import {
  Upload,
  QrCode,
  Check,
  Copy,
  Download,
  X,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Printer,
  ExternalLink,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  ArrowRight,
  Eye
} from 'lucide-react';
import { compressImageFile } from '../utils/imageOptimizer.ts';

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoEntry[];
  onUpdatePhoto: (id: string, updates: Partial<PhotoEntry>) => Promise<{ success: boolean }>;
  onAddPhoto: (photo: {
    title: string;
    photographer: string;
    category: string;
    description: string;
    imageUrl: string;
    cameraInfo?: string;
  }) => Promise<{ success: boolean; photo?: PhotoEntry }>;
  initialTargetPhotoId?: string | null;
}

interface ArtworkSlotState {
  id: string;
  title: string;
  photographer: string;
  category: string;
  imageUrl: string;
  qrCodeUrl: string;
  votingUrl: string;
  isSaving?: boolean;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  photos,
  onUpdatePhoto,
  onAddPhoto,
  initialTargetPhotoId = null,
}) => {
  const [activeTab, setActiveTab] = useState<'slots' | 'bulk' | 'labels'>('slots');
  const [slots, setSlots] = useState<ArtworkSlotState[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // New artwork form state (if adding extra artwork)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState('Arte em Desenho');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Per-slot URL input temp storage
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(initialTargetPhotoId);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Synchronize slots with photos and generate QR codes
  useEffect(() => {
    if (!isOpen || !baseUrl) return;

    let isMounted = true;

    const generateAllQrs = async () => {
      const generatedSlots: ArtworkSlotState[] = await Promise.all(
        photos.map(async (photo) => {
          const votingUrl = `${baseUrl}?voteFor=${photo.id}`;
          const qrCodeUrl = await QRCode.toDataURL(votingUrl, {
            width: 400,
            margin: 2,
            color: { dark: '#020617', light: '#ffffff' },
            errorCorrectionLevel: 'H',
          });

          return {
            id: photo.id,
            title: photo.title,
            photographer: photo.photographer,
            category: photo.category,
            imageUrl: photo.imageUrl,
            qrCodeUrl,
            votingUrl,
          };
        })
      );

      if (isMounted) {
        setSlots(generatedSlots);
        if (initialTargetPhotoId) {
          setActiveSlotId(initialTargetPhotoId);
        }
      }
    };

    generateAllQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, baseUrl, photos, initialTargetPhotoId]);

  if (!isOpen) return null;

  // Helper to read file to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Upload image for a specific slot
  const handleSlotFileUpload = async (slotId: string, file: File) => {
    if (!file) return;

    try {
      const optimizedBase64 = await compressImageFile(file, 1280, 0.85);
      await onUpdatePhoto(slotId, { imageUrl: optimizedBase64 });

      // Update slot state immediately
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, imageUrl: optimizedBase64 } : s))
      );

      setStatusMessage(`Imagem da obra otimizada e atualizada com sucesso! QR Code pronto.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar e otimizar arquivo de imagem.');
    }
  };

  // Apply URL to a specific slot
  const handleApplyUrl = async (slotId: string) => {
    const url = urlInputs[slotId]?.trim();
    if (!url) return;

    await onUpdatePhoto(slotId, { imageUrl: url });
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, imageUrl: url } : s))
    );
    setUrlInputs((prev) => ({ ...prev, [slotId]: '' }));

    setStatusMessage(`Link da imagem aplicado e QR Code atualizado!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Update title or artist for a slot
  const handleUpdateDetails = async (slotId: string, updates: Partial<PhotoEntry>) => {
    await onUpdatePhoto(slotId, updates);
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, ...updates } : s))
    );
    setStatusMessage(`Dados do desenho salvos com sucesso!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Bulk Upload (Drag and drop multiple files)
  const handleBulkUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingBulk(true);
    setStatusMessage('Processando imagens e vinculando aos QR Codes...');

    const fileList = Array.from(files);

    for (const file of fileList) {
      const optimizedBase64 = await compressImageFile(file, 1280, 0.85);
      const lower = file.name.toLowerCase();

      // Check if file name matches 01, 02, 03, 04, 05
      let targetSlot: ArtworkSlotState | undefined;
      if (lower.includes('01') || lower.includes('1')) targetSlot = slots[0];
      else if (lower.includes('02') || lower.includes('2')) targetSlot = slots[1];
      else if (lower.includes('03') || lower.includes('3')) targetSlot = slots[2];
      else if (lower.includes('04') || lower.includes('4')) targetSlot = slots[3];
      else if (lower.includes('05') || lower.includes('5')) targetSlot = slots[4];

      if (targetSlot) {
        await onUpdatePhoto(targetSlot.id, { imageUrl: optimizedBase64 });
      } else {
        // Create new entry
        const cleanName = file.name.replace(/\.[^/.]+$/, '').trim();
        await onAddPhoto({
          title: `Desenho de Nossa Senhora (${cleanName})`,
          photographer: 'Artista Participante',
          category: 'Arte em Desenho',
          description: 'Obra inserida para votação na Exposição de Arte em Desenho de Nossa Senhora de Nazaré.',
          imageUrl: optimizedBase64,
          cameraInfo: 'Técnica sobre papel',
        });
      }
    }

    setIsProcessingBulk(false);
    setStatusMessage('Todas as imagens foram vinculadas e os QR Codes foram gerados automaticamente!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Add new photo manually
  const handleCreateNewArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim() || !newImageUrl.trim()) {
      alert('Por favor, preencha o título, nome do artista e a imagem (ou faça upload).');
      return;
    }

    const res = await onAddPhoto({
      title: newTitle.trim(),
      photographer: newArtist.trim(),
      category: newCategory.trim() || 'Arte em Desenho',
      description: 'Obra participante da Exposição de Arte em Desenho de Nossa Senhora de Nazaré.',
      imageUrl: newImageUrl.trim(),
      cameraInfo: 'Desenho sobre papel',
    });

    if (res.success) {
      setNewTitle('');
      setNewArtist('');
      setNewImageUrl('');
      setShowAddForm(false);
      setStatusMessage('Novo desenho adicionado! QR Code gerado automaticamente.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleCopyLink = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleDownloadQr = (qrUrl: string, title: string) => {
    const a = document.createElement('a');
    const safe = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40);
    a.download = `qrcode-desenho-${safe}.png`;
    a.href = qrUrl;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl max-h-[95vh] bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col justify-between overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Inserção de Imagens & Geração Automática de QR Code
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Painel de Obras & QR Codes Automáticos
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className="my-2.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {statusMessage}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 my-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'slots'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Gerenciar Obras ({slots.length})
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'bulk'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload em Lote (01 a 05)
            </button>

            <button
              onClick={() => setActiveTab('labels')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                activeTab === 'labels'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              Etiquetas para Impressão
            </button>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Novo Desenho
          </button>
        </div>

        {/* Collapsible New Artwork Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateNewArtwork}
            className="my-3 p-4 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-3 animate-in fade-in"
          >
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Cadastrar Novo Desenho no Concurso
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Título do Desenho</label>
                <input
                  type="text"
                  placeholder="Ex: Manto de Nazaré em Luz"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Nome do Artista / Desenhista</label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Técnica / Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Lápis de Cor / Nanquim"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Cole a URL da imagem ou use o botão ao lado"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
              <label className="cursor-pointer px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                Carregar Arquivo
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const b64 = await readFileAsBase64(f);
                      setNewImageUrl(b64);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
              >
                Salvar & Gerar QR Code
              </button>
            </div>
          </form>
        )}

        {/* TAB 1: SLOTS & INDIVIDUAL QR CODES */}
        {activeTab === 'slots' && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[58vh]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {slots.map((slot, idx) => {
                const isSelected = activeSlotId === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Artwork Image & Replace button */}
                      <div className="relative w-28 sm:w-32 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 group">
                        <img
                          src={slot.imageUrl}
                          alt={slot.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-slate-950/90 text-amber-400 font-black text-xs">
                          Obra #{idx + 1}
                        </div>

                        {/* Quick Replace Overlay */}
                        <label className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer p-2 text-center text-white">
                          <Upload className="w-5 h-5 text-amber-400 mb-1" />
                          <span className="text-[11px] font-bold">Trocar Foto</span>
                          <span className="text-[9px] text-slate-400">Clique para escolher</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleSlotFileUpload(slot.id, f);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Live Auto-generated QR Code */}
                      <div className="relative shrink-0 flex flex-col items-center">
                        <img
                          src={slot.qrCodeUrl}
                          alt={`QR Code ${slot.title}`}
                          className="w-28 sm:w-32 h-28 sm:h-32 bg-white p-1.5 rounded-xl shadow border border-slate-700 object-contain"
                        />
                        <span className="text-[10px] text-emerald-400 font-bold uppercase mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> QR Code Ativo
                        </span>
                      </div>

                      {/* Details & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between h-36">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
                              {slot.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                            Artista: <span className="text-amber-400">{slot.photographer}</span>
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
                            {slot.category}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <button
                            onClick={() => handleDownloadQr(slot.qrCodeUrl, slot.title)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow"
                            title="Baixar QR Code como imagem PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Baixar QR
                          </button>

                          <button
                            onClick={() => handleCopyLink(slot.votingUrl, slot.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                            title="Copiar link direto de votação"
                          >
                            {copiedId === slot.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-300" />
                            )}
                            {copiedId === slot.id ? 'Copiado!' : 'Link'}
                          </button>

                          <a
                            href={slot.votingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                            title="Abrir e testar cédula de voto"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls for Slot (File picker & URL input) */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          Escolher Arquivo do Computador/Celular
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleSlotFileUpload(slot.id, f);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Paste URL */}
                      <div className="flex items-center gap-1 flex-1 max-w-xs">
                        <input
                          type="text"
                          placeholder="Ou colar URL da imagem..."
                          value={urlInputs[slot.id] || ''}
                          onChange={(e) =>
                            setUrlInputs((prev) => ({ ...prev, [slot.id]: e.target.value }))
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() => handleApplyUrl(slot.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BULK UPLOAD */}
        {activeTab === 'bulk' && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[58vh]">
            <div className="relative p-8 rounded-3xl border-2 border-dashed border-amber-500/60 bg-amber-500/5 hover:bg-amber-500/10 text-center transition-all cursor-pointer group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleBulkUpload(e.target.files)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isProcessingBulk ? 'Processando e Gerando QR Codes...' : 'Solte as fotos dos 5 desenhos aqui'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                Você pode selecionar os 5 arquivos de uma vez só (<strong className="text-amber-400">01.jpeg a 05.jpeg</strong>). O aplicativo atualiza as obras e gera os QR Codes automaticamente!
              </p>
              <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20">
                <Camera className="w-4 h-4" />
                Selecionar Múltiplos Arquivos
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Como funciona a identificação automática:
              </div>
              <div>• Arquivo contendo <strong>01</strong> atualiza o <strong>Desenho #1</strong></div>
              <div>• Arquivo contendo <strong>02</strong> atualiza o <strong>Desenho #2</strong></div>
              <div>• Arquivo contendo <strong>03</strong> atualiza o <strong>Desenho #3</strong></div>
              <div>• Arquivo contendo <strong>04</strong> atualiza o <strong>Desenho #4</strong></div>
              <div>• Arquivo contendo <strong>05</strong> atualiza o <strong>Desenho #5</strong></div>
            </div>
          </div>
        )}

        {/* TAB 3: PRINTABLE EXHIBITION LABELS */}
        {activeTab === 'labels' && (
          <div className="flex-1 overflow-y-auto space-y-4 my-2 pr-1 max-h-[58vh]">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">Etiquetas de Exposição para Impressão</h4>
                <p className="text-xs text-slate-400">
                  Prontas para imprimir, recortar e fixar ao lado de cada desenho na exposição.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow"
              >
                <Printer className="w-4 h-4" />
                Imprimir Todas as Etiquetas
              </button>
            </div>

            {/* Printable Label Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {slots.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-white text-slate-950 rounded-2xl shadow border-2 border-slate-300 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[10px] font-black uppercase">
                      Obra #{idx + 1}
                    </span>
                    <h5 className="font-extrabold text-sm text-slate-950 leading-tight">
                      {item.title}
                    </h5>
                    <p className="text-xs text-slate-700 font-semibold">
                      Artista: {item.photographer}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Técnica: {item.category}
                    </p>
                    <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider pt-1">
                      Aponte a câmera para votar nesta obra
                    </div>
                  </div>

                  <img
                    src={item.qrCodeUrl}
                    alt={`QR Code ${item.title}`}
                    className="w-24 h-24 p-1 bg-white border border-slate-300 rounded-xl shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Regra do Concurso: <strong>1 voto único por pessoa</strong> com atualização em tempo real no telão.
          </div>
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
