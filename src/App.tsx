import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useContest } from './hooks/useContest.ts';
import { Navbar } from './components/Navbar.tsx';
import { VotingGallery } from './components/VotingGallery.tsx';
import { LiveStage } from './components/LiveStage.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { ResultsView } from './components/ResultsView.tsx';
import { PhotoDetailModal } from './components/PhotoDetailModal.tsx';
import { VoteConfirmModal } from './components/VoteConfirmModal.tsx';
import { QRCodeModal } from './components/QRCodeModal.tsx';
import { ImageInsertModal } from './components/ImageInsertModal.tsx';
import { playVoteChime } from './utils/audio.ts';
import type { PhotoEntry } from './types/contest.ts';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const {
    contest,
    photos,
    totalVotes,
    totalVoters,
    recentVotes,
    loading,
    error,
    votedPhotoId,
    voterName,
    setVoterName,
    isVoting,
    voteMessage,
    clearVoteMessage,
    isLiveConnected,
    vote,
    addPhoto,
    deletePhoto,
    updatePhoto,
    updateSettings,
    resetVotes,
    restoreDemo,
    simulateVote,
    restoreBackup,
    downloadBackup,
    downloadCsv,
  } = useContest();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<'gallery' | 'stage' | 'results' | 'admin'>('gallery');

  // Modals
  const [selectedPhotoForDetail, setSelectedPhotoForDetail] = useState<PhotoEntry | null>(null);
  const [photoToVote, setPhotoToVote] = useState<PhotoEntry | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [targetPhotoForQr, setTargetPhotoForQr] = useState<PhotoEntry | null>(null);
  const [targetPhotoForUpload, setTargetPhotoForUpload] = useState<PhotoEntry | null>(null);

  // Read URL query parameter on mount (e.g. ?mode=stage, ?mode=vote, ?mode=results, or ?voteFor=desenho-1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'stage' || mode === 'telao') {
        setCurrentTab('stage');
      } else if (mode === 'vote' || mode === 'galeria') {
        setCurrentTab('gallery');
      } else if (mode === 'results' || mode === 'resultado' || mode === 'apuracao') {
        setCurrentTab('results');
      } else if (mode === 'admin') {
        setCurrentTab('admin');
      }
    }
  }, []);

  // When photos load, check if user scanned a direct drawing QR code (?voteFor=desenho-X)
  useEffect(() => {
    if (typeof window !== 'undefined' && photos.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const voteTarget = params.get('voteFor') || params.get('photoId');
      if (voteTarget) {
        const found = photos.find((p) => p.id === voteTarget);
        if (found) {
          setCurrentTab('gallery');
          setPhotoToVote(found);
        }
      }
    }
  }, [photos]);

  // Sync selected photo details if rankings/votes update
  useEffect(() => {
    if (selectedPhotoForDetail) {
      const updated = photos.find((p) => p.id === selectedPhotoForDetail.id);
      if (updated) {
        setSelectedPhotoForDetail(updated);
      }
    }
  }, [photos, selectedPhotoForDetail]);

  // Handle vote initiation (opens confirmation modal)
  const handleInitiateVote = (photo: PhotoEntry) => {
    // If voting closed, ignore
    if (contest?.status !== 'active') return;

    // If user already voted and revote is disabled, notify
    if (votedPhotoId && !contest?.allowRevote) {
      alert('Você já registrou seu voto neste concurso. O regulamento permite apenas 1 voto por pessoa.');
      return;
    }

    setPhotoToVote(photo);
  };

  // Submit vote
  const handleConfirmVote = async (photoId: string, name?: string) => {
    const res = await vote(photoId, name);
    if (res.success) {
      setPhotoToVote(null);
      // Play celebratory sound
      playVoteChime();

      // Confetti burst on client
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#10b981', '#ffffff'],
      });
    }
  };

  // Next / Prev in detail modal
  const handleNextPhoto = () => {
    if (!selectedPhotoForDetail) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhotoForDetail.id);
    const nextIndex = (currentIndex + 1) % photos.length;
    setSelectedPhotoForDetail(photos[nextIndex]);
  };

  const handlePrevPhoto = () => {
    if (!selectedPhotoForDetail) return;
    const currentIndex = photos.findIndex((p) => p.id === selectedPhotoForDetail.id);
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    setSelectedPhotoForDetail(photos[prevIndex]);
  };

  const contestData = {
    contest: contest!,
    photos,
    totalVotes,
    totalVoters,
    recentVotes,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white tracking-wide">Carregando Exposição de Arte em Desenho...</h2>
        <p className="text-xs text-slate-500 mt-1">Conectando ao sistema de votação em tempo real</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {voteMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in slide-in-from-top-4 duration-300">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 ${
              voteMessage.type === 'success'
                ? 'bg-slate-900 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-900 border-rose-500/60 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {voteMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-semibold">{voteMessage.text}</span>
            </div>
            <button
              onClick={clearVoteMessage}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenQrModal={() => {
          setTargetPhotoForQr(null);
          setIsQrModalOpen(true);
        }}
        onOpenInsertModal={() => {
          setTargetPhotoForUpload(null);
          setIsUploaderOpen(true);
        }}
        hasVoted={!!votedPhotoId}
        isLiveConnected={isLiveConnected}
        totalVotes={totalVotes}
      />

      {/* Main View router */}
      <main className="flex-1">
        {currentTab === 'gallery' && (
          <VotingGallery
            data={contestData}
            votedPhotoId={votedPhotoId}
            onSelectPhoto={(photo) => setSelectedPhotoForDetail(photo)}
            onVoteClick={handleInitiateVote}
            onOpenQrModal={() => {
              setTargetPhotoForQr(null);
              setIsQrModalOpen(true);
            }}
            onOpenUploadModal={() => {
              setTargetPhotoForUpload(null);
              setIsUploaderOpen(true);
            }}
            onOpenQrForPhoto={(photo) => {
              setTargetPhotoForQr(photo);
              setIsQrModalOpen(true);
            }}
            onOpenUploadForPhoto={(photo) => {
              setTargetPhotoForUpload(photo);
              setIsUploaderOpen(true);
            }}
          />
        )}

        {currentTab === 'stage' && (
          <LiveStage
            data={contestData}
            onSimulateVote={simulateVote}
            onSelectPhoto={(photo) => setSelectedPhotoForDetail(photo)}
          />
        )}

        {currentTab === 'results' && (
          <ResultsView
            data={contestData}
            onSelectPhoto={(photo) => setSelectedPhotoForDetail(photo)}
            onUpdateSettings={updateSettings}
            onRestoreBackup={restoreBackup}
            onDownloadBackup={downloadBackup}
            onDownloadCsv={downloadCsv}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanel
            data={contestData}
            onAddPhoto={addPhoto}
            onDeletePhoto={deletePhoto}
            onUpdateSettings={updateSettings}
            onResetVotes={resetVotes}
            onRestoreDemo={restoreDemo}
            onSimulateVote={simulateVote}
            onOpenUploadModal={() => {
              setTargetPhotoForUpload(null);
              setIsUploaderOpen(true);
            }}
            onViewResults={() => setCurrentTab('results')}
            onRestoreBackup={restoreBackup}
            onDownloadBackup={downloadBackup}
            onDownloadCsv={downloadCsv}
          />
        )}
      </main>

      {/* Modals */}
      {/* 1. High Resolution Detail & Lightbox Modal */}
      <PhotoDetailModal
        photo={selectedPhotoForDetail}
        isOpen={!!selectedPhotoForDetail}
        onClose={() => setSelectedPhotoForDetail(null)}
        onVoteClick={(p) => {
          setSelectedPhotoForDetail(null);
          handleInitiateVote(p);
        }}
        onPrev={photos.length > 1 ? handlePrevPhoto : undefined}
        onNext={photos.length > 1 ? handleNextPhoto : undefined}
        hasVotedForThis={selectedPhotoForDetail?.id === votedPhotoId}
        hasAlreadyVoted={!!votedPhotoId}
        allowRevote={contest?.allowRevote || false}
        isVotingClosed={contest?.status !== 'active'}
      />

      {/* 2. Vote Confirmation Modal (1 Vote Guard) */}
      <VoteConfirmModal
        photo={photoToVote}
        isOpen={!!photoToVote}
        onClose={() => setPhotoToVote(null)}
        onConfirm={handleConfirmVote}
        initialVoterName={voterName}
        isVoting={isVoting}
        hasAlreadyVoted={!!votedPhotoId}
        allowRevote={contest?.allowRevote || false}
      />

      {/* 3. QR Code Generator Modal (General or Artwork Specific) */}
      <QRCodeModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setTargetPhotoForQr(null);
        }}
        contestTitle={contest?.title || 'ESCOLHA DO DESENHO DE NOSSA SENHORA DE NAZARÉ'}
        photos={photos}
        initialPhotoId={targetPhotoForQr?.id || null}
      />

      {/* 4. Automated Image Insertion & QR Code Generation Modal */}
      <ImageInsertModal
        isOpen={isUploaderOpen}
        onClose={() => {
          setIsUploaderOpen(false);
          setTargetPhotoForUpload(null);
        }}
        photos={photos}
        onUpdatePhoto={updatePhoto}
        onAddPhoto={addPhoto}
        initialTargetPhotoId={targetPhotoForUpload?.id || null}
      />
    </div>
  );
}
