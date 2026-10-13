import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Timer, Zap, Trophy } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface MathProblem {
  expression: string;
  answer: number;
  options: number[];
}

function generateProblem(): MathProblem {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let ans = 0;

  if (op === '+') {
    a = Math.floor(Math.random() * 40) + 10;
    b = Math.floor(Math.random() * 40) + 10;
    ans = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 50) + 20;
    b = Math.floor(Math.random() * (a - 10)) + 5;
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 12) + 2;
    b = Math.floor(Math.random() * 12) + 2;
    ans = a * b;
  }

  // Generate 3 unique wrong options
  const optionsSet = new Set<number>([ans]);
  while (optionsSet.size < 4) {
    const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 8) + 1);
    const candidate = ans + delta;
    if (candidate > 0) optionsSet.add(candidate);
  }

  const options = Array.from(optionsSet);
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    expression: `${a} ${op} ${b}`,
    answer: ans,
    options,
  };
}

export const NumberSprintGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const [problem, setProblem] = useState<MathProblem>(generateProblem);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const endGame = useCallback(async (finalScore: number, finalStreak: number) => {
    setIsGameOver(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = Date.now() - startTimeRef.current;
    try {
      const res = await api.validateGameReward('NUMBER', finalScore, Math.max(duration, 3000), {
        streak: finalStreak,
      });

      setReward(res.pointsEarned);
      if (res.pointsEarned > 0) {
        sounds.playVictory();
        fireWinConfetti();
      }
      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch {
      // ignore
    }
  }, [onUpdateUser]);

  useEffect(() => {
    if (isStarted && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            endGame(score, maxStreak);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isGameOver, score, maxStreak, endGame]);

  const handleStart = () => {
    sounds.playClick();
    setIsStarted(true);
    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(30);
    setProblem(generateProblem());
    startTimeRef.current = Date.now();
  };

  const handleAnswer = (choice: number) => {
    if (isGameOver || !isStarted) return;

    if (choice === problem.answer) {
      sounds.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      const multiplier = Math.min(Math.floor(newStreak / 3) + 1, 4);
      setScore((s) => s + 1 * multiplier);
      setProblem(generateProblem());
    } else {
      sounds.playIncorrect();
      setStreak(0);
      setProblem(generateProblem());
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

        <div className="flex items-center gap-3 text-xs font-bold tabular-nums text-slate-300">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 text-amber-400">
            <Timer className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Score: {score}</span>
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white">Math Speed Sprint</h2>
        <p className="text-xs text-slate-400">Solve as many arithmetic equations as you can in 30 seconds.</p>
      </div>

      {!isStarted && !isGameOver ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl mx-auto flex items-center justify-center border border-amber-500/20">
            <Zap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Ready for the Sprint?</h3>
            <p className="text-xs text-slate-400">
              Build streaks to activate up to 4x score multiplier!
            </p>
          </div>
          <button
            onClick={handleStart}
            className="w-full h-12 bg-amber-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-all active:scale-98 shadow-lg shadow-amber-500/20"
          >
            Start 30-Second Sprint
          </button>
        </div>
      ) : !isGameOver ? (
        <div className="space-y-4">
          {/* Streak Indicator */}
          {streak > 1 && (
            <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-400 animate-bounce">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>{streak}x Combo Streak!</span>
            </div>
          )}

          {/* Equation Box */}
          <div className="bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-6 text-center shadow-xl">
            <span className="text-4xl font-black text-white tracking-wider tabular-nums">
              {problem.expression} = ?
            </span>
          </div>

          {/* 4 Choices */}
          <div className="grid grid-cols-2 gap-3">
            {problem.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="h-16 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-white font-black text-2xl transition-all active:scale-95 shadow-md tabular-nums"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results Screen */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 animate-in zoom-in-95">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <Trophy className="w-6 h-6" />
            <h3 className="text-xl font-black text-white">Time’s Up!</h3>
          </div>
          <p className="text-xs text-slate-300">
            Great sprint! Max combo achieved: {maxStreak} in a row.
          </p>

          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 block">Questions Solved</span>
              <span className="text-xl font-bold text-white tabular-nums">{score}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Reward Points</span>
              <span className="text-xl font-bold text-amber-400 tabular-nums">+{reward ?? score * 5} Pts</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
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
