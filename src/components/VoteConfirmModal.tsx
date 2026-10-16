import React, { useState } from 'react';
import type { PhotoEntry } from '../types/contest.ts';
import { CheckCircle2, AlertTriangle, X, User } from 'lucide-react';

interface VoteConfirmModalProps {
  photo: PhotoEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoId: string, voterName?: string) => void;
  initialVoterName: string;
  isVoting: boolean;
  hasAlreadyVoted: boolean;
  allowRevote: boolean;
}

export const VoteConfirmModal: React.FC<VoteConfirmModalProps> = ({
  photo,
  isOpen,
  onClose,
  onConfirm,
  initialVoterName,
  isVoting,
  hasAlreadyVoted,
  allowRevote,
}) => {
  const [name, setName] = useState(initialVoterName);

  if (!isOpen || !photo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(photo.id, name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isVoting}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo Preview banner */}
        <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/90 text-slate-950 shadow">
            {photo.category}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 pt-3 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white leading-tight">
              {photo.title}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Desenho por <span className="text-amber-400 font-semibold">{photo.photographer}</span>
            </p>
          </div>

          {/* 1 Vote Notice */}
          <div className={`p-3.5 rounded-2xl flex items-start gap-3 border text-xs sm:text-sm ${
            hasAlreadyVoted && !allowRevote
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
              hasAlreadyVoted && !allowRevote ? 'text-rose-400' : 'text-amber-400'
            }`} />
            <div>
              <span className="font-bold block">Regra: 1 voto por pessoa</span>
              {hasAlreadyVoted && allowRevote ? (
                <span>Você já votou anteriormente. Confirmar agora irá <strong>transferir seu voto único</strong> para este desenho.</span>
              ) : hasAlreadyVoted && !allowRevote ? (
                <span>Você já registrou seu voto nesta exposição. O regulamento não permite nova votação.</span>
              ) : (
                <span>Você só pode votar 1 vez nesta escolha. Certifique-se de que este é o seu desenho favorito!</span>
              )}
            </div>
          </div>

          {/* Voter Name Input (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Seu nome ou apelido (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ana Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Aparecerá no mural de votos recentes na tela do telão.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isVoting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={isVoting || (hasAlreadyVoted && !allowRevote)}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg transition-all ${
                hasAlreadyVoted && !allowRevote
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95'
              }`}
            >
              {isVoting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Computando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Voto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
