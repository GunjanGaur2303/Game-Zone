import React, { useState, useEffect } from 'react';
import { sounds } from '../../utils/audio';
import {
  X,
  Crosshair,
  Zap,
  Snowflake,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Crown,
  Play,
  HelpCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialGame?: 'FISHING' | 'JILI';
  onLaunchGame?: (gameId: 'FISHING' | 'JILI') => void;
}

interface StepItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge: string;
  badgeColor: string;
  content: string;
  tip?: string;
  visualGraphic: React.ReactNode;
}

export const GameTutorialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialGame = 'FISHING',
  onLaunchGame,
}) => {
  const [selectedGame, setSelectedGame] = useState<'FISHING' | 'JILI'>(initialGame);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (initialGame) {
      setSelectedGame(initialGame);
      setStepIndex(0);
    }
  }, [initialGame, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    if (dontShowAgain) {
      localStorage.setItem('gameearn_tutorial_dismissed', 'true');
    }
    onClose();
  };

  const handleLaunch = () => {
    sounds.playClick();
    if (dontShowAgain) {
      localStorage.setItem('gameearn_tutorial_dismissed', 'true');
    }
    onClose();
    if (onLaunchGame) {
      onLaunchGame(selectedGame);
    }
  };

  const fishingSteps: StepItem[] = [
    {
      title: 'Aim & Fire Electric Nets',
      subtitle: 'Full 360° touch targeting',
      icon: <Crosshair className="w-5 h-5 text-sky-400" />,
      badge: 'Step 1 of 4',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      content:
        'Tap or click anywhere in the deep ocean arena. The bottom turret cannon automatically rotates, tracks your target, and launches a high-voltage plasma projectile that bursts into an electric capture net upon collision.',
      tip: 'Lead your shots! Aim slightly ahead of swimming fish so the expanding net envelops them squarely.',
      visualGraphic: (
        <div className="relative h-32 w-full rounded-2xl bg-gradient-to-b from-sky-950 to-slate-950 border border-sky-800/60 p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center text-xs">
            <span className="text-sky-300 font-semibold flex items-center gap-1">
              <span>🐠</span> Clownfish Swimming Right
            </span>
            <span className="text-[10px] bg-sky-900/60 text-sky-200 px-2 py-0.5 rounded">Speed: 1.6x</span>
          </div>
          <div className="relative flex items-center justify-center">
            {/* Visual targeting beam */}
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-sky-400/80 bg-sky-500/20 flex items-center justify-center animate-pulse">
              <span className="text-xl">🕸️</span>
              <span className="text-[10px] font-bold text-sky-200 absolute -bottom-5">Capture Radius</span>
            </div>
          </div>
          <div className="flex justify-center text-[10px] text-slate-400">
            <span>Turret Cannon Positioned at Bottom</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Fish Species, Multipliers & Boss HP',
      subtitle: 'Target high-tier aquatic creatures',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      badge: 'Step 2 of 4',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      content:
        'Different fish have distinct health pools (HP) and point rewards. Small fish are captured in 1 shot, while mythic bosses like the Golden Dragon Fish require multiple concentrated net blasts.',
      tip: 'The Golden Dragon Fish yields 250 Points + triggers celebratory jackpot coins for your wallet ledger.',
      visualGraphic: (
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-2xl block">🐠</span>
            <span className="text-[10px] font-bold text-slate-200 block">Clownfish</span>
            <span className="text-[9px] text-emerald-400 font-bold block">+20 Pts · 1 HP</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
            <span className="text-2xl block">🐢</span>
            <span className="text-[10px] font-bold text-slate-200 block">Sea Turtle</span>
            <span className="text-[9px] text-emerald-400 font-bold block">+60 Pts · 2 HP</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/60 text-center space-y-1">
            <span className="text-2xl block animate-bounce">🐉</span>
            <span className="text-[10px] font-bold text-amber-300 block">Dragon Boss</span>
            <span className="text-[9px] text-amber-400 font-black block">+250 Pts · 4 HP</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Deep Freeze & Mega Net Skills',
      subtitle: 'Deploy tactical skill power-ups',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      badge: 'Step 3 of 4',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      content:
        'When multiple high-value targets swim across the screen, trigger your built-in battle skills to lock them in place or super-size your capture zone.',
      tip: 'Combine Deep Freeze with Mega Net when the Golden Dragon and Shark school together.',
      visualGraphic: (
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="p-3 rounded-xl bg-sky-950/50 border border-sky-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
              <Snowflake className="w-4 h-4" />
              <span>Deep Freeze</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Halts all swimming fish on screen for <strong>4 seconds</strong>, allowing precise multi-hit targeting.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>Mega Net</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Expands energy net diameter by <strong>1.5x</strong>, capturing entire clusters in a single shot.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Anti-Cheat Score & Wallet Credit',
      subtitle: 'Transparent, server-validated rewards',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      badge: 'Step 4 of 4',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      content:
        'All fishing expeditions are verified server-side. Your fish score scales directly into wallet points (up to 150 points per session) with an immutable cryptographic SHA-256 transaction hash.',
      tip: 'Accumulate points to redeem via instant UPI or IMPS Bank Transfer at 100 Points = ₹1.00.',
      visualGraphic: (
        <div className="p-3 rounded-xl bg-slate-950 border border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">TXN_FISHING_EXPEDITION</span>
            <span className="text-emerald-400 font-bold">STATUS: COMPLETED</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Session Catch: 12 Fishes</span>
            <span className="text-sm font-black text-amber-400 tabular-nums">+120 Pts (₹1.20)</span>
          </div>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>
        </div>
      ),
    },
  ];

  const jiliSteps: StepItem[] = [
    {
      title: '3x3 Gem Reels & Winning Paylines',
      subtitle: 'Iconic JILI cascade architecture',
      icon: <Crown className="w-5 h-5 text-amber-400" />,
      badge: 'Step 1 of 4',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      content:
        'JILI Fortune Gems features a 3-reel, 3-row dynamic gem matrix. Spin the reels to line up 3 matching gems across 5 paylines (Top, Middle, Bottom horizontal rows, and 2 diagonals).',
      tip: 'The center horizontal payline triggers the highest base payouts.',
      visualGraphic: (
        <div className="p-3 rounded-2xl bg-slate-950 border border-purple-800/60 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 w-44 mx-auto text-center">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">💎</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">🟢</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">🔷</div>
            {/* Center winning row */}
            <div className="p-2 rounded-lg bg-amber-500/20 border-2 border-amber-400 text-lg shadow-sm">💎</div>
            <div className="p-2 rounded-lg bg-amber-500/20 border-2 border-amber-400 text-lg shadow-sm">💎</div>
            <div className="p-2 rounded-lg bg-amber-500/20 border-2 border-amber-400 text-lg shadow-sm">💎</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">👑</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">🪙</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-lg">🟢</div>
          </div>
          <span className="text-[10px] text-amber-300 font-bold text-center block">
            ⭐ 3-in-a-row Horizontal Line Match!
          </span>
        </div>
      ),
    },
    {
      title: 'Super Ace Wild Cards',
      subtitle: 'Universal symbol substitution',
      icon: <Zap className="w-5 h-5 text-pink-400" />,
      badge: 'Step 2 of 4',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      content:
        'The signature JILI Super Ace card (🃏) functions as a Wild symbol. It automatically substitutes for ANY gem (Ruby, Emerald, Sapphire, Crown, or Ingot) to turn near-misses into high-scoring payline combinations.',
      tip: 'Landing 3 Super Ace cards together triggers the highest base symbol payout of 40 Points!',
      visualGraphic: (
        <div className="flex items-center justify-center gap-2 p-3 bg-purple-950/40 rounded-2xl border border-purple-800/80">
          <div className="w-14 h-20 rounded-xl bg-slate-900 border-2 border-pink-500 flex flex-col items-center justify-center shadow-lg">
            <span className="text-2xl">🃏</span>
            <span className="text-[8px] font-black text-pink-400 uppercase mt-1">Super Ace</span>
          </div>
          <span className="text-sm font-bold text-slate-400">+</span>
          <div className="w-14 h-20 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
            <span className="text-2xl">💎</span>
            <span className="text-[8px] font-bold text-slate-400 mt-1">Ruby</span>
          </div>
          <div className="w-14 h-20 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
            <span className="text-2xl">💎</span>
            <span className="text-[8px] font-bold text-slate-400 mt-1">Ruby</span>
          </div>
          <span className="text-xs font-black text-emerald-400 ml-1">= WIN!</span>
        </div>
      ),
    },
    {
      title: 'The 4th Multiplier Wheel',
      subtitle: 'Multiply wins by up to 15X',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      badge: 'Step 3 of 4',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      content:
        'Positioned to the right of the 3x3 grid is JILI’s iconic 4th Multiplier Reel. It spins alongside every turn, landing on 1x, 2x, 3x, 5x, 10x, or a massive 15x multiplier. When you hit a line, the entire win is boosted!',
      tip: 'A 10x or 15x multiplier turns a regular 20 pt win into an instant 200–300 point jackpot.',
      visualGraphic: (
        <div className="p-3 bg-slate-950 rounded-2xl border border-amber-500/40 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">Base Payline Win</span>
            <span className="text-base font-bold text-white tabular-nums">35 Points</span>
          </div>
          <span className="text-xl font-bold text-amber-400">×</span>
          <div className="w-12 h-12 rounded-full bg-amber-500 border-2 border-amber-300 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-base font-black text-slate-950">10X</span>
          </div>
          <span className="text-xl font-bold text-amber-400">=</span>
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] text-emerald-400 block font-bold">Total Payout</span>
            <span className="text-lg font-black text-amber-400 tabular-nums">+350 Pts</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Daily Session Quests & Ledger',
      subtitle: 'Earn up to 160 Points per session',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      badge: 'Step 4 of 4',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      content:
        'You receive 8 free spins per session. All points earned during your rounds are directly transferred to your available points balance and recorded in your immutable transaction history.',
      tip: 'Complete the "JILI Fortune Master" daily quest to earn an extra +100 bonus points!',
      visualGraphic: (
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-300 font-semibold">
            <span>Daily Quest Target: Score 150+ in JILI</span>
            <span className="text-amber-400 font-bold">+100 Pts</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 w-3/4 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-500 block">75% completed · Claim reward in Dashboard</span>
        </div>
      ),
    },
  ];

  const currentSteps = selectedGame === 'FISHING' ? fishingSteps : jiliSteps;
  const currentStep = currentSteps[stepIndex];

  const handleNext = () => {
    sounds.playClick();
    if (stepIndex < currentSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleLaunch();
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">How to Play & Win</h3>
              <p className="text-[11px] text-slate-400">Master game mechanics to maximize reward points</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Switcher Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame('FISHING');
                setStepIndex(0);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedGame === 'FISHING'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🎣</span>
              <span>Fishing Era</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame('JILI');
                setStepIndex(0);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                selectedGame === 'JILI'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>🎰</span>
              <span>JILI Games</span>
            </button>
          </div>
        </div>

        {/* Step Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Step Badge & Step Counter */}
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStep.badgeColor}`}
            >
              {currentStep.badge}
            </span>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {currentSteps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    sounds.playClick();
                    setStepIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    stepIndex === idx
                      ? selectedGame === 'FISHING'
                        ? 'w-6 bg-sky-400'
                        : 'w-6 bg-amber-400'
                      : 'w-1.5 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {currentStep.icon}
              <h4 className="text-base font-black text-white">{currentStep.title}</h4>
            </div>
            <p className="text-xs text-slate-400">{currentStep.subtitle}</p>
          </div>

          {/* Interactive Graphic Card */}
          <div className="py-1">{currentStep.visualGraphic}</div>

          {/* Explanatory Prose */}
          <p className="text-xs text-slate-300 leading-relaxed">{currentStep.content}</p>

          {/* Pro Tip Box */}
          {currentStep.tip && (
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                💡 Pro-Player Tip
              </span>
              <p className="text-[11px] text-slate-300 leading-tight">{currentStep.tip}</p>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
          {/* Don't show again toggle */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 bg-slate-900"
              />
              <span className="text-[11px]">Don’t show automatically on start</span>
            </label>
            <span className="text-[11px] text-slate-500">You can re-open via ? Help</span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-lg ${
                selectedGame === 'FISHING'
                  ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {stepIndex < currentSteps.length - 1 ? (
                <>
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Playing {selectedGame === 'FISHING' ? 'Fishing Era' : 'JILI Gems'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
