import React, { useState, useEffect, useRef } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, Timer, Award, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  explanation: string;
}

const QUESTIONS_POOL: Question[] = [
  {
    id: 1,
    question: 'Who captained the Indian Cricket Team to its first ICC Cricket World Cup victory in 1983?',
    options: ['Sunil Gavaskar', 'Kapil Dev', 'Mohinder Amarnath', 'Ravi Shastri'],
    correctIndex: 1,
    category: 'Cricket',
    explanation: 'Kapil Dev led India to its historic 1983 World Cup victory defeating West Indies at Lord’s.',
  },
  {
    id: 2,
    question: 'Which Indian space mission successfully achieved a soft landing on the south polar region of the Moon in 2023?',
    options: ['Mangalyaan', 'Chandrayaan-2', 'Chandrayaan-3', 'Aditya-L1'],
    correctIndex: 2,
    category: 'Science',
    explanation: 'ISRO’s Chandrayaan-3 achieved lunar south pole landing on August 23, 2023.',
  },
  {
    id: 3,
    question: 'What is the highest civilian award in India?',
    options: ['Padma Vibhushan', 'Bharat Ratna', 'Param Vir Chakra', 'Padma Bhushan'],
    correctIndex: 1,
    category: 'GK',
    explanation: 'Bharat Ratna is India’s highest civilian honour, instituted in 1954.',
  },
  {
    id: 4,
    question: 'Which Indian river is known as the "Sorrow of Bihar" due to its frequent devastating floods?',
    options: ['Kosi River', 'Gandak River', 'Son River', 'Ghaghara River'],
    correctIndex: 0,
    category: 'Geography',
    explanation: 'The Kosi River changes its course frequently, causing major seasonal inundations in Bihar.',
  },
  {
    id: 5,
    question: 'In which year did the Indian Premier League (IPL) stage its inaugural tournament?',
    options: ['2006', '2007', '2008', '2009'],
    correctIndex: 2,
    category: 'Sports',
    explanation: 'The inaugural IPL season was held in 2008, won by the Rajasthan Royals.',
  },
];

export const QuizGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQ = QUESTIONS_POOL[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || isFinished) return;

    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, isFinished]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    sounds.playIncorrect();
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      sounds.playCorrect();
      // Points based on time remaining: 20 base + up to 10 bonus
      const points = 20 + timeLeft;
      setScore((s) => s + points);
      setCorrectCount((c) => c + 1);
    } else {
      sounds.playIncorrect();
    }
  };

  const handleNext = () => {
    sounds.playClick();
    if (currentIndex < QUESTIONS_POOL.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    setSubmitting(true);
    const duration = Date.now() - startTimeRef.current;

    try {
      const res = await api.validateGameReward('QUIZ', score, Math.max(duration, 3000), {
        correctCount,
        total: QUESTIONS_POOL.length,
      });

      setEarnedPoints(res.pointsEarned);
      if (res.pointsEarned > 0) {
        sounds.playVictory();
        fireWinConfetti();
      }
      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setIsFinished(false);
    setEarnedPoints(null);
    startTimeRef.current = Date.now();
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded-md tabular-nums">
            <Award className="w-3.5 h-3.5" />
            <span>{score} Pts</span>
          </div>
        </div>
      </div>

      {!isFinished ? (
        <>
          {/* Progress & Timer bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Question {currentIndex + 1} of {QUESTIONS_POOL.length} · {currentQ.category}
              </span>
              <div className="flex items-center gap-1 font-bold tabular-nums text-amber-400">
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / QUESTIONS_POOL.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white leading-snug">{currentQ.question}</h3>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                let btnStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800';

                if (isAnswered) {
                  if (idx === currentQ.correctIndex) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                  } else {
                    btnStyle = 'bg-slate-900/40 border-slate-800 text-slate-500';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-xl border text-left font-medium text-sm flex items-center justify-between transition-all active:scale-[0.99] ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && idx === currentQ.correctIndex && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation reveal */}
            {isAnswered && (
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1 text-xs animate-in fade-in">
                <span className="font-bold text-amber-400">Explanation:</span>
                <p className="text-slate-300 leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}
          </div>

          {/* Next Button */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="w-full h-12 bg-amber-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-amber-400 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
            >
              {currentIndex < QUESTIONS_POOL.length - 1 ? 'Next Question' : 'See Final Results'}
            </button>
          )}
        </>
      ) : (
        /* Final Results */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white">Quiz Completed!</h3>
            <p className="text-xs text-slate-400">
              You scored {correctCount} out of {QUESTIONS_POOL.length} questions correctly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[11px] text-slate-500 block">Game Score</span>
              <span className="text-xl font-black text-white tabular-nums">{score}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Reward Points</span>
              <span className="text-xl font-black text-amber-400 tabular-nums">
                {submitting ? '...' : `+${earnedPoints ?? score} Pts`}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={restartQuiz}
              className="flex-1 h-12 bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
            <button
              onClick={onBack}
              className="flex-1 h-12 bg-amber-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20"
            >
              Back to Games
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
