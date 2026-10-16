import { useState, useEffect, useCallback, useRef } from 'react';
import type { ContestData, ContestSettings, PhotoEntry } from '../types/contest.ts';
import { getOrCreateVoterToken, getSavedVoterName, saveVoterName } from '../utils/voter.ts';

export function useContest() {
  const [data, setData] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedPhotoId, setVotedPhotoId] = useState<string | null>(null);
  const [voterName, setVoterNameState] = useState<string>(getSavedVoterName());
  const [isVoting, setIsVoting] = useState(false);
  const [voteMessage, setVoteMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const voterTokenRef = useRef<string>(getOrCreateVoterToken());

  // Fetch initial contest state
  const fetchContest = useCallback(async () => {
    try {
      const token = voterTokenRef.current;
      const res = await fetch(`/api/contest?voterToken=${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error('Falha ao carregar concurso');
      const json = await res.json();
      
      setData({
        contest: json.contest,
        photos: json.photos,
        totalVotes: json.totalVotes,
        totalVoters: json.totalVoters,
        recentVotes: json.recentVotes || [],
      });

      if (json.hasVoted && json.votedPhotoId) {
        setVotedPhotoId(json.votedPhotoId);
      } else {
        setVotedPhotoId(null);
      }
      if (json.voterName) {
        setVoterNameState(json.voterName);
        saveVoterName(json.voterName);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching contest:', err);
      setError('Não foi possível conectar ao servidor do concurso.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect to SSE for real-time live streaming
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
          if (parsed.totalVotes === 0) {
            setVotedPhotoId(null);
          }
          setIsLiveConnected(true);
        } catch (e) {
          console.error('Error parsing SSE message:', e);
        }
      });

      eventSource.addEventListener('error', () => {
        setIsLiveConnected(false);
        // Fallback polling if SSE disconnects
        if (!pollInterval) {
          pollInterval = setInterval(fetchContest, 5000);
        }
      });
    } catch {
      pollInterval = setInterval(fetchContest, 4000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [fetchContest]);

  // Vote for a photo
  const vote = async (photoId: string, name?: string): Promise<{ success: boolean; message: string }> => {
    setIsVoting(true);
    setVoteMessage(null);
    try {
      const token = voterTokenRef.current;
      const nameToSend = name || voterName;
      if (nameToSend) {
        saveVoterName(nameToSend);
        setVoterNameState(nameToSend);
      }

      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          voterToken: token,
          voterName: nameToSend,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json.message || 'Falha ao registrar voto.';
        setVoteMessage({ text: errorMsg, type: 'error' });
        if (json.votedPhotoId) {
          setVotedPhotoId(json.votedPhotoId);
        }
        return { success: false, message: errorMsg };
      }

      setVotedPhotoId(photoId);
      if (json.contestData) {
        setData(json.contestData);
      }
      setVoteMessage({ text: json.message || 'Voto computado com sucesso!', type: 'success' });
      return { success: true, message: json.message };
    } catch (err) {
      const errorMsg = 'Erro de conexão ao enviar voto. Tente novamente.';
      setVoteMessage({ text: errorMsg, type: 'error' });
      return { success: false, message: errorMsg };
    } finally {
      setIsVoting(false);
    }
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
    const res = await fetch('/api/admin/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photoData),
    });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  const deletePhoto = async (id: string) => {
    const res = await fetch(`/api/admin/photo/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  const updateSettings = async (settings: Partial<ContestSettings>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  const resetVotes = async () => {
    const res = await fetch('/api/admin/reset-votes', { method: 'POST' });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    setVotedPhotoId(null);
    return json;
  };

  const restoreDemo = async () => {
    const res = await fetch('/api/admin/restore-demo', { method: 'POST' });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    setVotedPhotoId(null);
    return json;
  };

  const updatePhoto = async (id: string, updates: Partial<PhotoEntry>) => {
    const res = await fetch(`/api/admin/photo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  const setAllPhotos = async (newPhotos: PhotoEntry[]) => {
    const res = await fetch('/api/admin/photos/set-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhotos }),
    });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  const simulateVote = async () => {
    const res = await fetch('/api/admin/simulate-vote', { method: 'POST' });
    const json = await res.json();
    if (json.contestData) setData(json.contestData);
    return json;
  };

  return {
    contest: data?.contest || null,
    photos: data?.photos || [],
    totalVotes: data?.totalVotes || 0,
    totalVoters: data?.totalVoters || 0,
    recentVotes: data?.recentVotes || [],
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
  };
}
