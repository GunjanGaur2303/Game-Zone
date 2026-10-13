import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Trophy, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

// Check if 8-puzzle is solvable
function isSolvable(tiles: number[]): boolean {
  let inversions = 0;
  for (let i = 0; i < tiles.length - 1; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] !== 0 && tiles[j] !== 0 && tiles[i] > tiles[j]) {
        inversions++;
      }
    }
  }
  return inversions % 2 === 0;
}

function generateSolvableTiles(): number[] {
  let tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  do {
    // Fisher-Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles) || isSolved(tiles));
  return tiles;
}

function isSolved(tiles: number[]): boolean {
  const goal = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  return tiles.every((val, idx) => val === goal[idx]);
}

export const PuzzleGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize game
  useEffect(() => {
    startNewGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startNewGame = () => {
    const newTiles = generateSolvableTiles();
    setTiles(newTiles);
    setMoves(0);
    setSeconds(0);
    setIsWon(false);
    setReward(null);
    startTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  };

  const handleTileClick = (index: number) => {
    if (isWon) return;

    const emptyIndex = tiles.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    // Check if adjacent
    const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

    if (isAdjacent) {
      sounds.playClick();
      const updated = [...tiles];
      updated[emptyIndex] = tiles[index];
      updated[index] = 0;
      setTiles(updated);
      setMoves((m) => m + 1);

      if (isSolved(updated)) {
        handleWin();
      }
    }
  };

  const handleWin = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsWon(true);
    sounds.playVictory();
    fireWinConfetti();

    const duration = Date.now() - startTimeRef.current;
    // Score based on moves and time: base 60 pts
    const scoreAward = Math.max(25, 70 - Math.floor(moves / 3) - Math.floor(seconds / 5));

    try {
      const res = await api.validateGameReward('PUZZLE', scoreAward, Math.max(duration, 3000), {
        moves,
        seconds,
      });
      setReward(res.pointsEarned);
      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch {
      // fallback
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
            Time: {formatTime(seconds)}
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white">Number Tile Puzzle</h2>
        <p className="text-xs text-slate-400">Slide tiles into numerical order 1 to 8 with empty space at end.</p>
      </div>

      {/* 3x3 Puzzle Board */}
      <div className="p-3 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-2xl mx-auto w-[310px] h-[310px]">
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-full h-full">
          {tiles.map((val, idx) => {
            if (val === 0) {
              return <div key={idx} className="rounded-xl bg-slate-950/60 border border-slate-800/40" />;
            }
            return (
              <button
                key={idx}
                disabled={isWon}
                onClick={() => handleTileClick(idx)}
                className={`w-full h-full rounded-xl flex items-center justify-center font-black text-2xl shadow-md transition-all active:scale-95 select-none ${
                  val === idx + 1
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border border-indigo-400/40'
                    : 'bg-gradient-to-br from-slate-800 to-slate-850 text-slate-200 border border-slate-700 hover:border-amber-500/50'
                }`}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Preview Toggle */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowHint(!showHint)}
          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showHint ? 'Hide Target Grid' : 'Show Target Goal'}</span>
        </button>
        <button
          onClick={startNewGame}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Puzzle</span>
        </button>
      </div>

      {showHint && (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2 animate-in fade-in">
          <span className="text-[11px] font-bold text-amber-400">Target Arrangement:</span>
          <div className="grid grid-cols-3 gap-1 w-28 mx-auto text-xs font-bold text-slate-400">
            <span className="bg-slate-900 py-1 rounded">1</span>
            <span className="bg-slate-900 py-1 rounded">2</span>
            <span className="bg-slate-900 py-1 rounded">3</span>
            <span className="bg-slate-900 py-1 rounded">4</span>
            <span className="bg-slate-900 py-1 rounded">5</span>
            <span className="bg-slate-900 py-1 rounded">6</span>
            <span className="bg-slate-900 py-1 rounded">7</span>
            <span className="bg-slate-900 py-1 rounded">8</span>
            <span className="bg-slate-900/40 py-1 rounded">_</span>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {isWon && (
        <div className="bg-slate-900 border border-emerald-600/50 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <Trophy className="w-6 h-6" />
            <h3 className="text-xl font-black">Puzzle Solved!</h3>
          </div>
          <p className="text-xs text-slate-300">
            Completed in {moves} moves and {formatTime(seconds)}!
          </p>
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3 rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-300">
              +{reward ?? 45} Points Credited to Wallet
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startNewGame}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-700"
            >
              Play Another
            </button>
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
            >
              Back to Arcade
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
