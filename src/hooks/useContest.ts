import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContestData, ContestSettings, PhotoEntry, VoteRecord } from '../types/contest.ts';
import { getOrCreateVoterToken, getSavedVoterName, saveVoterName } from '../utils/voter.ts';
import { getInitialContestData, INITIAL_PHOTOS, INITIAL_CONTEST_SETTINGS } from '../utils/seedData.ts';

const LOCAL_STORAGE_KEY = 'contest_state_v1';
const VOTES_STORAGE_KEY = 'contest_votes_v1';

export function normalizeVoterName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function getStoredState(): ContestData {
  if (typeof window === 'undefined') {
    return getInitialContestData();
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.photos) && parsed.photos.length > 0) {
        return {
          contest: parsed.contest || { ...INITIAL_CONTEST_SETTINGS },
          photos: parsed.photos,
          totalVotes: parsed.totalVotes || 0,
          totalVoters: parsed.totalVoters || parsed.totalVotes || 0,
          recentVotes: parsed.recentVotes || [],
          votedNames: parsed.votedNames || [],
        };
      }
    }
  } catch (e) {
    console.warn('[useContest] Failed to parse localStorage state:', e);
  }
  return getInitialContestData();
}

function getStoredVotes(): VoteRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return [];
}

export function useContest() {
  const [data, setData] = useState<ContestData>(() => getStoredState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedPhotoId, setVotedPhotoId] = useState<string | null>(null);
  const [voterName, setVoterNameState] = useState<string>(getSavedVoterName());
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const voterTokenRef = useRef<string>(getOrCreateVoterToken());
  const localVotesRef = useRef<VoteRecord[]>(getStoredVotes());

  // Save to localStorage whenever data changes
  const persistLocally = useCallback((newData: ContestData, newVotes?: VoteRecord[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      if (newVotes) {
        localVotesRef.current = newVotes;
        localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(newVotes));
      }
    } catch (err) {
      console.warn('[useContest] localStorage quota or write warning:', err);
    }
  }, []);

  // Fetch contest state from API (with seamless local fallback)
  const fetchContest = useCallback(async () => {
    try {
      const res = await fetch('/api/contest');
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const json = await res.json();
      
      const serverData: ContestData = {
        contest: json.contest || INITIAL_CONTEST_SETTINGS,
        photos: json.photos || INITIAL_PHOTOS,
        totalVotes: json.totalVotes ?? 0,
        totalVoters: json.totalVoters ?? 0,
        recentVotes: json.recentVotes || [],
        votedNames: json.votedNames || [],
      };

      setData(serverData);
      persistLocally(serverData);
      setError(null);
    } catch (err) {
      // Running on Vercel without serverless or offline: continue with persistent local state
      console.info('[useContest] Using persistent local state (Vercel/Offline mode)');
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [persistLocally]);

  // Connect to SSE for real-time live streaming when available
  useEffect(() => {
    fetchContest();

    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('open', () => {
        setIsLiveConnected(true);
      });

      eventSource.addEventListener('update', (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
          persistLocally(parsed);
          if (parsed.totalVotes === 0) {
            setVotedPhotoId(null);
          }
          setIsLiveConnected(true);
        } catch (e) {
          console.warn('[SSE] Parse warning:', e);
        }
      });

      eventSource.addEventListener('error', () => {
        setIsLiveConnected(false);
        // Fallback polling if SSE disconnects
        if (!pollInterval) {
          pollInterval = setInterval(fetchContest, 6000);
        }
      });
    } catch {
      pollInterval = setInterval(fetchContest, 6000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchContest, persistLocally]);

  // Helper to recalculate stats client-side
  const recalculateStatsLocal = (photos: PhotoEntry[]): PhotoEntry[] => {
    const total = photos.reduce((sum, p) => sum + p.votes, 0);
    const sorted = [...photos].sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
    return sorted.map((p, idx) => ({
      ...p,
      rank: idx + 1,
      percentage: total > 0 ? Math.round((p.votes / total) * 1000) / 10 : 0,
    }));
  };

  // Vote for a photo (allows multiple votes per device, strictly 1 vote per name)
  const vote = async (photoId: string, name?: string): Promise<{ success: boolean; message: string }> => {
    setIsVoting(true);
    setVoteMessage(null);
    const nameToSend = (name || voterName || '').trim();

    if (!nameToSend || nameToSend.length < 2) {
      const msg = 'Por favor, informe seu nome completo para registrar o voto. O regulamento permite apenas 1 voto por nome.';
      setVoteMessage({ text: msg, type: 'error' });
      setIsVoting(false);
      return { success: false, message: msg };
    }

    setVoterNameState(nameToSend);
    saveVoterName(nameToSend);

    // Check contest active status
    if (data.contest.status !== 'active') {
      const msg = data.contest.status === 'paused'
        ? 'A votação está temporariamente pausada pelo organizador.'
        : 'A votação deste concurso já foi encerrada.';
      setVoteMessage({ text: msg, type: 'error' });
      setIsVoting(false);
      return { success: false, message: msg };
    }

    // Try server first
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          voterName: nameToSend,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setVoteMessage({ text: json.message || 'Falha ao registrar voto.', type: 'error' });
        setIsVoting(false);
        return { success: false, message: json.message || 'Falha ao registrar voto.' };
      }

      setVotedPhotoId(photoId);
      if (json.contestData) {
        setData(json.contestData);
        persistLocally(json.contestData);
      }
      const successMsg = json.message || `Voto de "${nameToSend}" registrado com sucesso!`;
      setVoteMessage({ text: successMsg, type: 'success' });
      setIsVoting(false);
      return { success: true, message: successMsg };
    } catch {
      // Server not reachable (e.g. Vercel static), process vote locally
    }

    // Client-side vote processing (uniqueness enforced strictly by normalized name)
    const normalized = normalizeVoterName(nameToSend);
    const existingNameVote = localVotesRef.current.find(
      (v) => v.voterName && normalizeVoterName(v.voterName) === normalized
    );

    if (existingNameVote) {
      const targetP = data.photos.find((p) => p.id === existingNameVote.photoId);
      const msg = `O nome "${nameToSend}" já registrou um voto neste concurso${targetP ? ` (no desenho "${targetP.title}")` : ''}! O regulamento permite apenas 1 voto por nome.`;
      setVoteMessage({ text: msg, type: 'error' });
      setIsVoting(false);
      return { success: false, message: msg };
    }

    const updatedPhotos = data.photos.map((p) => {
      if (p.id === photoId) {
        return { ...p, votes: p.votes + 1 };
      }
      return p;
    });

    const newVoteRecord: VoteRecord = {
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      voterToken: 'token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      ipHash: 'local',
      photoId,
      voterName: nameToSend,
      timestamp: Date.now(),
    };

    const updatedVotesList = [...localVotesRef.current, newVoteRecord];
    const targetPhoto = data.photos.find((p) => p.id === photoId);
    const newRecent = [
      {
        photoId,
        photoTitle: targetPhoto?.title || 'Desenho',
        voterName: nameToSend,
        timestamp: Date.now(),
      },
      ...data.recentVotes,
    ].slice(0, 8);

    const recomputedPhotos = recalculateStatsLocal(updatedPhotos);
    const totalVotes = recomputedPhotos.reduce((sum, p) => sum + p.votes, 0);

    const updatedContestData: ContestData = {
      contest: data.contest,
      photos: recomputedPhotos,
      totalVotes,
      totalVoters: updatedVotesList.length,
      recentVotes: newRecent,
      votedNames: updatedVotesList.map((v) => v.voterName).filter(Boolean) as string[],
    };

    setData(updatedContestData);
    setVotedPhotoId(photoId);
    persistLocally(updatedContestData, updatedVotesList);

    const successMsg = `Voto de "${nameToSend}" registrado com sucesso!`;
    setVoteMessage({ text: successMsg, type: 'success' });
    setIsVoting(false);
    return { success: true, message: successMsg };
  };

  // Admin controls
  const addPhoto = async (photoData: {
    title: string;
    photographer: string;
    category: string;
    description: string;
    imageUrl: string;
    cameraInfo?: string;
  }) => {
    try {
      const res = await fetch('/api/admin/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const newEntry: PhotoEntry = {
      id: 'photo-' + Date.now(),
      title: photoData.title.trim(),
      photographer: photoData.photographer.trim(),
      category: photoData.category || 'Geral',
      description: photoData.description || '',
      imageUrl: photoData.imageUrl,
      cameraInfo: photoData.cameraInfo,
      votes: 0,
      percentage: 0,
      rank: data.photos.length + 1,
      createdAt: new Date().toISOString(),
    };

    const newPhotos = recalculateStatsLocal([...data.photos, newEntry]);
    const updatedData: ContestData = {
      ...data,
      photos: newPhotos,
    };
    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, photo: newEntry, contestData: updatedData };
  };

  const deletePhoto = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/photo/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const filtered = data.photos.filter((p) => p.id !== id);
    const recomputed = recalculateStatsLocal(filtered);
    const updatedData: ContestData = {
      ...data,
      photos: recomputed,
      totalVotes: recomputed.reduce((s, p) => s + p.votes, 0),
    };
    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, contestData: updatedData };
  };

  const updateSettings = async (settings: Partial<ContestSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const updatedData: ContestData = {
      ...data,
      contest: { ...data.contest, ...settings },
    };
    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, contestData: updatedData };
  };

  const resetVotes = async () => {
    try {
      const res = await fetch('/api/admin/reset-votes', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData, []);
          setVotedPhotoId(null);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const zeroed = data.photos.map((p) => ({ ...p, votes: 0, percentage: 0 }));
    const updatedData: ContestData = {
      ...data,
      photos: zeroed,
      totalVotes: 0,
      totalVoters: 0,
      recentVotes: [],
    };
    setData(updatedData);
    persistLocally(updatedData, []);
    setVotedPhotoId(null);
    return { success: true, contestData: updatedData };
  };

  const restoreDemo = async () => {
    try {
      const res = await fetch('/api/admin/restore-demo', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData, []);
          setVotedPhotoId(null);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const demoData = getInitialContestData();
    setData(demoData);
    persistLocally(demoData, []);
    setVotedPhotoId(null);
    return { success: true, contestData: demoData };
  };

  const updatePhoto = async (id: string, updates: Partial<PhotoEntry>) => {
    try {
      const res = await fetch(`/api/admin/photo/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const updatedList = data.photos.map((p) => (p.id === id ? { ...p, ...updates } : p));
    const recomputed = recalculateStatsLocal(updatedList);
    const updatedData: ContestData = { ...data, photos: recomputed };
    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, contestData: updatedData };
  };

  const setAllPhotos = async (newPhotos: PhotoEntry[]) => {
    try {
      const res = await fetch('/api/admin/photos/set-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPhotos }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    const recomputed = recalculateStatsLocal(newPhotos);
    const updatedData: ContestData = { ...data, photos: recomputed };
    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, contestData: updatedData };
  };

  const simulateVote = async () => {
    try {
      const res = await fetch('/api/admin/simulate-vote', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    if (data.photos.length === 0) return { success: false };
    const randomIndex = Math.floor(Math.random() * data.photos.length);
    const selected = data.photos[randomIndex];
    const fakeNames = ['Lucas', 'Beatriz', 'Thiago', 'Fernanda', 'Rodrigo', 'Camila', 'Marcos', 'Larissa', 'Vinicius', 'Aline'];
    const fakeName = fakeNames[Math.floor(Math.random() * fakeNames.length)];

    const updatedPhotos = data.photos.map((p) => (p.id === selected.id ? { ...p, votes: p.votes + 1 } : p));
    const recomputed = recalculateStatsLocal(updatedPhotos);
    const updatedData: ContestData = {
      ...data,
      photos: recomputed,
      totalVotes: data.totalVotes + 1,
      totalVoters: data.totalVoters + 1,
      recentVotes: [
        { photoId: selected.id, photoTitle: selected.title, voterName: fakeName, timestamp: Date.now() },
        ...data.recentVotes,
      ].slice(0, 8),
    };

    setData(updatedData);
    persistLocally(updatedData);
    return { success: true, contestData: updatedData };
  };

  // Restore backup from JSON (works both online and offline)
  const restoreBackup = async (backupPayload: any) => {
    try {
      const res = await fetch('/api/contest/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupPayload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.contestData) {
          setData(json.contestData);
          persistLocally(json.contestData, backupPayload.votes || []);
          return json;
        }
      }
    } catch {
      // offline fallback
    }

    if (!backupPayload || !Array.isArray(backupPayload.photos)) {
      return { success: false, message: 'Arquivo de backup inválido.' };
    }

    const recomputed = recalculateStatsLocal(backupPayload.photos);
    const restoredContestData: ContestData = {
      contest: backupPayload.contestSettings || backupPayload.contest || data.contest,
      photos: recomputed,
      totalVotes: recomputed.reduce((s, p) => s + p.votes, 0),
      totalVoters: Array.isArray(backupPayload.votes) ? backupPayload.votes.length : backupPayload.totalVoters || 0,
      recentVotes: backupPayload.recentVotes || [],
    };

    setData(restoredContestData);
    persistLocally(restoredContestData, backupPayload.votes || []);
    return {
      success: true,
      message: `Backup restaurado com sucesso! Carregadas ${recomputed.length} obras.`,
      contestData: restoredContestData,
    };
  };

  // Trigger JSON backup file download (with client-side fallback)
  const downloadBackup = () => {
    const backupData = {
      app: 'DesenhoNazare',
      version: 1,
      exportedAt: new Date().toISOString(),
      totalVotes: data.totalVotes,
      totalVoters: data.totalVoters,
      contestSettings: data.contest,
      photos: data.photos,
      votes: localVotesRef.current,
      recentVotes: data.recentVotes,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-concurso-nazare-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger CSV votes audit spreadsheet download (with client-side fallback)
  const downloadCsv = () => {
    let csv = '\uFEFF';
    csv += `"RELATÓRIO OFICIAL DE APURAÇÃO - CONCURSO DE DESENHO DE NOSSA SENHORA DE NAZARÉ"\n`;
    csv += `"Data de Emissão";"${new Date().toLocaleString('pt-BR')}"\n`;
    csv += `"Status do Concurso";"${data.contest.status === 'active' ? 'Ativo / Em Andamento' : data.contest.status === 'paused' ? 'Pausado' : 'Encerrado'}"\n`;
    csv += `"Total Geral de Votos";"${data.totalVotes}"\n\n`;
    csv += `"CLASSIFICAÇÃO GERAL DAS OBRAS"\n`;
    csv += `"Posição";"Título da Obra";"Artista / Candidato";"Categoria / Técnica";"Votos";"Percentual"\n`;
    data.photos.forEach((p) => {
      csv += `"${p.rank}º Lugar";"${p.title.replace(/"/g, '""')}";"${p.photographer.replace(/"/g, '""')}";"${p.category.replace(/"/g, '""')}";"${p.votes}";"${p.percentage}%"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apuracao-votos-nazare-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    contest: data.contest,
    photos: data.photos,
    totalVotes: data.totalVotes,
    totalVoters: data.totalVoters,
    recentVotes: data.recentVotes,
    votedNames: data.votedNames || [],
    loading,
    error,
    votedPhotoId,
    voterName,
    setVoterName: (name: string) => {
      setVoterNameState(name);
      saveVoterName(name);
    },
    isVoting,
    voteMessage,
    clearVoteMessage: () => setVoteMessage(null),
    isLiveConnected,
    vote,
    refreshContest: fetchContest,
    addPhoto,
    deletePhoto,
    updatePhoto,
    setAllPhotos,
    updateSettings,
    resetVotes,
    restoreDemo,
    simulateVote,
    restoreBackup,
    downloadBackup,
    downloadCsv,
  };
}
