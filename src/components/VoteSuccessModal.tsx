import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles, UserPlus, ArrowRight, Heart } from 'lucide-react';

interface VoteSuccessModalProps {
  isOpen: boolean;
  voterName: string;
  photoTitle: string;
  onNewVote: () => void;
  onViewResults: () => void;
}

export const VoteSuccessModal: React.FC<VoteSuccessModalProps> = ({
  isOpen,
  voterName,
  photoTitle,
  onNewVote,
  onViewResults,
}) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(5);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onNewVote();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onNewVote]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onNewVote}
    >
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Success Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-in zoom-in duration-300" />
          <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-950">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        {/* Title & Voter Details */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Voto Computado com Sucesso!
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Obrigado pelo seu voto!
          </h2>
          <p className="text-sm text-slate-300">
            Voto de <strong className="text-amber-400 font-bold">{voterName}</strong> confirmado para a obra:
          </p>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold text-sm">
            "{photoTitle}"
          </div>
        </div>

        {/* Clear for Next Voter Explanatory Box */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-left flex items-start gap-2.5">
          <Heart className="w-4 h-4 shrink-0 text-amber-400 mt-0.5 fill-amber-400" />
          <div>
            <span className="font-bold block text-white">Aparelho liberado para novo voto!</span>
            <span>Outras pessoas podem votar imediatamente por este mesmo aparelho informando seus próprios nomes.</span>
          </div>
        </div>

        {/* Countdown timer */}
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400">
            Liberando tela automaticamente em <span className="font-bold text-emerald-400 font-mono">{countdown}s</span>...
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onNewVote}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Liberar Agora para Novo Voto</span>
          </button>

          <button
            onClick={onViewResults}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
          >
            <span>Ver Apuração Parcial dos Votos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
