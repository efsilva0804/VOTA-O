import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import type { PhotoEntry, ContestSettings, ContestData, VoteRecord } from './src/types/contest.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

import { INITIAL_PHOTOS, INITIAL_CONTEST_SETTINGS } from './src/utils/seedData.ts';

// Explicitly serve static public assets and images
app.use('/images', express.static(path.resolve(__dirname, 'public', 'images')));
app.use(express.static(path.resolve(__dirname, 'public')));

let contestSettings: ContestSettings = { ...INITIAL_CONTEST_SETTINGS };
let photos: PhotoEntry[] = JSON.parse(JSON.stringify(INITIAL_PHOTOS));
let votes: VoteRecord[] = [];
let recentVotes: { photoId: string; photoTitle: string; voterName?: string; timestamp: number }[] = [];

// Persistence file
const DATA_FILE = path.join(__dirname, 'contest-state.json');

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
    console.error('Error saving state to disk:', e);
  }
}

function loadStateFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
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
      console.log(`[Persistence] Loaded ${photos.length} photos and ${votes.length} votes from disk.`);
    }
  } catch (e) {
    console.error('Error loading state from disk:', e);
  }
}

// Load persisted state if exists (resumes exactly from where it stopped)
loadStateFromDisk();

// Track SSE clients
const sseClients = new Set<express.Response>();

function recalculateStats() {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);

  // Sort photos descending by votes, then maintain natural drawing order
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

// Recalculate stats with the loaded persisted data and save
recalculateStats();
saveStateToDisk();

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

function broadcastUpdate() {
  const data = JSON.stringify(getContestData());
  sseClients.forEach((client) => {
    try {
      client.write(`event: update\ndata: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  });
}

function getClientIpHash(req: express.Request): string {
  const rawIp =
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    '127.0.0.1';
  return crypto.createHash('sha256').update(rawIp.split(',')[0].trim()).digest('hex').substring(0, 16);
}

// API Routes
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

// Real-Time SSE Endpoint
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send current data immediately
  res.write(`event: update\ndata: ${JSON.stringify(getContestData())}\n\n`);

  sseClients.add(res);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Vote Endpoint: Strict 1 vote per person
app.post('/api/vote', (req, res) => {
  try {
    const { photoId, voterToken, voterName } = req.body;

    if (!photoId) {
      return res.status(400).json({ success: false, message: 'Foto não especificada.' });
    }

    if (contestSettings.status !== 'active') {
      return res.status(403).json({
        success: false,
        message:
          contestSettings.status === 'paused'
            ? 'A votação está temporariamente pausada pelo organizador.'
            : 'A votação deste concurso já foi encerrada.',
      });
    }

    const photo = photos.find((p) => p.id === photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Foto não encontrada.' });
    }

    const token = voterToken || crypto.randomUUID();
    const ipHash = getClientIpHash(req);

    // Check existing vote
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

      // If revote is allowed, remove previous vote
      const prevPhoto = photos.find((p) => p.id === prevVote.photoId);
      if (prevPhoto && prevPhoto.votes > 0) {
        prevPhoto.votes -= 1;
      }
      votes[existingIndex].photoId = photoId;
      votes[existingIndex].voterName = voterName || votes[existingIndex].voterName;
      votes[existingIndex].timestamp = Date.now();
    } else {
      // New vote
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

    // Increment vote count for selected photo
    photo.votes += 1;

    // Record recent activity
    recentVotes.unshift({
      photoId: photo.id,
      photoTitle: photo.title,
      voterName: voterName ? String(voterName).trim() : undefined,
      timestamp: Date.now(),
    });
    if (recentVotes.length > 20) {
      recentVotes.pop();
    }

    // Recalculate ranks and percentages
    recalculateStats();
    saveStateToDisk();

    // Broadcast real-time update to all connected screens/devices
    broadcastUpdate();

    return res.json({
      success: true,
      message: 'Voto computado com sucesso! Obrigado pela sua participação.',
      votedPhotoId: photo.id,
      contestData: getContestData(),
    });
  } catch (error) {
    console.error('Error voting:', error);
    return res.status(500).json({ success: false, message: 'Erro interno ao processar voto.' });
  }
});

// Admin endpoints
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
    broadcastUpdate();

    res.json({ success: true, photo: newPhoto, contestData: getContestData() });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ success: false, message: 'Erro ao adicionar foto.' });
  }
});

app.delete('/api/admin/photo/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = photos.length;
  photos = photos.filter((p) => p.id !== id);

  if (photos.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Foto não encontrada.' });
  }

  // Remove votes associated with this photo
  votes = votes.filter((v) => v.photoId !== id);
  recalculateStats();
  saveStateToDisk();
  broadcastUpdate();

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
  broadcastUpdate();
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
      broadcastUpdate();
      return res.json({ success: true, contestData: getContestData() });
    }
    res.status(400).json({ success: false, message: 'Lista inválida de desenhos.' });
  } catch (err) {
    console.error('Error setting all photos:', err);
    res.status(500).json({ success: false, message: 'Erro ao atualizar desenhos.' });
  }
});

app.post('/api/admin/settings', (req, res) => {
  try {
    const updates = req.body;
    contestSettings = {
      ...contestSettings,
      ...updates,
    };
    saveStateToDisk();
    broadcastUpdate();
    res.json({ success: true, contestSettings, contestData: getContestData() });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Erro ao atualizar configurações.' });
  }
});

app.post('/api/admin/reset-votes', (req, res) => {
  votes = [];
  recentVotes = [];
  photos.forEach((p) => {
    p.votes = 0;
    p.percentage = 0;
  });
  recalculateStats();
  saveStateToDisk();
  broadcastUpdate();
  res.json({ success: true, contestData: getContestData() });
});

app.post('/api/admin/restore-demo', (_req, res) => {
  photos = JSON.parse(JSON.stringify(INITIAL_PHOTOS));
  votes = [];
  recentVotes = [];
  contestSettings = { ...INITIAL_CONTEST_SETTINGS };
  recalculateStats();
  saveStateToDisk();
  broadcastUpdate();
  res.json({ success: true, contestData: getContestData() });
});

// Simulation endpoint for test demonstrations
app.post('/api/admin/simulate-vote', (req, res) => {
  if (photos.length === 0) {
    return res.status(400).json({ success: false, message: 'Nenhuma foto disponível.' });
  }

  // Weighted random pick (top photos have higher chance to create realistic voting swings)
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
  broadcastUpdate();

  res.json({ success: true, contestData: getContestData() });
});

// Full Backup Download / Export Endpoint
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

// Full Backup Restore / Continue From Where It Stopped Endpoint
app.post('/api/contest/restore', (req, res) => {
  try {
    const { photos: restoredPhotos, votes: restoredVotes, contestSettings: restoredSettings, recentVotes: restoredRecent } = req.body;

    if (!Array.isArray(restoredPhotos) || restoredPhotos.length === 0) {
      return res.status(400).json({ success: false, message: 'Arquivo de backup inválido: nenhuma obra encontrada.' });
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

    if (Array.isArray(restoredVotes)) {
      votes = restoredVotes;
    }

    if (Array.isArray(restoredRecent)) {
      recentVotes = restoredRecent;
    } else {
      recentVotes = [];
    }

    if (restoredSettings && typeof restoredSettings === 'object') {
      contestSettings = {
        ...contestSettings,
        ...restoredSettings,
      };
    }

    recalculateStats();
    saveStateToDisk();
    broadcastUpdate();

    return res.json({
      success: true,
      message: `Backup restaurado com sucesso! Carregadas ${photos.length} obras e ${votes.length} votos. Continuando de onde parou.`,
      contestData: getContestData(),
    });
  } catch (err) {
    console.error('Error restoring backup:', err);
    return res.status(500).json({ success: false, message: 'Falha ao restaurar o backup.' });
  }
});

// Official Results Data Endpoint
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

// Export CSV Endpoint for spreadsheet audit
app.get('/api/contest/export-csv', (_req, res) => {
  const totalVotes = photos.reduce((sum, p) => sum + p.votes, 0);

  let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

  // Header
  csv += `"RELATÓRIO OFICIAL DE APURAÇÃO - CONCURSO DE DESENHO DE NOSSA SENHORA DE NAZARÉ"\n`;
  csv += `"Data de Emissão";"${new Date().toLocaleString('pt-BR')}"\n`;
  csv += `"Status do Concurso";"${contestSettings.status === 'active' ? 'Ativo / Em Andamento' : contestSettings.status === 'paused' ? 'Pausado' : 'Encerrado'}"\n`;
  csv += `"Total Geral de Votos";"${totalVotes}"\n`;
  csv += `"Total de Eleitores";"${votes.length > 0 ? votes.length : totalVotes}"\n\n`;

  // Classification Table
  csv += `"CLASSIFICAÇÃO GERAL DAS OBRAS"\n`;
  csv += `"Posição";"Título da Obra";"Artista / Candidato";"Categoria / Técnica";"Votos";"Percentual"\n`;
  photos.forEach((p) => {
    csv += `"${p.rank}º Lugar";"${p.title.replace(/"/g, '""')}";"${p.photographer.replace(/"/g, '""')}";"${p.category.replace(/"/g, '""')}";"${p.votes}";"${p.percentage}%"\n`;
  });

  csv += `\n"REGISTRO DETALHADO DOS VOTOS COMPUTADOS (AUDITORIA)"\n`;
  csv += `"Nº";"Data e Hora";"Nome do Eleitor";"Obra Votada";"Artista";"ID do Voto"\n`;
  votes.forEach((v, index) => {
    const photo = photos.find((p) => p.id === v.photoId);
    const dateStr = new Date(v.timestamp).toLocaleString('pt-BR');
    csv += `"${index + 1}";"${dateStr}";"${(v.voterName || 'Eleitor Anônimo').replace(/"/g, '""')}";"${(photo?.title || v.photoId).replace(/"/g, '""')}";"${(photo?.photographer || '').replace(/"/g, '""')}";"${v.id}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="apuracao-votos-nazare-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

// Configure Vite or Static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FotoVoto server listening on port ${PORT}`);
  });
}

startServer();
