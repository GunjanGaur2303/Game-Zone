import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Trophy, CheckCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface CardItem {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = ['🪙', '🎮', '🏆', '💎', '⚡', '🎁', '🎯', '👑'];

export const MemoryMatchGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // Generate pairs
    const deck: CardItem[] = [];
    let idCounter = 0;
    ICONS.forEach((icon) => {
      deck.push({ id: idCounter++, icon, isFlipped: false, isMatched: false });
      deck.push({ id: idCounter++, icon, isFlipped: false, isMatched: false });
    });

    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsWon(false);
    setReward(null);
    startTimeRef.current = Date.now();
  };

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2 || isWon) {
      return;
    }

    sounds.playClick();
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Matched
        setTimeout(() => {
          sounds.playCoin();
          const matchedDeck = [...cards];
          matchedDeck[firstIdx].isMatched = true;
          matchedDeck[secondIdx].isMatched = true;
          setCards(matchedDeck);
          setFlippedIndices([]);
          const newPairs = matchedPairs + 1;
          setMatchedPairs(newPairs);

          if (newPairs === ICONS.length) {
            handleVictory();
          }
        }, 400);
      } else {
        // Not matched - flip back
        setTimeout(() => {
          const revertedDeck = [...cards];
          revertedDeck[firstIdx].isFlipped = false;
          revertedDeck[secondIdx].isFlipped = false;
          setCards(revertedDeck);
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const handleVictory = async () => {
    setIsWon(true);
    sounds.playVictory();
    fireWinConfetti();

    const duration = Date.now() - startTimeRef.current;
    const scorePoints = Math.max(20, 50 - Math.floor((moves - 8) * 2));

    try {
      const res = await api.validateGameReward('MEMORY', scorePoints, Math.max(duration, 3000), {
        moves,
      });
      setReward(res.pointsEarned);
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

        <div className="flex items-center gap-3 text-xs font-semibold tabular-nums text-slate-300">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">Moves: {moves}</span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-amber-400">
            Pairs: {matchedPairs}/{ICONS.length}
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white">Memory Card Match</h2>
        <p className="text-xs text-slate-400">Flip cards to reveal pairs with minimum moves.</p>
      </div>

      {/* 4x4 Grid */}
      <div className="p-3 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-xl mx-auto w-[320px] h-[320px]">
        <div className="grid grid-cols-4 grid-rows-4 gap-2 w-full h-full">
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;

            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(idx)}
                disabled={card.isMatched || isWon}
                className={`w-full h-full rounded-xl flex items-center justify-center text-2xl transition-all duration-300 select-none shadow-md ${
                  card.isMatched
                    ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 scale-95 opacity-80'
                    : isRevealed
                    ? 'bg-slate-800 border-2 border-amber-400 text-white scale-100 rotate-0'
                    : 'bg-gradient-to-br from-indigo-900 to-slate-850 border border-indigo-700/60 text-indigo-300 hover:border-amber-400/50'
                }`}
              >
                {isRevealed ? card.icon : '❓'}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={startNewGame}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Shuffle & Restart</span>
        </button>
      </div>

      {/* Win Modal */}
      {isWon && (
        <div className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Trophy className="w-6 h-6" />
            <h3 className="text-xl font-black">Memory Cleared!</h3>
          </div>
          <p className="text-xs text-slate-300">
            All 8 pairs matched in {moves} moves!
          </p>
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">
              +{reward ?? 35} Points Credited to Wallet
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startNewGame}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700"
            >
              Play Again
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
    </div>
  );
};
