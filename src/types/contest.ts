export interface PhotoEntry {
  id: string;
  title: string;
  photographer: string;
  category: string;
  description: string;
  imageUrl: string;
  cameraInfo?: string;
  votes: number;
  percentage: number;
  rank: number;
  createdAt: string;
}

export interface ContestSettings {
  id: string;
  title: string;
  subtitle: string;
  theme: string;
  status: 'active' | 'paused' | 'closed';
  allowRevote: boolean; // if true, allows user to change their 1 vote
  showLiveCountToParticipants: boolean;
  revealWinner: boolean; // hides top 1 until dramatic reveal
  prizeDescription: string;
  endsAt: string | null;
}

export interface VoteRecord {
  id: string;
  voterToken: string;
  ipHash: string;
  photoId: string;
  voterName?: string;
  timestamp: number;
}

export interface ContestData {
  contest: ContestSettings;
  photos: PhotoEntry[];
  totalVotes: number;
  totalVoters: number;
  recentVotes: {
    photoId: string;
    photoTitle: string;
    voterName?: string;
    timestamp: number;
  }[];
  votedNames?: string[];
}

export interface VoteResponse {
  success: boolean;
  message: string;
  votedPhotoId?: string;
  contestData?: ContestData;
}
