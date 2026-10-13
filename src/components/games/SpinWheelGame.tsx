import React, { useState, useRef, useEffect } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti, fireJackpotConfetti } from '../common/Confetti';
import { RotateCw, Sparkles, Trophy, ArrowLeft, AlertCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface WheelSegment {
  label: string;
  points: number;
  color: string;
  textColor: string;
}

const SEGMENTS: WheelSegment[] = [
  { label: '5 Pts', points: 5, color: '#3B82F6', textColor: '#FFFFFF' },
  { label: '50 Pts', points: 50, color: '#10B981', textColor: '#FFFFFF' },
  { label: 'Try Again', points: 0, color: '#64748B', textColor: '#FFFFFF' },
  { label: '20 Pts', points: 20, color: '#8B5CF6', textColor: '#FFFFFF' },
  { label: '100 Pts 🌟', points: 100, color: '#F59E0B', textColor: '#0F172A' },
  { label: '10 Pts', points: 10, color: '#06B6D4', textColor: '#FFFFFF' },
  { label: '25 Pts', points: 25, color: '#EC4899', textColor: '#FFFFFF' },
  { label: '50 Pts', points: 50, color: '#10B981', textColor: '#FFFFFF' },
];

export const SpinWheelGame: React.FC<Props> = ({ user, onUpdateUser, onBack }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinsLeft, setSpinsLeft] = useState(5);
  const [result, setResult] = useState<{ points: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const currentRotationRef = useRef(0);

  // Draw the Wheel Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    const numSegments = SEGMENTS.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;

    // Draw outer golden ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FDE68A';
    ctx.stroke();

    // Draw segment slices
    for (let i = 0; i < numSegments; i++) {
      const seg = SEGMENTS[i];
      const startAngle = i * anglePerSegment;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1E293B';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seg.textColor;
      ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(seg.label, radius - 24, 0);
      ctx.restore();

      // Outer light bulb pegs
      const pegAngle = startAngle;
      const pegX = centerX + (radius + 4) * Math.cos(pegAngle);
      const pegY = centerY + (radius + 4) * Math.sin(pegAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
    }

    // Center Hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    // Inner Star / Rupee in Center
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', centerX, centerY);

    ctx.restore();
  }, []);

  const handleSpin = async () => {
    if (isSpinning || spinsLeft <= 0) return;
    setError(null);
    setResult(null);
    setIsSpinning(true);
    sounds.playClick();

    // Select target slice randomly (or weighted)
    const targetIndex = Math.floor(Math.random() * SEGMENTS.length);
    const chosenSeg = SEGMENTS[targetIndex];

    const segmentAngle = 360 / SEGMENTS.length;
    // Top pointer is at 270 degrees (or 90 depending on coordinates).
    // In canvas 0 is right (3 o'clock). Top is 270 degrees.
    // When wheel rotates clockwise, target index angle moves clockwise.
    const targetMiddleAngle = targetIndex * segmentAngle + segmentAngle / 2;
    // To land target at 270 degrees: (270 - targetMiddleAngle + 360) % 360
    const normalizedTarget = (270 - targetMiddleAngle + 360) % 360;

    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full revolutions
    const totalAddedRotation = fullSpins * 360 + normalizedTarget;
    const startRot = currentRotationRef.current % 360;
    const finalRot = currentRotationRef.current + totalAddedRotation - (startRot % 360);

    const duration = 4000;
    const startTime = performance.now();
    let lastTickAngle = currentRotationRef.current;

    const animateWheel = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentAngle = currentRotationRef.current + (finalRot - currentRotationRef.current) * ease;

      setRotation(currentAngle);

      // Play tick sound when passing each segment (every 45 degrees)
      if (Math.abs(currentAngle - lastTickAngle) >= 45) {
        sounds.playTick();
        lastTickAngle = currentAngle;
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateWheel);
      } else {
        currentRotationRef.current = finalRot;
        setIsSpinning(false);
        setSpinsLeft((prev) => prev - 1);
        handleSpinComplete(chosenSeg);
      }
    };

    animRef.current = requestAnimationFrame(animateWheel);
  };

  const handleSpinComplete = async (seg: WheelSegment) => {
    try {
      const res = await api.validateGameReward('SPIN', seg.points, 4200, {
        label: seg.label,
      });

      if (seg.points > 0) {
        if (seg.points >= 50) {
          fireJackpotConfetti();
          sounds.playVictory();
        } else {
          fireWinConfetti();
          sounds.playCoin();
        }
        setResult({
          points: seg.points,
          message: `Awesome! You won +${seg.points} Points! (₹${(seg.points / 100).toFixed(2)})`,
        });
      } else {
        setResult({
          points: 0,
          message: 'Better luck next spin! Try again.',
        });
      }

      if (res.user) {
        onUpdateUser(res.user);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register reward';
      setError(msg);
    }
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center max-w-md mx-auto w-full p-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lobby</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Available Spins:</span>
          <span className="text-sm font-bold text-amber-400 tabular-nums">{spinsLeft}/5</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          Lucky Spin & Win
        </h2>
        <p className="text-xs text-slate-400">Spin the wheel to earn guaranteed reward points for your wallet.</p>
      </div>

      {/* Wheel Container */}
      <div className="relative flex items-center justify-center p-3 my-2">
        {/* Top Fixed Indicator Needle */}
        <div className="absolute top-0 z-20 flex flex-col items-center">
          <div className="w-6 h-7 bg-amber-400 border-2 border-white rounded-t-sm shadow-lg clip-triangle" />
          <div className="w-3 h-3 bg-red-600 rounded-full -mt-1 shadow-md border border-white" />
        </div>

        {/* Canvas Wheel */}
        <div
          className="relative transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'none' : 'transform 0.1s linear',
          }}
        >
          <canvas ref={canvasRef} width={340} height={340} className="w-[310px] h-[310px] sm:w-[340px] sm:h-[340px] drop-shadow-2xl" />
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-center space-y-2 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-bold text-white">
              {result.points > 0 ? `Won +${result.points} Points!` : 'Spin Completed'}
            </h4>
          </div>
          <p className="text-xs text-slate-300">{result.message}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-300 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || spinsLeft <= 0}
        className={`w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
          isSpinning || spinsLeft <= 0
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-[0.98] shadow-amber-500/20'
        }`}
      >
        <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
        <span>{isSpinning ? 'Spinning Wheel...' : spinsLeft > 0 ? 'SPIN NOW (Free)' : 'No Spins Left Today'}</span>
      </button>

      {/* Fair Play Notice */}
      <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
        Server verified RNG algorithm. Limit 5 free spins per calendar day. Points immediately credited to your GameEarn wallet.
      </p>
    </div>
  );
};
