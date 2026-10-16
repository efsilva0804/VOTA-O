import React, { useState } from 'react';
import type { ContestData, PhotoEntry } from '../types/contest.ts';
import { getFallbackImageUrl } from '../utils/seedData.ts';
import {
  PlusCircle,
  Trash2,
  Settings,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  AlertTriangle,
  Image as ImageIcon,
  Sliders,
  ShieldCheck,
  Award,
  Upload,
  Download,
  FileSpreadsheet,
  HardDrive,
  RefreshCw,
  FolderArchive,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface AdminPanelProps {
  data: ContestData | null;
  onAddPhoto: (photo: {
    title: string;
    photographer: string;
    category: string;
    description: string;
    imageUrl: string;
    cameraInfo?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  onDeletePhoto: (id: string) => Promise<{ success: boolean }>;
  onUpdateSettings: (settings: Partial<ContestData['contest']>) => Promise<{ success: boolean }>;
  onResetVotes: () => Promise<{ success: boolean }>;
  onRestoreDemo: () => Promise<{ success: boolean }>;
  onSimulateVote: () => void;
  onOpenUploadModal?: () => void;
  onViewResults?: () => void;
  onRestoreBackup?: (backup: any) => Promise<{ success: boolean; message: string }>;
  onDownloadBackup?: () => void;
  onDownloadCsv?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  onAddPhoto,
  onDeletePhoto,
  onUpdateSettings,
  onResetVotes,
  onRestoreDemo,
  onSimulateVote,
  onOpenUploadModal,
  onViewResults,
  onRestoreBackup,
  onDownloadBackup,
  onDownloadCsv,
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'settings' | 'backup' | 'demo'>('photos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulatingLoop, setIsSimulatingLoop] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; success: boolean } | null>(null);
  const adminFileInputRef = React.useRef<HTMLInputElement>(null);

  // New photo form state
  const [title, setTitle] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [category, setCategory] = useState('Natureza & Paisagem');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cameraInfo, setCameraInfo] = useState('');
  const [formMsg, setFormMsg] = useState<{ text: string; success: boolean } | null>(null);

  // Contest settings form
  const contest = data?.contest;
  const [contestTitle, setContestTitle] = useState(contest?.title || '');
  const [subtitle, setSubtitle] = useState(contest?.subtitle || '');
  const [status, setStatus] = useState(contest?.status || 'active');
  const [allowRevote, setAllowRevote] = useState(contest?.allowRevote || false);
  const [prizeDescription, setPrizeDescription] = useState(contest?.prizeDescription || '');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const photos = data?.photos || [];

  // Toggle simulation loop
  const toggleContinuousSimulation = () => {
    if (isSimulatingLoop && simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
      setIsSimulatingLoop(false);
    } else {
      setIsSimulatingLoop(true);
      const timer = setInterval(() => {
        onSimulateVote();
      }, 1400);
      setSimulationInterval(timer);
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !photographer.trim() || !imageUrl.trim()) {
      setFormMsg({ text: 'Preencha os campos obrigatórios (Título, Fotógrafo e Imagem).', success: false });
      return;
    }

    setIsSubmitting(true);
    setFormMsg(null);
    try {
      const res = await onAddPhoto({
        title: title.trim(),
        photographer: photographer.trim(),
        category: category.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        cameraInfo: cameraInfo.trim() || undefined,
      });

      if (res.success) {
        setFormMsg({ text: 'Fotografia cadastrada com sucesso!', success: true });
        setTitle('');
        setPhotographer('');
        setDescription('');
        setImageUrl('');
        setCameraInfo('');
      } else {
        setFormMsg({ text: res.message || 'Erro ao cadastrar.', success: false });
      }
    } catch {
      setFormMsg({ text: 'Falha ao conectar com o servidor.', success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        title: contestTitle,
        subtitle,
        status,
        allowRevote,
        prizeDescription: '',
      });
      setSettingsMsg('Configurações salvas com sucesso!');
      setTimeout(() => setSettingsMsg(null), 3000);
    } catch {
      setSettingsMsg('Erro ao salvar configurações.');
    }
  };

  // Preset sample image helper
  const handlePickPreset = (presetUrl: string, sampleTitle: string, sampleCategory: string) => {
    setImageUrl(presetUrl);
    setTitle(sampleTitle);
    setCategory(sampleCategory);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-amber-400" />
            Painel do Organizador & Moderação
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie participantes, regras de 1 voto por pessoa, transmissão do telão e simulações ao vivo.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'photos'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gerenciar Desenhos ({photos.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Regras da Exposição
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resultados & Backup Local
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demo'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Simulação / Testes
          </button>

          {onOpenUploadModal && (
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all ml-1"
              title="Inserir imagens e gerar QR Codes automaticamente"
            >
              <Upload className="w-4 h-4" />
              Inserir Imagens & QR Code
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Desenhos */}
      {activeTab === 'photos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Drawing Form */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Cadastrar Novo Desenho
            </h3>

            {formMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  formMsg.success
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleCreatePhoto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Desenho *
                </label>
                <input
                  type="text"
                  placeholder="Ex: O Olhar de Nazaré"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Artista / Desenhista *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Clara"
                    value={photographer}
                    onChange={(e) => setPhotographer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Técnica / Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                  >
                    <option value="Aquarela & Nanquim">Aquarela & Nanquim</option>
                    <option value="Lápis de Cor & Pastel">Lápis de Cor & Pastel</option>
                    <option value="Grafite & Sombreado">Grafite & Sombreado</option>
                    <option value="Pontilhismo & Caneta">Pontilhismo & Caneta</option>
                    <option value="Giz Pastel & Douramento">Giz Pastel & Douramento</option>
                    <option value="Técnica Mista">Técnica Mista</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL da Imagem do Desenho (JPG, PNG, WebP) *
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none font-mono text-xs"
                  required
                />
                {/* Drawing Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-500">Exemplos rápidos:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handlePickPreset(
                        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
                        'Aura Celestial de Maria',
                        'Aquarela & Nanquim'
                      )
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 hover:bg-slate-700"
                  >
                    Aquarela
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePickPreset(
                        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
                        'Manto Sagrado em Grafite',
                        'Grafite & Sombreado'
                      )
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 hover:bg-slate-700"
                  >
                    Grafite
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handlePickPreset(
                        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
                        'Lírios de Nazaré',
                        'Lápis de Cor & Pastel'
                      )
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 hover:bg-slate-700"
                  >
                    Lápis de Cor
                  </button>
                </div>
              </div>

              {imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <img
                    src={imageUrl}
                    alt="Pré-visualização"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Técnica e Materiais do Desenho (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Papel Canson 300g · Lápis de Cor e Nanquim"
                  value={cameraInfo}
                  onChange={(e) => setCameraInfo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  História / Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve relato sobre a captura ou contexto da foto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? 'Cadastrando...' : 'Adicionar ao Concurso'}
              </button>
            </form>
          </div>

          {/* Current Photos List */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Fotografias no Concurso ({photos.length})</span>
              <span className="text-xs text-slate-400 font-normal">
                Ordenadas por classificação ao vivo
              </span>
            </h3>

            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-800"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = '1';
                          target.src = getFallbackImageUrl(p.id, p.imageUrl);
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                          #{p.rank}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {p.category}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white truncate">{p.title}</div>
                      <div className="text-xs text-slate-400 truncate">Por {p.photographer}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-amber-400 font-mono">
                        {p.votes} votos
                      </div>
                      <div className="text-[11px] text-slate-500">{p.percentage}%</div>
                    </div>

                    <button
                      onClick={() => onDeletePhoto(p.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir fotografia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Configurações do Concurso */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Configurações e Regras da Votação
          </h3>

          {settingsMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              {settingsMsg}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome do Concurso
              </label>
              <input
                type="text"
                value={contestTitle}
                onChange={(e) => setContestTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subtítulo / Tema
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            {/* Status do Concurso */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Status da Votação
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    status === 'active'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ● Aberta (Ao Vivo)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('paused')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    status === 'paused'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  ⏸ Pausada
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('closed')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    status === 'closed'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  🔒 Encerrada
                </button>
              </div>
            </div>

            {/* 1 Voto Policy Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Permitir ao participante trocar seu voto?
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Se desativado, o 1º voto computado é definitivo e bloqueado contra alterações.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAllowRevote(!allowRevote)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  allowRevote ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    allowRevote ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
            >
              Salvar Alterações
            </button>
          </form>

          {/* Danger zone / Reset */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Ações de Limpeza
            </h4>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente zerar todos os votos do concurso?')) {
                    onResetVotes();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-colors"
              >
                Zerar Todos os Votos
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Restaurar fotos e votos de demonstração originais?')) {
                    onRestoreDemo();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                Restaurar Fotos de Exemplo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for admin backup restore */}
      <input
        ref={adminFileInputRef}
        type="file"
        accept=".json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !onRestoreBackup) return;
          try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const res = await onRestoreBackup(parsed);
            setBackupMsg({ text: res.message, success: res.success });
          } catch (err: any) {
            setBackupMsg({ text: 'Falha ao restaurar backup: ' + (err?.message || 'erro no arquivo'), success: false });
          } finally {
            if (adminFileInputRef.current) adminFileInputRef.current.value = '';
            setTimeout(() => setBackupMsg(null), 6000);
          }
        }}
        className="hidden"
      />

      {/* TAB: Resultados & Backup Local (Continuar de Onde Parou) */}
      {activeTab === 'backup' && (
        <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-emerald-400" />
              Salvar Localmente os Votos & Continuar de Onde Parou
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Todos os votos, cadastros de obras e alterações são salvos automaticamente no servidor (disco) e no navegador. Você pode fechar o aplicativo ou pausar o evento a qualquer momento e continuar exatamente de onde parou.
            </p>
          </div>

          {backupMsg && (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm font-semibold ${
                backupMsg.success
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
              }`}
            >
              <span>{backupMsg.text}</span>
              <button onClick={() => setBackupMsg(null)} className="text-xs px-2 py-0.5 rounded bg-black/40">OK</button>
            </div>
          )}

          {/* Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Persistência em Disco
              </div>
              <div className="text-base font-black text-white font-mono">contest-state.json</div>
              <div className="text-[11px] text-emerald-400">Gravado automaticamente a cada voto</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Votos Computados
              </div>
              <div className="text-base font-black text-white font-mono">{data?.totalVotes || 0} votos</div>
              <div className="text-[11px] text-slate-400">{photos.length} desenhos no concurso</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Segurança dos Dados
              </div>
              <div className="text-base font-black text-white">100% Auditável</div>
              <div className="text-[11px] text-slate-400">Protegido contra reinicializações</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* View Official Results */}
            {onViewResults && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Award className="w-5 h-5" />
                    Exibir Resultados & Apuração Oficial
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Visualizar pódio, classificação geral detalhada com percentuais e imprimir ata oficial com assinaturas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onViewResults}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <Award className="w-4 h-4" />
                  Abrir Tela de Resultados
                </button>
              </div>
            )}

            {/* Download JSON Backup */}
            {onDownloadBackup && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Download className="w-5 h-5" />
                    Salvar Backup Completo (JSON)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Baixar arquivo compactado com todas as fotos cadastradas, votos, eleitores e configurações do concurso.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadBackup}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo de Backup
                </button>
              </div>
            )}

            {/* Restore / Resume from where it stopped */}
            {onRestoreBackup && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Upload className="w-5 h-5" />
                    Importar Backup / Continuar de Onde Parou
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Subir arquivo JSON de backup salvo anteriormente para restaurar a votação e retomar sem perdas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => adminFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo de Backup (JSON)
                </button>
              </div>
            )}

            {/* Download CSV */}
            {onDownloadCsv && (
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                    Exportar Planilha de Votos (CSV)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Planilha compatível com Excel e Google Sheets para auditoria minuciosa e arquivo permanente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onDownloadCsv}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Baixar Planilha de Votos (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Simulação e Teste de Telão */}
      {activeTab === 'demo' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Simulação de Votos em Tempo Real
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ideal para testar o telão durante ensaios ou demonstrações, assistindo ao ranking se reorganizar dinamicamente diante da plateia.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-white">Disparar Voto Único</div>
                <div className="text-xs text-slate-400">Gera 1 voto com nome fictício instantâneo</div>
              </div>
              <button
                onClick={onSimulateVote}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 transition-colors"
              >
                +1 Voto de Teste
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-white">Votação Contínua em Massa</div>
                <div className="text-xs text-slate-400">Emite votos a cada 1.4s para animar o telão</div>
              </div>
              <button
                onClick={toggleContinuousSimulation}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  isSimulatingLoop
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                }`}
              >
                {isSimulatingLoop ? 'Parar Simulação' : 'Iniciar Votos em Massa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
