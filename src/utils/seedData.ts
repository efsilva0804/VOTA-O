import type { PhotoEntry, ContestSettings, ContestData } from '../types/contest.ts';
import { ARTWORK_BASE64 } from './artworkBase64.ts';
import { DRAWING_FALLBACKS } from './artworkSvgs.ts';

export const INITIAL_CONTEST_SETTINGS: ContestSettings = {
  id: 'contest-nazare-2026',
  title: 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ',
  subtitle: 'Exposição de Arte em Desenho • Votação Popular',
  theme: 'Nossa Senhora de Nazaré',
  status: 'active',
  allowRevote: false,
  showLiveCountToParticipants: true,
  revealWinner: false,
  prizeDescription: '',
  endsAt: null,
};

export const INITIAL_PHOTOS: PhotoEntry[] = [
  {
    id: 'desenho-1',
    title: 'Mãe da Esperança e Círio Fluvial',
    photographer: 'Candidato 01 (01.jpeg)',
    category: 'Lápis de Cor & Nanquim',
    description: 'Nossa Senhora acolhendo o Menino Jesus adormecido em seus braços, manto azul anil com arabescos dourados, coroa imperial, lírios brancos e ao fundo a Basílica de Nazaré com barco na romaria fluvial.',
    imageUrl: '/images/01.jpeg',
    cameraInfo: 'Lápis de cor e nanquim sobre papel · Obra 01',
    votes: 0,
    percentage: 0,
    rank: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'desenho-2',
    title: 'Coração Imaculado e Sereno',
    photographer: 'Layla (02.jpeg)',
    category: 'Grafite Clássico Sombreado',
    description: 'Retrato sereno com sombreamento refinado de Nossa Senhora em moldura oval clássica ornamentada com flores e arabescos, trazendo o olhar maternal e medalha ao peito.',
    imageUrl: '/images/02.jpeg',
    cameraInfo: 'Grafite sombreado e esfuminho sobre papel · Obra 02',
    votes: 0,
    percentage: 0,
    rank: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'desenho-3',
    title: 'Doçura e Ternura de Mãe',
    photographer: 'Candidato 03 (03.jpeg)',
    category: 'Ilustração & Moldura Barroca',
    description: 'Composição vibrante com traços expressivos e carismáticos da Virgem de Nazaré com o Menino Jesus sorridente com globo azul, emoldurada por arabescos dourados barrocos.',
    imageUrl: '/images/03.jpeg',
    cameraInfo: 'Lápis de cor, caneta e recorte artesanal · Obra 03',
    votes: 0,
    percentage: 0,
    rank: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'desenho-4',
    title: 'A Oração da Ave Maria',
    photographer: 'Candidato 04 (04.jpeg)',
    category: 'Grafite sobre Papel',
    description: 'Nossa Senhora em profunda oração com as mãos postas segurando o Santo Terço com crucifixo, sob os raios de um sol radiante entre nuvens, acompanhada pela oração manuscrita da Ave Maria.',
    imageUrl: '/images/04.jpeg',
    cameraInfo: 'Grafite e caligrafia manuscrita sobre papel · Obra 04',
    votes: 0,
    percentage: 0,
    rank: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'desenho-5',
    title: 'Manto das Rosas de Nazaré',
    photographer: 'Luan (05.jpeg)',
    category: 'Lápis de Cor & Grafite',
    description: 'Desenho colorido de Nossa Senhora de Nazaré com o Menino Jesus no colo, envolta em um manto branco adornado com rosas e espinhos, broche central do Círio e base hexagonal.',
    imageUrl: '/images/05.jpeg',
    cameraInfo: 'Lápis de cor e traço a mão sobre papel · Obra 05',
    votes: 0,
    percentage: 0,
    rank: 5,
    createdAt: new Date().toISOString(),
  },
];

export function getInitialContestData(): ContestData {
  return {
    contest: { ...INITIAL_CONTEST_SETTINGS },
    photos: INITIAL_PHOTOS.map((p) => ({ ...p })),
    totalVotes: 0,
    totalVoters: 0,
    recentVotes: [],
  };
}

/**
 * Robust image fallback resolver:
 * 1. Checks if src is valid
 * 2. If src fails, tries static image /images/0X.jpeg or /images/desenho-X.jpg
 * 3. If that fails, tries ARTWORK_BASE64[photoId]
 * 4. If that fails, tries DRAWING_FALLBACKS[photoId]
 */
export function getFallbackImageUrl(photoId: string, currentSrc?: string): string {
  if (currentSrc && currentSrc.startsWith('data:image/')) {
    return currentSrc;
  }
  if (ARTWORK_BASE64[photoId]) {
    return ARTWORK_BASE64[photoId];
  }
  if (DRAWING_FALLBACKS[photoId]) {
    return DRAWING_FALLBACKS[photoId];
  }
  return '/images/01.jpeg';
}
