import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import type { ContestData, PhotoEntry } from '../types/contest.ts';
import { getFallbackImageUrl } from '../utils/seedData.ts';
import { compressImageFile } from '../utils/imageOptimizer.ts';
import {
  Settings,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  LogIn,
  LogOut,
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  Edit3,
  Check,
  AlertTriangle,
  Upload,
  Download,
  RefreshCw,
  FileSpreadsheet,
  HardDrive,
  Sparkles,
  CheckCircle2,
  QrCode,
  Play,
  Pause,
  Printer,
  RotateCcw,
  ArrowRight,
  X,
  Layers,
  HelpCircle,
  Save,
  CheckCircle,
  FileText
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
  onUpdatePhoto?: (id: string, updates: Partial<PhotoEntry>) => Promise<{ success: boolean; photo?: PhotoEntry; message?: string }>;
  onUpdateSettings: (settings: Partial<ContestData['contest']>) => Promise<{ success: boolean }>;
  onResetVotes: () => Promise<{ success: boolean }>;
  onRestoreDemo: () => Promise<{ success: boolean }>;
  onSimulateVote: () => void;
  onViewResults?: () => void;
  onRestoreBackup?: (backup: any) => Promise<{ success: boolean; message: string }>;
  onDownloadBackup?: () => void;
  onDownloadCsv?: () => void;
  onBackToGallery?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  data,
  onAddPhoto,
  onDeletePhoto,
  onUpdatePhoto,
  onUpdateSettings,
  onResetVotes,
  onRestoreDemo,
  onSimulateVote,
  onViewResults,
  onRestoreBackup,
  onDownloadBackup,
  onDownloadCsv,
  onBackToGallery,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nazare_admin_auth');
        return stored === 'eniofds';
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active view tab inside settings
  const [activeTab, setActiveTab] = useState<'manage-images' | 'insert-images' | 'settings' | 'backup'>('manage-images');

  // Sub-tabs for insertion
  const [insertMode, setInsertMode] = useState<'single' | 'bulk'>('single');

  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newPhotographer, setNewPhotographer] = useState('');
  const [newCategory, setNewCategory] = useState('Lápis de Cor & Grafite');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCameraInfo, setNewCameraInfo] = useState('');
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk insertion state
  const [bulkFiles, setBulkFiles] = useState<{ id: string; file: File; preview: string; title: string; author: string }[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ text: string; success: boolean } | null>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Existing image editing state
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPhotographer, setEditPhotographer] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editCameraInfo, setEditCameraInfo] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editMsg, setEditMsg] = useState<{ [photoId: string]: { text: string; success: boolean } }>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);

  // Contest settings form
  const contest = data?.contest;
  const [contestTitle, setContestTitle] = useState(contest?.title || '');
  const [subtitle, setSubtitle] = useState(contest?.subtitle || '');
  const [status, setStatus] = useState(contest?.status || 'active');
  const [allowRevote, setAllowRevote] = useState(contest?.allowRevote || false);
  const [prizeDescription, setPrizeDescription] = useState(contest?.prizeDescription || '');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // Simulation & backup
  const [isSimulatingLoop, setIsSimulatingLoop] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; success: boolean } | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // QR Modal inside admin
  const [qrModalPhoto, setQrModalPhoto] = useState<PhotoEntry | null>(null);
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null);

  const photos = data?.photos || [];

  // Sync contest settings if loaded later
  useEffect(() => {
    if (contest) {
      setContestTitle(contest.title || '');
      setSubtitle(contest.subtitle || '');
      setStatus(contest.status || 'active');
      setAllowRevote(contest.allowRevote || false);
      setPrizeDescription(contest.prizeDescription || '');
    }
  }, [contest]);

  useEffect(() => {
    setLastSavedTime(new Date().toLocaleTimeString('pt-BR'));
  }, [data]);

  const handleToggleStatus = async () => {
    if (!onUpdateSettings || !contest) return;
    setIsUpdatingStatus(true);
    try {
      const nextStatus = contest.status === 'active' ? 'paused' : 'active';
      await onUpdateSettings({ status: nextStatus });
      setStatus(nextStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePrintReport = () => {
    if (onViewResults) {
      onViewResults();
      setTimeout(() => window.print(), 350);
    } else {
      window.print();
    }
  };

  // Handle Login Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const userClean = loginUsername.trim();
    const passClean = loginPassword;

    // Call server login endpoint for authentication
    try {
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userClean, password: passClean }),
      }).catch(() => {
        // offline / Vercel fallback
      });
    } catch {
      // ignore
    }

    // Strict credential verification: login: eniofds e senha: M@nu0412
    if (userClean === 'eniofds' && passClean === 'M@nu0412') {
      try {
        localStorage.setItem('nazare_admin_auth', 'eniofds');
      } catch {
        // ignore
      }
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Usuário ou senha incorretos. Acesso restrito aos organizadores credenciados.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('nazare_admin_auth');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError(null);
  };

  // Start editing a photo
  const handleStartEdit = (photo: PhotoEntry) => {
    setEditingPhotoId(photo.id);
    setEditTitle(photo.title);
    setEditPhotographer(photo.photographer);
    setEditCategory(photo.category);
    setEditDescription(photo.description || '');
    setEditImageUrl(photo.imageUrl);
    setEditCameraInfo(photo.cameraInfo || '');
    setEditImagePreview(null);
  };

  // Replace photo image via file picker with auto compression
  const handleReplaceFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingPhotoId) return;

    try {
      const compressed = await compressImageFile(file, 1280, 0.85);
      setEditImageUrl(compressed);
      setEditImagePreview(compressed);

      if (onUpdatePhoto) {
        setIsSavingEdit(true);
        const res = await onUpdatePhoto(replacingPhotoId, { imageUrl: compressed });
        if (res.success) {
          setEditMsg((prev) => ({
            ...prev,
            [replacingPhotoId]: { text: 'Imagem substituída e salva com sucesso!', success: true },
          }));
          setTimeout(() => {
            setEditMsg((prev) => {
              const cp = { ...prev };
              delete cp[replacingPhotoId];
              return cp;
            });
          }, 3500);
        }
        setIsSavingEdit(false);
      }
    } catch (err) {
      console.error('Error compressing replaced image:', err);
      alert('Erro ao processar imagem. Escolha outro arquivo JPG ou PNG.');
    } finally {
      if (e.target) e.target.value = '';
      setReplacingPhotoId(null);
    }
  };

  // Save full edits for a photo
  const handleSavePhotoEdit = async (photoId: string) => {
    if (!onUpdatePhoto) return;
    setIsSavingEdit(true);
    try {
      const res = await onUpdatePhoto(photoId, {
        title: editTitle.trim(),
        photographer: editPhotographer.trim(),
        category: editCategory.trim(),
        description: editDescription.trim(),
        imageUrl: editImageUrl.trim(),
        cameraInfo: editCameraInfo.trim() || undefined,
      });

      if (res.success) {
        setEditMsg((prev) => ({
          ...prev,
          [photoId]: { text: 'Desenho atualizado com sucesso!', success: true },
        }));
        setEditingPhotoId(null);
        setTimeout(() => {
          setEditMsg((prev) => {
            const cp = { ...prev };
            delete cp[photoId];
            return cp;
          });
        }, 3500);
      } else {
        setEditMsg((prev) => ({
          ...prev,
          [photoId]: { text: res.message || 'Falha ao salvar.', success: false },
        }));
      }
    } catch {
      setEditMsg((prev) => ({
        ...prev,
        [photoId]: { text: 'Erro ao conectar ao servidor.', success: false },
      }));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle single photo file selection with auto compression
  const handleSingleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 1280, 0.85);
      setNewImageUrl(compressed);
      setNewImagePreview(compressed);
      if (!newTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('Erro ao carregar imagem. Tente outro arquivo JPG ou PNG.');
    }
  };

  // Create single new photo
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPhotographer.trim() || !newImageUrl.trim()) {
      setFormMsg({ text: 'Preencha os campos obrigatórios (Título, Artista e Imagem).', success: false });
      return;
    }

    setIsSubmittingNew(true);
    setFormMsg(null);
    try {
      const res = await onAddPhoto({
        title: newTitle.trim(),
        photographer: newPhotographer.trim(),
        category: newCategory.trim(),
        description: newDescription.trim(),
        imageUrl: newImageUrl.trim(),
        cameraInfo: newCameraInfo.trim() || undefined,
      });

      if (res.success) {
        setFormMsg({ text: 'Desenho inserido no concurso com sucesso!', success: true });
        setNewTitle('');
        setNewPhotographer('');
        setNewDescription('');
        setNewImageUrl('');
        setNewCameraInfo('');
        setNewImagePreview(null);
        setTimeout(() => setFormMsg(null), 4000);
      } else {
        setFormMsg({ text: res.message || 'Erro ao cadastrar.', success: false });
      }
    } catch {
      setFormMsg({ text: 'Falha ao conectar com o servidor.', success: false });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Bulk files selected
  const handleBulkFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingBulk(true);
    setBulkMsg(null);

    const newEntries: { id: string; file: File; preview: string; title: string; author: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const compressed = await compressImageFile(file, 1280, 0.85);
        const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        newEntries.push({
          id: 'bulk-' + Date.now() + '-' + i,
          file,
          preview: compressed,
          title: autoTitle.charAt(0).toUpperCase() + autoTitle.slice(1),
          author: `Candidato ${photos.length + i + 1}`,
        });
      } catch (err) {
        console.error('Error compressing bulk file:', err);
      }
    }

    setBulkFiles(newEntries);
    setIsProcessingBulk(false);
  };

  // Submit all bulk drawings
  const handleSubmitBulk = async () => {
    if (bulkFiles.length === 0) return;
    setIsProcessingBulk(true);
    setBulkMsg(null);

    let addedCount = 0;
    for (const item of bulkFiles) {
      try {
        await onAddPhoto({
          title: item.title.trim() || `Desenho ${photos.length + addedCount + 1}`,
          photographer: item.author.trim() || 'Artista Participante',
          category: 'Lápis de Cor & Grafite',
          description: 'Obra participante da Exposição de Desenhos de Nazaré.',
          imageUrl: item.preview,
          cameraInfo: 'Obra inscrita na exposição',
        });
        addedCount++;
      } catch (err) {
        console.error('Failed to add bulk photo:', err);
      }
    }

    setBulkFiles([]);
    setIsProcessingBulk(false);
    setBulkMsg({
      text: `${addedCount} novos desenhos foram inseridos com sucesso no concurso!`,
      success: true,
    });
    setTimeout(() => setBulkMsg(null), 5000);
  };

  // Save Contest Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        title: contestTitle.trim(),
        subtitle: subtitle.trim(),
        status,
        allowRevote,
        prizeDescription: prizeDescription.trim(),
      });
      setSettingsMsg('Configurações salvas e aplicadas em tempo real!');
      setTimeout(() => setSettingsMsg(null), 3500);
    } catch {
      setSettingsMsg('Erro ao salvar configurações.');
    }
  };

  // Generate QR Code for a photo
  const handleShowQrCode = (photo: PhotoEntry) => {
    setQrModalPhoto(photo);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const voteUrl = `${origin}?voteFor=${photo.id}`;
    QRCode.toDataURL(
      voteUrl,
      {
        width: 320,
        margin: 1,
        color: { dark: '#020617', light: '#ffffff' },
      },
      (err, url) => {
        if (!err && url) {
          setGeneratedQrUrl(url);
        }
      }
    );
  };

  // Toggle continuous test simulation
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

  // Handle backup import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreBackup) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await onRestoreBackup(json);
        setBackupMsg({ text: res.message, success: res.success });
        setTimeout(() => setBackupMsg(null), 5000);
      } catch {
        setBackupMsg({ text: 'Arquivo de backup corrompido ou inválido.', success: false });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // ==========================================
  // VIEW 1: AUTHENTICATION GATE (LOGIN SCREEN)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
          {/* Decorative glowing gradient */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon and Header */}
          <div className="text-center space-y-3 mb-6 relative z-10">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
                Área Restrita à Organização
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                Configurações & Imagens
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Acesso exclusivo para alterar desenhos, inserir novas imagens e definir regras da votação.
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Usuário / Login
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Digite o login de acesso"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Senha de Segurança
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite a senha"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'Verificando...' : 'Entrar nas Configurações'}</span>
            </button>

            {onBackToGallery && (
              <button
                type="button"
                onClick={onBackToGallery}
                className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white transition-colors"
              >
                ← Voltar para Galeria de Votação
              </button>
            )}
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500/60" />
              <span>Sessão protegida por token seguro da coordenação.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // VIEW 2: AUTHENTICATED ADMIN & CONFIGURATION CENTER
  // ==============================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Hidden file input for quick image replacement */}
      <input
        type="file"
        ref={replaceFileInputRef}
        onChange={handleReplaceFileSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Top Header & User Session Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
              Acesso Autorizado
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-amber-400" />
            Página de Configurações & Gestão de Imagens
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Altere imagens de obras existentes, cadastre novos desenhos, configure o regulamento da votação e realize backups.
          </p>
        </div>

        {/* User identification badge and Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Usuário:</span>
            <span className="font-mono font-bold text-white">eniofds</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all"
            title="Encerrar sessão de administrador"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={adminFileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Backup feedback message */}
      {backupMsg && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in ${
            backupMsg.success
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {backupMsg.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-semibold">{backupMsg.text}</span>
          </div>
          <button
            onClick={() => setBackupMsg(null)}
            className="text-xs px-2.5 py-1 rounded bg-black/30 hover:bg-black/50"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Painel de Controle de Apuração & Exportação (Migrado para Configurações) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Salvo Localmente & em Disco
            </span>
            <span className="text-xs text-slate-400">
              Última sincronização: <span className="text-slate-200 font-mono">{lastSavedTime || 'Automática'}</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Controle de Apuração & Exportação dos Votos
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {contest?.title || 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ'} • Todas as alterações e votos são gravados automaticamente para você poder pausar e continuar exatamente de onde parou.
          </p>
        </div>

        {/* Action Buttons Toolbar (Pausar Votação, Salvar Backup, Importar Backup, Planilha CSV, Imprimir Relatório) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pause / Resume Voting */}
          {contest && (
            <button
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                contest.status === 'active'
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
              }`}
              title={contest.status === 'active' ? 'Suspender temporariamente a votação' : 'Retomar a votação de onde parou'}
            >
              {contest.status === 'active' ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar Votação</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Retomar Votação</span>
                </>
              )}
            </button>
          )}

          {/* Download JSON Backup */}
          {onDownloadBackup && (
            <button
              onClick={onDownloadBackup}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors shadow-sm"
              title="Baixar arquivo JSON com todos os votos e configurações salvos"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Backup (JSON)</span>
            </button>
          )}

          {/* Restore / Continue from where it stopped */}
          {onRestoreBackup && (
            <button
              onClick={() => adminFileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors shadow-sm"
              title="Carregar arquivo JSON de backup para continuar de onde parou"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importar Backup</span>
            </button>
          )}

          {/* Download CSV */}
          {onDownloadCsv && (
            <button
              onClick={onDownloadCsv}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors shadow-sm"
              title="Exportar planilha de conferência para Excel ou Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Planilha (CSV)</span>
            </button>
          )}

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            title="Imprimir relatório oficial e ata com assinaturas"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setActiveTab('manage-images')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'manage-images'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Mudar Imagens ({photos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('insert-images')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'insert-images'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Inserir Novas Imagens</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações da Votação</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'backup'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backup & Auditoria</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MUDAR IMAGENS EXISTENTES                           */}
      {/* ========================================================= */}
      {activeTab === 'manage-images' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Catálogo de Obras Concorrentes ({photos.length} desenhos)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Para trocar qualquer imagem, clique em <strong>"Substituir Imagem"</strong> para enviar uma foto do seu celular/computador ou digitar um novo link. As alterações são salvas na hora.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('insert-images')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Inserir Mais Imagens</span>
            </button>
          </div>

          {/* Grid of drawings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => {
              const isEditingThis = editingPhotoId === photo.id;
              const feedbackMsg = editMsg[photo.id];

              return (
                <div
                  key={photo.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
                >
                  {/* Photo Thumbnail with Overlays */}
                  <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden group">
                    <img
                      src={isEditingThis && editImagePreview ? editImagePreview : photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback) {
                          target.dataset.triedFallback = '1';
                          target.src = getFallbackImageUrl(photo.id, photo.imageUrl);
                        }
                      }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/30 pointer-events-none" />

                    {/* Rank & Votes Badge */}
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow">
                        #{photo.rank || index + 1}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-slate-800 shadow">
                        {photo.votes} {photo.votes === 1 ? 'voto' : 'votos'} ({photo.percentage}%)
                      </span>
                    </div>

                    {/* Category */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-slate-800 shadow">
                        {photo.category}
                      </span>
                    </div>

                    {/* Fast Change Image Button hovering over picture */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingPhotoId(photo.id);
                          replaceFileInputRef.current?.click();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-black/60 transition-transform active:scale-95"
                        title="Enviar nova imagem para este desenho"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Mudar Imagem</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Message */}
                  {feedbackMsg && (
                    <div
                      className={`p-2.5 mx-4 mt-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        feedbackMsg.success
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{feedbackMsg.text}</span>
                    </div>
                  )}

                  {/* Card Content & Edit Form */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {isEditingThis ? (
                      /* Inline Full Edit Form */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Título da Obra
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Artista / Desenhista
                          </label>
                          <input
                            type="text"
                            value={editPhotographer}
                            onChange={(e) => setEditPhotographer(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Categoria / Técnica
                          </label>
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            URL da Imagem ou Base64
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editImageUrl}
                              onChange={(e) => {
                                setEditImageUrl(e.target.value);
                                setEditImagePreview(e.target.value);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:border-amber-500 outline-none truncate"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setReplacingPhotoId(photo.id);
                                replaceFileInputRef.current?.click();
                              }}
                              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 shrink-0"
                              title="Selecionar arquivo do dispositivo"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-1">
                            Descrição da Obra
                          </label>
                          <textarea
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-500 outline-none resize-none"
                          />
                        </div>

                        {/* Save / Cancel buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleSavePhotoEdit(photo.id)}
                            disabled={isSavingEdit}
                            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read-Only Details */
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-bold text-base text-white line-clamp-1">
                            {photo.title}
                          </h4>
                          <p className="text-xs text-amber-400 font-medium">
                            Por: <span className="text-slate-200">{photo.photographer}</span>
                          </p>
                        </div>

                        {photo.description && (
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {photo.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Toolbar */}
                    {!isEditingThis && (
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Replace File Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setReplacingPhotoId(photo.id);
                              replaceFileInputRef.current?.click();
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                            title="Trocar arquivo da imagem"
                          >
                            <Upload className="w-3 h-3 text-amber-400" />
                            <span>Trocar Foto</span>
                          </button>

                          {/* Edit Text Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(photo)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                            title="Editar título, autor e descrição"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Editar</span>
                          </button>

                          {/* QR Code Button */}
                          <button
                            type="button"
                            onClick={() => handleShowQrCode(photo)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                            title="Ver e baixar QR Code deste desenho"
                          >
                            <QrCode className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </div>

                        {/* Delete Photo Button */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Tem certeza que deseja excluir a obra "${photo.title}"?`)) {
                              await onDeletePhoto(photo.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Excluir desenho do concurso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: INSERIR NOVAS IMAGENS                              */}
      {/* ========================================================= */}
      {activeTab === 'insert-images' && (
        <div className="space-y-6">
          {/* Sub-mode selector */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setInsertMode('single')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                insertMode === 'single'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Inserção Individual
            </button>
            <button
              onClick={() => setInsertMode('bulk')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                insertMode === 'bulk'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Inserção em Lote (Vários Arquivos)
            </button>
          </div>

          {/* Sub-mode 1: Single Photo Insert */}
          {insertMode === 'single' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  Cadastrar Novo Desenho no Concurso
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione o arquivo da imagem direto do seu celular ou computador. A imagem será otimizada automaticamente com compressão de alta qualidade para carregar rápido na Vercel e em todos os dispositivos.
                </p>
              </div>

              {formMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                    formMsg.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{formMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreatePhoto} className="space-y-5">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Arquivo da Imagem do Desenho *
                  </label>

                  <input
                    type="file"
                    ref={singleFileInputRef}
                    onChange={handleSingleFileSelect}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />

                  {newImagePreview ? (
                    <div className="relative aspect-video max-h-72 w-full rounded-2xl overflow-hidden border border-amber-500/40 bg-slate-950 flex items-center justify-center group">
                      <img
                        src={newImagePreview}
                        alt="Pré-visualização"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => singleFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Trocar Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewImagePreview(null);
                            setNewImageUrl('');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remover</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => singleFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/50 flex flex-col items-center justify-center space-y-3 group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                          Clique aqui para selecionar uma foto do seu computador ou celular
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Formatos recomendados: JPG, PNG, WebP (compressão automática inclusa)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Or Image URL Input */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Ou cole um link direto:</span>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/desenho.jpg"
                        value={newImageUrl.startsWith('data:image/') ? '' : newImageUrl}
                        onChange={(e) => {
                          setNewImageUrl(e.target.value);
                          setNewImagePreview(e.target.value);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Título do Desenho / Nome da Obra *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mãe da Esperança e Círio Fluvial"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Nome do Artista / Aluno Participante *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Candidato 06 - 9º Ano"
                      value={newPhotographer}
                      onChange={(e) => setNewPhotographer(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Categoria / Técnica Artística
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                    >
                      <option value="Lápis de Cor & Grafite">Lápis de Cor & Grafite</option>
                      <option value="Lápis de Cor & Nanquim">Lápis de Cor & Nanquim</option>
                      <option value="Grafite Clássico Sombreado">Grafite Clássico Sombreado</option>
                      <option value="Ilustração & Moldura Barroca">Ilustração & Moldura Barroca</option>
                      <option value="Grafite sobre Papel">Grafite sobre Papel</option>
                      <option value="Aquarela & Nanquim">Aquarela & Nanquim</option>
                      <option value="Giz Pastel & Douramento">Giz Pastel & Douramento</option>
                      <option value="Técnica Mista">Técnica Mista</option>
                      <option value="Arte Sacra Geral">Arte Sacra Geral</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Materiais / Informações Técnicas
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Papel Canson 200g, caneta nanquim e lápis aquarelável"
                      value={newCameraInfo}
                      onChange={(e) => setNewCameraInfo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    História / Descrição da Obra (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Conte a história ou o significado espiritual expresso no desenho..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{isSubmittingNew ? 'Processando e Inserindo...' : 'Cadastrar Desenho na Votação'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Sub-mode 2: Bulk Photos Insert */}
          {insertMode === 'bulk' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  Inserção Múltipla em Lote
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Selecione vários arquivos de fotos de desenhos de uma só vez. O sistema otimiza todos os arquivos e cadastra como obras da exposição em 1 clique.
                </p>
              </div>

              {bulkMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                    bulkMsg.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{bulkMsg.text}</span>
                </div>
              )}

              <input
                type="file"
                ref={bulkFileInputRef}
                onChange={handleBulkFilesSelect}
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
              />

              <div
                onClick={() => bulkFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/70 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/50 flex flex-col items-center justify-center space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    Clique para selecionar múltiplos arquivos (Ex: fotos 01 a 10)
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Suporta seleção de vários arquivos simultaneamente com compressão automática.
                  </div>
                </div>
              </div>

              {isProcessingBulk && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Processando e comprimindo arquivos selecionados...</span>
                </div>
              )}

              {/* List of files selected */}
              {bulkFiles.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      {bulkFiles.length} arquivos prontos para inserção:
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFiles([])}
                      className="text-xs text-rose-400 hover:text-rose-300 font-bold"
                    >
                      Limpar lista
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {bulkFiles.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3"
                      >
                        <img
                          src={item.preview}
                          alt={item.title}
                          className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkFiles((prev) =>
                                prev.map((f, i) => (i === index ? { ...f, title: val } : f))
                              );
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-bold outline-none"
                            placeholder="Título do Desenho"
                          />
                          <input
                            type="text"
                            value={item.author}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBulkFiles((prev) =>
                                prev.map((f, i) => (i === index ? { ...f, author: val } : f))
                              );
                            }}
                            className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[11px] outline-none"
                            placeholder="Nome do Aluno / Artista"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitBulk}
                    disabled={isProcessingBulk}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Inserir Todos os {bulkFiles.length} Desenhos no Concurso</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CONFIGURAÇÕES DA VOTAÇÃO                          */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Regras e Configurações da Exposição
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ajuste o título oficial, status da apuração e regras antifraude de voto único.
            </p>
          </div>

          {settingsMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Título Oficial da Exposição / Concurso
              </label>
              <input
                type="text"
                value={contestTitle}
                onChange={(e) => setContestTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Subtítulo / Instruções para os Votantes
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:border-amber-500 outline-none"
              />
            </div>

            {/* Voting Status Radio Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Status da Votação
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setStatus('active')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    status === 'active'
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo (Votação Aberta)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Público pode votar normalmente via QR Code ou na galeria.
                  </div>
                </div>

                <div
                  onClick={() => setStatus('paused')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    status === 'paused'
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Pausado (Em Espera)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Exposição visível, mas botões de votação ficam bloqueados temporariamente.
                  </div>
                </div>

                <div
                  onClick={() => setStatus('closed')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    status === 'closed'
                      ? 'bg-rose-500/15 border-rose-500/60 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    Encerrado (Apuração Final)
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Votação finalizada e travada para anúncio oficial do vencedor.
                  </div>
                </div>
              </div>
            </div>

            {/* Strict 1-Vote Rule */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Regra Antifraude: 1 Voto Único por Nome
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Permite múltiplos votos pelo mesmo aparelho/celular, garantindo que o mesmo nome nunca vote mais de uma vez.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!allowRevote}
                    onChange={(e) => setAllowRevote(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>

            {/* Save Settings Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm tracking-wide shadow-md shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar e Aplicar Configurações</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BACKUP, AUDITORIA & MANUTENÇÃO                     */}
      {/* ========================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          {backupMsg && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                backupMsg.success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
              }`}
            >
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{backupMsg.text}</span>
            </div>
          )}

          {/* Backup & Export Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Download Backup */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Salvar Backup Completo (JSON)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Baixe um arquivo seguro com todas as obras, imagens, votos e configurações. Guarde este arquivo para recuperação instantânea em caso de reinicialização.
                </p>
              </div>
              <button
                type="button"
                onClick={onDownloadBackup}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Arquivo JSON</span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Restaurar de um Backup</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Envie o arquivo .JSON salvo anteriormente para continuar exatamente de onde parou, recuperando todas as imagens e votos.
                </p>
              </div>
              <input
                type="file"
                ref={adminFileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => adminFileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Arquivo JSON</span>
              </button>
            </div>

            {/* Export CSV */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Planilha de Auditoria (CSV)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Exporte o relatório completo para abrir no Excel ou Google Sheets com a classificação oficial, votos por categoria e data.
                </p>
              </div>
              <button
                type="button"
                onClick={onDownloadCsv}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Baixar Planilha CSV</span>
              </button>
            </div>

            {/* Live Testing Simulation */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-base">Testar Telão & Simulação</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Simule votos fictícios para calibrar a transmissão do telão de palco, confetes e sons de comemoração.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onSimulateVote}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>+1 Voto Teste</span>
                </button>
                <button
                  type="button"
                  onClick={toggleContinuousSimulation}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    isSimulatingLoop
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  {isSimulatingLoop ? 'Parar Loop' : 'Loop Automático'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Zona de Controle Crítico (Ações Irreversíveis)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div>
                <div className="text-sm font-bold text-white">Zerar Contagem de Votos</div>
                <div className="text-xs text-slate-400">
                  Reseta todos os votos para 0 antes de iniciar a votação oficial presencial.
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (
                    window.confirm('ATENÇÃO: Deseja realmente ZERAR TODOS OS VOTOS? Esta ação não pode ser desfeita.') &&
                    window.confirm('Confirmação final: Todos os votos serão apagados e a contagem voltará para 0. Continuar?')
                  ) {
                    await onResetVotes();
                    alert('Todos os votos foram zerados com sucesso!');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 text-xs font-bold shrink-0 transition-colors"
              >
                Zerar Todos os Votos
              </button>
            </div>

            <div className="border-t border-rose-900/40 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-white">Restaurar Desenhos Originais de Demonstração</div>
                <div className="text-xs text-slate-400">
                  Restaura o conjunto padrão de 5 desenhos originais da Virgem de Nazaré com 0 votos.
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Deseja restaurar as 5 obras padrão de demonstração?')) {
                    await onRestoreDemo();
                    alert('Desenhos originais restaurados!');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold shrink-0 transition-colors"
              >
                Restaurar Obras Padrão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Artwork QR Code Modal */}
      {qrModalPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setQrModalPhoto(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQrModalPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{qrModalPhoto.title}</h3>
              <p className="text-xs text-amber-400 font-medium">Artista: {qrModalPhoto.photographer}</p>
            </div>

            {generatedQrUrl && (
              <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                <img src={generatedQrUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              </div>
            )}

            <p className="text-xs text-slate-400">
              Aponte a câmera para votar diretamente nesta obra.
            </p>

            {generatedQrUrl && (
              <a
                href={generatedQrUrl}
                download={`qrcode-voto-${qrModalPhoto.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`}
                className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Imagem do QR Code</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
