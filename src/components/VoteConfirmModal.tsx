import React, { useState, useEffect, useMemo } from 'react';
import type { PhotoEntry } from '../types/contest.ts';
import { normalizeVoterName } from '../hooks/useContest.ts';
import { CheckCircle2, AlertTriangle, X, User, ShieldCheck } from 'lucide-react';

interface VoteConfirmModalProps {
  photo: PhotoEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (photoId: string, voterName: string) => void;
  initialVoterName: string;
  isVoting: boolean;
  votedNames?: string[];
}

export const VoteConfirmModal: React.FC<VoteConfirmModalProps> = ({
  photo,
  isOpen,
  onClose,
  onConfirm,
  initialVoterName,
  isVoting,
  votedNames = [],
}) => {
  const [name, setName] = useState('');

  // Clear or reset name on open so each person types their own name
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  const trimmed = name.trim();
  const normalized = useMemo(() => normalizeVoterName(trimmed), [trimmed]);

  // Check if name has already voted
  const isNameAlreadyVoted = useMemo(() => {
    if (!trimmed || trimmed.length < 2) return false;
    return votedNames.some((vn) => normalizeVoterName(vn) === normalized);
  }, [trimmed, normalized, votedNames]);

  if (!isOpen || !photo) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || trimmed.length < 2 || isNameAlreadyVoted) return;
    onConfirm(photo.id, trimmed);
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

          {/* Rule Notice */}
          <div className="p-3.5 rounded-2xl flex items-start gap-3 border text-xs sm:text-sm bg-amber-500/10 border-amber-500/30 text-amber-200">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block">Regra: 1 Voto Por Nome</span>
              <span>
                Várias pessoas podem votar pelo mesmo celular ou computador, mas <strong>o mesmo nome não pode votar mais de uma vez</strong>.
              </span>
            </div>
          </div>

          {/* Voter Name Input (Mandatory) */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Seu Nome Completo <span className="text-rose-400">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Obrigatório</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Digite seu nome (Ex: Maria de Nazaré)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-white placeholder-slate-500 text-sm focus:outline-none transition-colors ${
                isNameAlreadyVoted
                  ? 'border-rose-500 focus:border-rose-500 bg-rose-950/20'
                  : 'border-slate-700 focus:border-amber-500'
              }`}
            />

            {/* Validation Feedback */}
            {isNameAlreadyVoted ? (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>
                  O nome <strong>"{trimmed}"</strong> já registrou um voto neste concurso. O mesmo nome não pode votar novamente.
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Identificação do participante para validação do voto único no mural da apuração.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isVoting}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVoting || !trimmed || trimmed.length < 2 || isNameAlreadyVoted}
              className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg transition-all ${
                !trimmed || trimmed.length < 2 || isNameAlreadyVoted
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/25 active:scale-95'
              }`}
            >
              {isVoting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Registrando...
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
