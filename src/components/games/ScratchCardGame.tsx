import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, Sparkles, Trophy, CheckCircle, RotateCcw } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

export const ScratchCardGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [prizePoints, setPrizePoints] = useState(50);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [cardsLeft, setCardsLeft] = useState(3);

  const isScratchingRef = useRef(false);
  const lastSoundTimeRef = useRef(0);

  const initCard = useCallback(() => {
    // Generate mystery prize
    const prizes = [25, 40, 50, 75, 100];
    const chosen = prizes[Math.floor(Math.random() * prizes.length)];
    setPrizePoints(chosen);
    setScratchPercent(0);
    setIsRevealed(false);
    setRewardClaimed(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.globalCompositeOperation = 'source-over';

    // Draw metallic silver foil pattern
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#94A3B8');
    grad.addColorStop(0.3, '#E2E8F0');
    grad.addColorStop(0.5, '#CBD5E1');
    grad.addColorStop(0.8, '#F1F5F9');
    grad.addColorStop(1, '#94A3B8');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative stamps on foil
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ RUB TO SCRATCH & WIN ✨', w / 2, h / 2 - 15);

    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Guaranteed Wallet Points', w / 2, h / 2 + 15);
  }, []);

  useEffect(() => {
    initCard();
  }, [initCard]);

  const scratch = (clientX: number, clientY: number) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Sound throttle
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 120) {
      sounds.playClick();
      lastSoundTimeRef.current = now;
    }

    // Check scratch percentage every 10 scratches
    checkPercentage();
  };

  const checkPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    let transparentCount = 0;
    const totalPixels = data.length / 4;

    for (let i = 3; i < data.length; i += 16) {
      if (data[i] === 0) transparentCount++;
    }

    const pct = Math.floor((transparentCount / (totalPixels / 4)) * 100);
    setScratchPercent(pct);

    if (pct >= 45 && !isRevealed) {
      revealFullCard();
    }
  };

  const revealFullCard = async () => {
    setIsRevealed(true);
    setCardsLeft((c) => Math.max(0, c - 1));
    sounds.playVictory();
    fireWinConfetti();

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    try {
      const res = await api.validateGameReward('SCRATCH', prizePoints, 2500, {
        points: prizePoints,
      });
      setRewardClaimed(true);
      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col max-w-md mx-auto w-full p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Cards Remaining:</span>
          <span className="text-xs font-bold text-amber-400 tabular-nums">{cardsLeft}/3</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Mystery Scratch Card
        </h2>
        <p className="text-xs text-slate-400">Scratch the silver foil with your finger to reveal instant rewards.</p>
      </div>

      {/* Scratch Container */}
      <div className="relative mx-auto w-[310px] h-[210px] rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4">
        {/* Underneath Mystery Prize */}
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none select-none text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-lg animate-pulse">
            <Trophy className="w-7 h-7" />
          </div>
          <span className="text-3xl font-black text-amber-400 tabular-nums">+{prizePoints} Points!</span>
          <span className="text-xs font-semibold text-slate-300">Worth ₹{(prizePoints / 100).toFixed(2)} in Wallet</span>
        </div>

        {/* Scratch Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={310}
          height={210}
          onMouseDown={() => (isScratchingRef.current = true)}
          onMouseUp={() => (isScratchingRef.current = false)}
          onMouseLeave={() => (isScratchingRef.current = false)}
          onMouseMove={(e) => {
            if (isScratchingRef.current) scratch(e.clientX, e.clientY);
          }}
          onTouchStart={() => (isScratchingRef.current = true)}
          onTouchEnd={() => (isScratchingRef.current = false)}
          onTouchMove={(e) => {
            if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
          }}
          className={`absolute inset-0 w-full h-full cursor-pointer touch-none transition-opacity duration-300 ${
            isRevealed ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      {/* Progress & Help */}
      <div className="space-y-2 text-center">
        {!isRevealed ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400 px-2">
              <span>Foil Cleared</span>
              <span className="font-bold tabular-nums text-amber-400">{scratchPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${scratchPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center space-y-1 animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Reward Claimed Successfully!</span>
            </div>
            <p className="text-xs text-slate-300">+{prizePoints} points credited to your ledger.</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={initCard}
          disabled={cardsLeft <= 0}
          className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700 disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{cardsLeft > 0 ? 'Next Scratch Card' : 'No Cards Left'}</span>
        </button>
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
        >
          Back to Games
        </button>
      </div>
    </div>
  );
};
