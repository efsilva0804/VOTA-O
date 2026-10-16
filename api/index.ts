import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { PhotoEntry, ContestSettings, ContestData, VoteRecord } from '../src/types/contest.ts';
import { INITIAL_PHOTOS, INITIAL_CONTEST_SETTINGS, getInitialContestData } from '../src/utils/seedData.ts';

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In Vercel serverless, /tmp is the only writable directory
const isVercel = process.env.VERCEL === '1' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_FILE = isVercel
  ? path.join('/tmp', 'contest-state.json')
  : path.join(process.cwd(), 'contest-state.json');

let contestSettings: ContestSettings = { ...INITIAL_CONTEST_SETTINGS };
let photos: PhotoEntry[] = JSON.parse(JSON.stringify(INITIAL_PHOTOS));
let votes: VoteRecord[] = [];
let recentVotes: { photoId: string; photoTitle: string; voterName?: string; timestamp: number }[] = [];

function saveStateToDisk() {
  try {
    const data = {
      version: 1,
      lastSaved: new Date().toISOString(),
      photos,
      votes,
      recentVotes,
      contestSettings,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Vercel API] State write to disk skipped or unavailable:', e);
  }
}

function loadStateFromDisk() {
  try {
    let raw = '';
    if (fs.existsSync(DATA_FILE)) {
      raw = fs.readFileSync(DATA_FILE, 'utf-8');
    } else {
      const fallbackFile = path.join(process.cwd(), 'contest-state.json');
      if (fs.existsSync(fallbackFile)) {
        raw = fs.readFileSync(fallbackFile, 'utf-8');
      }
    }

    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.photos) && data.photos.length > 0) {
        photos = data.photos;
      }
      if (Array.isArray(data.votes)) {
        votes = data.votes;
      }
      if (Array.isArray(data.recentVotes)) {
        recentVotes = data.recentVotes;
      }
      if (data.contestSettings) {
        contestSettings = { ...contestSettings, ...data.contestSettings };
      }
    }
  } catch (e) {
    console.warn('[Vercel API] Could not load state from disk, using seed data:', e);
  }
}

loadStateFromDisk();

function recalculateStats() {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);

  photos.sort((a, b) => {
    if (b.votes !== a.votes) {
      return b.votes - a.votes;
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  photos.forEach((photo, index) => {
    photo.rank = index + 1;
    photo.percentage = totalVotes > 0 ? Math.round((photo.votes / totalVotes) * 1000) / 10 : 0;
  });
}

recalculateStats();

function getContestData(): ContestData {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);
  return {
    contest: contestSettings,
    photos: photos.map((p) => ({ ...p })),
    totalVotes,
    totalVoters: votes.length > 0 ? votes.length : totalVotes,
    recentVotes: recentVotes.slice(0, 8),
  };
}

function getClientIpHash(req: express.Request): string {
  const rawIp =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  return crypto.createHash('sha256').update(rawIp.split(',')[0].trim()).digest('hex').substring(0, 16);
}

// Routes
app.get('/api/contest', (req, res) => {
  const voterToken = (req.query.voterToken as string) || (req.headers['x-voter-token'] as string);
  const ipHash = getClientIpHash(req);

  let existingVote: VoteRecord | undefined;
  if (voterToken) {
    existingVote = votes.find((v) => v.voterToken === voterToken);
  }
  if (!existingVote && ipHash) {
    existingVote = votes.find((v) => v.ipHash === ipHash);
  }

  res.json({
    ...getContestData(),
    hasVoted: !!existingVote,
    votedPhotoId: existingVote?.photoId || null,
    voterName: existingVote?.voterName || null,
  });
});

app.get('/api/events', (_req, res) => {
  // In serverless, long-lived SSE can be limited, return event data directly
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write(`event: update\ndata: ${JSON.stringify(getContestData())}\n\n`);
  res.end();
});

app.post('/api/vote', (req, res) => {
  try {
    const { photoId, voterToken, voterName } = req.body;
    if (!photoId) {
      return res.status(400).json({ success: false, message: 'Foto não especificada.' });
    }

    if (contestSettings.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: contestSettings.status === 'paused'
          ? 'A votação está temporariamente pausada.'
          : 'A votação deste concurso já foi encerrada.',
      });
    }

    const photo = photos.find((p) => p.id === photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Foto não encontrada.' });
    }

    const token = voterToken || crypto.randomUUID();
    const ipHash = getClientIpHash(req);

    const existingIndex = votes.findIndex(
      (v) => v.voterToken === token || (ipHash && v.ipHash === ipHash)
    );

    if (existingIndex !== -1) {
      const prevVote = votes[existingIndex];
      if (!contestSettings.allowRevote) {
        return res.status(403).json({
          success: false,
          message: 'Você já registrou seu voto neste concurso! O regulamento permite apenas 1 voto por pessoa.',
          votedPhotoId: prevVote.photoId,
        });
      }

      const prevPhoto = photos.find((p) => p.id === prevVote.photoId);
      if (prevPhoto && prevPhoto.votes > 0) {
        prevPhoto.votes -= 1;
      }
      votes[existingIndex].photoId = photoId;
      votes[existingIndex].voterName = voterName || votes[existingIndex].voterName;
      votes[existingIndex].timestamp = Date.now();
    } else {
      const newVote: VoteRecord = {
        id: crypto.randomUUID(),
        voterToken: token,
        ipHash,
        photoId,
        voterName: voterName ? String(voterName).trim() : undefined,
        timestamp: Date.now(),
      };
      votes.push(newVote);
    }

    photo.votes += 1;
    recentVotes.unshift({
      photoId: photo.id,
      photoTitle: photo.title,
      voterName: voterName ? String(voterName).trim() : undefined,
      timestamp: Date.now(),
    });
    if (recentVotes.length > 20) recentVotes.pop();

    recalculateStats();
    saveStateToDisk();

    return res.json({
      success: true,
      message: 'Voto computado com sucesso! Obrigado pela sua participação.',
      votedPhotoId: photo.id,
      contestData: getContestData(),
    });
  } catch (error) {
    console.error('Error in vote:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar voto.' });
  }
});

app.post('/api/admin/photo', (req, res) => {
  try {
    const { title, photographer, category, description, imageUrl, cameraInfo } = req.body;
    if (!title || !photographer || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Campos obrigatórios ausentes.' });
    }

    const newPhoto: PhotoEntry = {
      id: 'photo-' + Date.now(),
      title: title.trim(),
      photographer: photographer.trim(),
      category: category ? category.trim() : 'Geral',
      description: description ? description.trim() : '',
      imageUrl: imageUrl.trim(),
      cameraInfo: cameraInfo ? cameraInfo.trim() : undefined,
      votes: 0,
      percentage: 0,
      rank: photos.length + 1,
      createdAt: new Date().toISOString(),
    };

    photos.push(newPhoto);
    recalculateStats();
    saveStateToDisk();
    res.json({ success: true, photo: newPhoto, contestData: getContestData() });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar foto.' });
  }
});

app.delete('/api/admin/photo/:id', (req, res) => {
  const { id } = req.params;
  photos = photos.filter((p) => p.id !== id);
  votes = votes.filter((v) => v.photoId !== id);
  recalculateStats();
  saveStateToDisk();
  res.json({ success: true, contestData: getContestData() });
});

app.put('/api/admin/photo/:id', (req, res) => {
  const { id } = req.params;
  const photo = photos.find((p) => p.id === id);
  if (!photo) {
    return res.status(404).json({ success: false, message: 'Desenho não encontrado.' });
  }

  const { title, photographer, category, description, imageUrl, cameraInfo } = req.body;
  if (title !== undefined) photo.title = title.trim();
  if (photographer !== undefined) photo.photographer = photographer.trim();
  if (category !== undefined) photo.category = category.trim();
  if (description !== undefined) photo.description = description.trim();
  if (imageUrl !== undefined) photo.imageUrl = imageUrl;
  if (cameraInfo !== undefined) photo.cameraInfo = cameraInfo.trim();

  recalculateStats();
  saveStateToDisk();
  res.json({ success: true, photo, contestData: getContestData() });
});

app.post('/api/admin/photos/set-all', (req, res) => {
  try {
    const { newPhotos } = req.body;
    if (Array.isArray(newPhotos) && newPhotos.length > 0) {
      photos = newPhotos.map((p: PhotoEntry, idx: number) => ({
        id: p.id || `desenho-${idx + 1}`,
        title: p.title || `Desenho ${idx + 1}`,
        photographer: p.photographer || 'Artista',
        category: p.category || 'Arte Sacra',
        description: p.description || '',
        imageUrl: p.imageUrl,
        cameraInfo: p.cameraInfo,
        votes: 0,
        percentage: 0,
        rank: idx + 1,
        createdAt: p.createdAt || new Date().toISOString(),
      }));
      recalculateStats();
      saveStateToDisk();
      return res.json({ success: true, contestData: getContestData() });
    }
    res.status(400).json({ success: false, message: 'Lista inválida de desenhos.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar desenhos.' });
  }
});

app.post('/api/admin/settings', (req, res) => {
  contestSettings = { ...contestSettings, ...req.body };
  saveStateToDisk();
  res.json({ success: true, contestSettings, contestData: getContestData() });
});

app.post('/api/admin/reset-votes', (_req, res) => {
  votes = [];
  recentVotes = [];
  photos.forEach((p) => {
    p.votes = 0;
    p.percentage = 0;
  });
  recalculateStats();
  saveStateToDisk();
  res.json({ success: true, contestData: getContestData() });
});

app.post('/api/admin/restore-demo', (_req, res) => {
  photos = JSON.parse(JSON.stringify(INITIAL_PHOTOS));
  votes = [];
  recentVotes = [];
  contestSettings = { ...INITIAL_CONTEST_SETTINGS };
  recalculateStats();
  saveStateToDisk();
  res.json({ success: true, contestData: getContestData() });
});

app.post('/api/admin/simulate-vote', (_req, res) => {
  if (photos.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhuma foto disponível.' });
  }
  const randomIndex = Math.floor(Math.random() * photos.length);
  const selectedPhoto = photos[randomIndex];
  const fakeNames = ['Lucas', 'Beatriz', 'Thiago', 'Fernanda', 'Rodrigo', 'Camila', 'Marcos', 'Larissa', 'Vinicius', 'Aline'];
  const fakeName = fakeNames[Math.floor(Math.random() * fakeNames.length)];

  selectedPhoto.votes += 1;
  const fakeToken = 'sim-' + crypto.randomUUID();
  votes.push({
    id: crypto.randomUUID(),
    voterToken: fakeToken,
    ipHash: 'sim-' + Math.floor(Math.random() * 9999),
    photoId: selectedPhoto.id,
    voterName: fakeName,
    timestamp: Date.now(),
  });

  recentVotes.unshift({
    photoId: selectedPhoto.id,
    photoTitle: selectedPhoto.title,
    voterName: fakeName,
    timestamp: Date.now(),
  });
  if (recentVotes.length > 20) recentVotes.pop();

  recalculateStats();
  saveStateToDisk();
  res.json({ success: true, contestData: getContestData() });
});

app.get('/api/contest/backup', (_req, res) => {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);
  const backupData = {
    app: 'DesenhoNazare',
    version: 1,
    exportedAt: new Date().toISOString(),
    totalVotes,
    totalVoters: votes.length > 0 ? votes.length : totalVotes,
    contestSettings,
    photos,
    votes,
    recentVotes,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="backup-concurso-nazare-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json(backupData);
});

app.post('/api/contest/restore', (req, res) => {
  try {
    const { photos: restoredPhotos, votes: restoredVotes, contestSettings: restoredSettings, recentVotes: restoredRecent } = req.body;
    if (!Array.isArray(restoredPhotos) || restoredPhotos.length === 0) {
      return res.status(400).json({ success: false, message: 'Arquivo de backup inválido.' });
    }

    photos = restoredPhotos.map((p: PhotoEntry, idx: number) => ({
      id: p.id || `desenho-${idx + 1}`,
      title: p.title || `Desenho ${idx + 1}`,
      photographer: p.photographer || 'Artista',
      category: p.category || 'Arte Sacra',
      description: p.description || '',
      imageUrl: p.imageUrl,
      cameraInfo: p.cameraInfo,
      votes: typeof p.votes === 'number' ? p.votes : 0,
      percentage: typeof p.percentage === 'number' ? p.percentage : 0,
      rank: p.rank || idx + 1,
      createdAt: p.createdAt || new Date().toISOString(),
    }));

    if (Array.isArray(restoredVotes)) votes = restoredVotes;
    if (Array.isArray(restoredRecent)) recentVotes = restoredRecent;
    if (restoredSettings && typeof restoredSettings === 'object') {
      contestSettings = { ...contestSettings, ...restoredSettings };
    }

    recalculateStats();
    saveStateToDisk();

    return res.json({
      success: true,
      message: `Backup restaurado com sucesso! Carregadas ${photos.length} obras e ${votes.length} votos.`,
      contestData: getContestData(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Falha ao restaurar backup.' });
  }
});

app.get('/api/contest/results', (_req, res) => {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);
  const winner = photos.length > 0 && photos[0].votes > 0 ? photos[0] : null;

  const votesLog = votes.map((v) => {
    const photo = photos.find((p) => p.id === v.photoId);
    return {
      id: v.id,
      photoId: v.photoId,
      photoTitle: photo?.title || 'Desenho',
      photographer: photo?.photographer || 'Artista',
      category: photo?.category || 'Geral',
      voterName: v.voterName || 'Eleitor Anônimo',
      timestamp: v.timestamp,
      dateString: new Date(v.timestamp).toLocaleString('pt-BR'),
    };
  });

  res.json({
    success: true,
    contest: contestSettings,
    photos: photos.map((p) => ({ ...p })),
    totalVotes,
    totalVoters: votes.length > 0 ? votes.length : totalVotes,
    winner,
    votesLog,
    generatedAt: new Date().toISOString(),
  });
});

app.get('/api/contest/export-csv', (_req, res) => {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);
  let csv = '\uFEFF';
  csv += `"RELATÓRIO OFICIAL DE APURAÇÃO - CONCURSO DE DESENHO DE NOSSA SENHORA DE NAZARÉ"\n`;
  csv += `"Data de Emissão";"${new Date().toLocaleString('pt-BR')}"\n`;
  csv += `"Status do Concurso";"${contestSettings.status === 'active' ? 'Ativo / Em Andamento' : contestSettings.status === 'paused' ? 'Pausado' : 'Encerrado'}"\n`;
  csv += `"Total Geral de Votos";"${totalVotes}"\n\n`;
  csv += `"CLASSIFICAÇÃO GERAL DAS OBRAS"\n`;
  csv += `"Posição";"Título da Obra";"Artista / Candidato";"Categoria / Técnica";"Votos";"Percentual"\n`;
  photos.forEach((p) => {
    csv += `"${p.rank}º Lugar";"${p.title.replace(/"/g, '""')}";"${p.photographer.replace(/"/g, '""')}";"${p.category.replace(/"/g, '""')}";"${p.votes}";"${p.percentage}%"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="apuracao-votos-nazare-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

export default app;
