import React, { useState } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti, fireJackpotConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Sparkles, Trophy, Zap, Crown, HelpCircle } from 'lucide-react';
import { GameTutorialModal } from './GameTutorialModal';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface SymbolItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  baseVal: number;
}

const SYMBOLS: SymbolItem[] = [
  { id: 'ACE', name: 'Super Ace', icon: '🃏', color: '#EC4899', baseVal: 40 },
  { id: 'RUBY', name: 'Fortune Ruby', icon: '💎', color: '#EF4444', baseVal: 25 },
  { id: 'EMERALD', name: 'Jade Emerald', icon: '🟢', color: '#10B981', baseVal: 20 },
  { id: 'SAPPHIRE', name: 'Royal Sapphire', icon: '🔷', color: '#3B82F6', baseVal: 15 },
  { id: 'CROWN', name: 'Golden Crown', icon: '👑', color: '#F59E0B', baseVal: 30 },
  { id: 'INGOT', name: 'Gold Ingot', icon: '🪙', color: '#FBBF24', baseVal: 10 },
];

const MULTIPLIERS = [1, 2, 3, 5, 10, 15];

export const JiliFortuneGemsGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  // 3x3 main grid
  const [grid, setGrid] = useState<SymbolItem[][]>([
    [SYMBOLS[1], SYMBOLS[4], SYMBOLS[2]],
    [SYMBOLS[0], SYMBOLS[0], SYMBOLS[0]],
    [SYMBOLS[3], SYMBOLS[5], SYMBOLS[1]],
  ]);
  // 4th Reel Multiplier
  const [multiplier, setMultiplier] = useState<number>(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinsLeft, setSpinsLeft] = useState(8);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [winMessage, setWinMessage] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    return typeof window !== 'undefined' ? !localStorage.getItem('gameearn_tutorial_dismissed') : false;
  });

  const getRandomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const handleSpin = () => {
    if (isSpinning || spinsLeft <= 0) return;

    sounds.playCascade();
    setIsSpinning(true);
    setLastWin(null);
    setWinMessage(null);

    // Animate spin tumbles
    let counter = 0;
    const interval = setInterval(() => {
      counter++;
      setGrid([
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      ]);
      setMultiplier(MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)]);

      if (counter >= 12) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 90);
  };

  const finalizeSpin = () => {
    // Generate final grid
    const finalGrid: SymbolItem[][] = [
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
      [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
    ];

    // High win chance for player engagement
    const forceWin = Math.random() < 0.65;
    if (forceWin) {
      const luckySym = getRandomSymbol();
      // Line up middle row
      finalGrid[1] = [luckySym, luckySym, luckySym];
    }

    const finalMultiplier = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];

    setGrid(finalGrid);
    setMultiplier(finalMultiplier);
    setIsSpinning(false);
    setSpinsLeft((s) => s - 1);

    // Check paylines: 3 horizontal + 2 diagonals
    let matchScore = 0;
    let matchCount = 0;

    // Row 0, 1, 2
    for (let r = 0; r < 3; r++) {
      const row = finalGrid[r];
      if (
        (row[0].id === row[1].id && row[1].id === row[2].id) ||
        row[0].id === 'ACE' ||
        row[1].id === 'ACE' ||
        row[2].id === 'ACE'
      ) {
        matchScore += (row[1].baseVal || 20);
        matchCount++;
      }
    }

    // Diagonals
    if (finalGrid[0][0].id === finalGrid[1][1].id && finalGrid[1][1].id === finalGrid[2][2].id) {
      matchScore += finalGrid[1][1].baseVal;
      matchCount++;
    }

    if (matchScore > 0) {
      const totalWin = matchScore * finalMultiplier;
      setLastWin(totalWin);
      setSessionPoints((prev) => prev + totalWin);

      if (finalMultiplier >= 5 || totalWin >= 100) {
        sounds.playVictory();
        fireJackpotConfetti();
        setWinMessage(`🔥 MEGA WIN! ${matchCount} Payline(s) × ${finalMultiplier}X Multiplier!`);
      } else {
        sounds.playCoin();
        fireWinConfetti();
        setWinMessage(`✨ ${matchCount} Payline(s) Hit! Won +${totalWin} Points!`);
      }
    } else {
      sounds.playTick();
      setWinMessage('No match this round. Spin again!');
    }

    if (spinsLeft - 1 <= 0) {
      setTimeout(() => endGame(sessionPoints + matchScore * finalMultiplier), 1200);
    }
  };

  const endGame = async (finalTotal: number) => {
    setIsGameOver(true);
    try {
      const res = await api.validateGameReward('JILI', Math.max(finalTotal, 30), 4000, {
        multiplier,
      });
      setRewardClaimed(res.pointsEarned);
      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch {
      // ignore
    }
  };

  const restartGame = () => {
    setSpinsLeft(8);
    setSessionPoints(0);
    setLastWin(null);
    setWinMessage(null);
    setIsGameOver(false);
    setRewardClaimed(null);
  };

  return (
    <div className="flex flex-col max-w-md mx-auto w-full p-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setShowTutorial(true);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/80 transition-colors"
            title="View JILI Fortune Gems Mechanics & Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-bold tabular-nums text-slate-300">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 text-amber-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Session: {sessionPoints} Pts</span>
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-pink-400">
            Spins: {spinsLeft}/8
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
          <Crown className="w-3 h-3" />
          <span>JILI Arcade Series</span>
        </div>
        <h2 className="text-2xl font-black text-white">Golden Fortune Gems & Super Ace</h2>
        <p className="text-xs text-slate-400">Match 3 gem lines & trigger the 4th reel multiplier wheel!</p>
      </div>

      {/* JILI Arcade Cabinet Matrix */}
      <div className="bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
        {/* Subtle royal background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* 3x3 Grid + 4th Multiplier Reel */}
        <div className="grid grid-cols-4 gap-2 relative z-10">
          {/* Main 3x3 Reels (Cols 1, 2, 3) */}
          <div className="col-span-3 grid grid-cols-3 grid-rows-3 gap-2">
            {grid.map((row, rIdx) =>
              row.map((item, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`h-20 rounded-2xl flex flex-col items-center justify-center p-1 border shadow-md transition-all duration-200 select-none ${
                    rIdx === 1
                      ? 'bg-gradient-to-br from-slate-850 to-slate-900 border-amber-400/80 shadow-amber-500/10 scale-102 ring-1 ring-amber-400/30'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <span className="text-3xl filter drop-shadow-md">{item.icon}</span>
                  <span className="text-[9px] font-bold text-slate-400 tracking-tight mt-0.5 line-clamp-1">
                    {item.name}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 4th Reel: Multiplier Column */}
          <div className="col-span-1 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center p-2 text-slate-950 shadow-xl">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-200 mb-1">
              MULTIPLIER
            </span>
            <div className="w-14 h-14 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-inner">
              <span className="text-xl font-black text-amber-400 tabular-nums animate-pulse">
                {multiplier}X
              </span>
            </div>
            <span className="text-[9px] font-bold text-amber-200 mt-2 text-center leading-tight">
              Reel Boost
            </span>
          </div>
        </div>

        {/* Win Banner / Message */}
        <div className="min-h-[44px] flex items-center justify-center">
          {winMessage ? (
            <div className="text-center animate-in zoom-in-95">
              <span className="text-xs font-black text-amber-300 block">{winMessage}</span>
              {lastWin !== null && lastWin > 0 && (
                <span className="text-sm font-black text-emerald-400 tabular-nums">+{lastWin} Points Credited</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500">Hit the spin button to start cascading jewels</span>
          )}
        </div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || spinsLeft <= 0}
        className={`w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-2xl transition-all ${
          isSpinning || spinsLeft <= 0
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-[0.98] shadow-amber-500/25 ring-2 ring-amber-400/40'
        }`}
      >
        <Sparkles className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
        <span>{isSpinning ? 'SPINNING REELS...' : spinsLeft > 0 ? 'SPIN & WIN' : 'Out of Spins'}</span>
      </button>

      {/* Paytable info */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-slate-300 font-bold">
          <span>JILI Payout Table:</span>
          <span className="text-amber-400">4th Multiplier Reel (1x–15x)</span>
        </div>
        <p className="leading-relaxed">
          🃏 Super Ace substitutes for all gems. Match 3 on middle row or diagonals to multiply your score up to 15x.
        </p>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center">
            <Trophy className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-white">JILI Session Complete!</h3>
          <p className="text-xs text-slate-300">
            Total session points converted into verified wallet points.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-around">
            <div>
              <span className="text-[10px] text-slate-500 block">Total Score</span>
              <span className="text-lg font-bold text-white tabular-nums">{sessionPoints}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Reward Credited</span>
              <span className="text-lg font-black text-amber-400 tabular-nums">+{rewardClaimed ?? sessionPoints} Pts</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={restartGame}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Spin Again</span>
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
            >
              Arcade Lobby
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Overlay Modal */}
      <GameTutorialModal
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        initialGame="JILI"
      />
    </div>
  );
};
