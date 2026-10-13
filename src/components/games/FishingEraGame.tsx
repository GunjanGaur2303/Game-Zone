import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti, fireJackpotConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Zap, Snowflake, Award, Crosshair, HelpCircle } from 'lucide-react';
import { GameTutorialModal } from './GameTutorialModal';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

interface Fish {
  id: number;
  type: 'clown' | 'puffer' | 'turtle' | 'shark' | 'dragon';
  name: string;
  x: number;
  y: number;
  vx: number;
  size: number;
  hp: number;
  maxHp: number;
  points: number;
  color: string;
  emoji: string;
  dir: 1 | -1; // 1 = right, -1 = left
}

interface NetProjectile {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  isExpanded: boolean;
  expandTimer: number;
  isSuper: boolean;
}

interface CoinParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  text?: string;
}

const FISH_CONFIGS = [
  { type: 'clown' as const, name: 'Clownfish', size: 18, points: 20, maxHp: 1, speed: 1.6, color: '#F97316', emoji: '🐠' },
  { type: 'puffer' as const, name: 'Pufferfish', size: 22, points: 35, maxHp: 1, speed: 1.2, color: '#FBBF24', emoji: '🐡' },
  { type: 'turtle' as const, name: 'Sea Turtle', size: 28, points: 60, maxHp: 2, speed: 0.9, color: '#10B981', emoji: '🐢' },
  { type: 'shark' as const, name: 'Blue Shark', size: 36, points: 100, maxHp: 3, speed: 1.4, color: '#38BDF8', emoji: '🦈' },
  { type: 'dragon' as const, name: 'Golden Dragon Fish', size: 44, points: 250, maxHp: 4, speed: 0.7, color: '#EAB308', emoji: '🐉' },
];

export const FishingEraGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(25);
  const [fishCaught, setFishCaught] = useState(0);
  const [freezeActive, setFreezeActive] = useState(false);
  const [superNetActive, setSuperNetActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(() => {
    return typeof window !== 'undefined' ? !localStorage.getItem('gameearn_tutorial_dismissed') : false;
  });

  const gameStateRef = useRef<{
    fishes: Fish[];
    nets: NetProjectile[];
    particles: CoinParticle[];
    aimAngle: number;
    cannonX: number;
    cannonY: number;
    isFrozen: boolean;
    freezeUntil: number;
    isSuperNet: boolean;
    score: number;
    fishCaughtCount: number;
    shotsLeft: number;
    gameOver: boolean;
    fishIdCounter: number;
  }>({
    fishes: [],
    nets: [],
    particles: [],
    aimAngle: -Math.PI / 2,
    cannonX: 170,
    cannonY: 420,
    isFrozen: false,
    freezeUntil: 0,
    isSuperNet: false,
    score: 0,
    fishCaughtCount: 0,
    shotsLeft: 25,
    gameOver: false,
    fishIdCounter: 1,
  });

  const startTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);

  const spawnFish = useCallback((canvasWidth: number, canvasHeight: number) => {
    const state = gameStateRef.current;
    if (state.fishes.length >= 9) return;

    // Pick random fish type (weighted: clownfish common, dragon rare)
    const rand = Math.random();
    let cfg = FISH_CONFIGS[0];
    if (rand > 0.92) cfg = FISH_CONFIGS[4]; // Dragon
    else if (rand > 0.8) cfg = FISH_CONFIGS[3]; // Shark
    else if (rand > 0.55) cfg = FISH_CONFIGS[2]; // Turtle
    else if (rand > 0.3) cfg = FISH_CONFIGS[1]; // Puffer

    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
    const startX = dir === 1 ? -40 : canvasWidth + 40;
    const startY = 40 + Math.random() * (canvasHeight - 140);
    const vx = dir * (cfg.speed + Math.random() * 0.4);

    state.fishes.push({
      id: state.fishIdCounter++,
      type: cfg.type,
      name: cfg.name,
      x: startX,
      y: startY,
      vx,
      size: cfg.size,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      points: cfg.points,
      color: cfg.color,
      emoji: cfg.emoji,
      dir,
    });
  }, []);

  const initGame = useCallback(() => {
    const width = 340;
    const height = 440;

    gameStateRef.current = {
      fishes: [],
      nets: [],
      particles: [],
      aimAngle: -Math.PI / 2,
      cannonX: width / 2,
      cannonY: height - 25,
      isFrozen: false,
      freezeUntil: 0,
      isSuperNet: false,
      score: 0,
      fishCaughtCount: 0,
      shotsLeft: 25,
      gameOver: false,
      fishIdCounter: 1,
    };

    setScore(0);
    setShotsLeft(25);
    setFishCaught(0);
    setFreezeActive(false);
    setSuperNetActive(false);
    setGameOver(false);
    setReward(null);
    startTimeRef.current = Date.now();

    // Initial school of fish
    for (let i = 0; i < 6; i++) {
      spawnFish(width, height);
    }
  }, [spawnFish]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      const state = gameStateRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Deep Ocean Gradient Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#0369A1'); // Sunlight top
      oceanGrad.addColorStop(0.4, '#0C4A6E');
      oceanGrad.addColorStop(1, '#082F49'); // Deep seabed
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Sun rays shimmering from surface
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(w * 0.2 * i, 0);
        ctx.lineTo(w * 0.2 * i + 40, h);
        ctx.lineTo(w * 0.2 * i + 80, h);
        ctx.lineTo(w * 0.2 * i + 30, 0);
        ctx.fill();
      }
      ctx.restore();

      // Check freeze skill timer
      const now = Date.now();
      if (state.isFrozen && now > state.freezeUntil) {
        state.isFrozen = false;
        setFreezeActive(false);
      }

      // Spawn fish periodically
      if (Math.random() < 0.03) {
        spawnFish(w, h);
      }

      // Update & Draw Fishes
      for (let i = state.fishes.length - 1; i >= 0; i--) {
        const fish = state.fishes[i];

        if (!state.isFrozen) {
          fish.x += fish.vx;
        }

        // Remove if off screen
        if ((fish.dir === 1 && fish.x > w + 60) || (fish.dir === -1 && fish.x < -60)) {
          state.fishes.splice(i, 1);
          continue;
        }

        // Draw Fish Body & Emoji Icon
        ctx.save();
        ctx.translate(fish.x, fish.y);

        // Subdued glow for Dragon and Shark
        if (fish.type === 'dragon' || fish.type === 'shark') {
          ctx.beginPath();
          ctx.arc(0, 0, fish.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = fish.type === 'dragon' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }

        // Draw fish emoji scaled
        ctx.font = `${fish.size * 1.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (fish.dir === -1) {
          ctx.scale(-1, 1);
        }
        ctx.fillText(fish.emoji, 0, 0);

        // Draw HP bar if maxHp > 1
        if (fish.maxHp > 1) {
          const barW = fish.size * 1.2;
          const barH = 3;
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(-barW / 2, -fish.size * 0.9, barW, barH);
          ctx.fillStyle = fish.hp > 1 ? '#10B981' : '#EF4444';
          ctx.fillRect(-barW / 2, -fish.size * 0.9, (fish.hp / fish.maxHp) * barW, barH);
        }

        ctx.restore();
      }

      // Update & Draw Nets
      for (let i = state.nets.length - 1; i >= 0; i--) {
        const net = state.nets[i];

        if (!net.isExpanded) {
          // Flying projectile towards target
          net.x += net.vx;
          net.y += net.vy;

          // Draw energy projectile
          ctx.beginPath();
          ctx.arc(net.x, net.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = net.isSuper ? '#F59E0B' : '#38BDF8';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();

          // Laser trail
          ctx.beginPath();
          ctx.moveTo(state.cannonX, state.cannonY);
          ctx.lineTo(net.x, net.y);
          ctx.strokeStyle = net.isSuper ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();

          const distToTarget = Math.hypot(net.targetX - net.x, net.targetY - net.y);
          if (distToTarget < 15 || net.y <= 20) {
            net.isExpanded = true;
            net.expandTimer = 16;
            checkNetFishCollisions(net);
          }
        } else {
          // Expanded Capture Net Ring
          net.expandTimer -= 1;
          const maxRadius = net.isSuper ? 55 : 38;
          const currentRadius = maxRadius * (1 - net.expandTimer / 16);

          ctx.save();
          ctx.beginPath();
          ctx.arc(net.x, net.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = net.isSuper ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = net.isSuper ? '#FDE047' : '#BAE6FD';
          ctx.setLineDash([4, 4]);
          ctx.stroke();

          // Inner grid web
          ctx.beginPath();
          ctx.arc(net.x, net.y, currentRadius * 0.6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          if (net.expandTimer <= 0) {
            state.nets.splice(i, 1);
          }
        }
      }

      // Update & Draw Floating Score & Coin Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          if (p.text) {
            ctx.fillStyle = '#FBBF24';
            ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.text, p.x, p.y);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#F59E0B';
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // Draw Turret Cannon at Bottom
      ctx.save();
      ctx.translate(state.cannonX, state.cannonY);
      ctx.rotate(state.aimAngle + Math.PI / 2);

      // Cannon Barrel
      ctx.fillStyle = state.isSuperNet ? '#D97706' : '#1E293B';
      ctx.fillRect(-10, -32, 20, 32);
      ctx.lineWidth = 2;
      ctx.strokeStyle = state.isSuperNet ? '#FDE047' : '#38BDF8';
      ctx.strokeRect(-10, -32, 20, 32);

      // Cannon Muzzle Ring
      ctx.fillStyle = state.isSuperNet ? '#F59E0B' : '#0284C7';
      ctx.fillRect(-12, -36, 24, 6);

      // Cannon Base
      ctx.restore();
      ctx.beginPath();
      ctx.arc(state.cannonX, state.cannonY, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = state.isSuperNet ? '#F59E0B' : '#38BDF8';
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LV1', state.cannonX, state.cannonY);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [spawnFish]);

  const checkNetFishCollisions = (net: NetProjectile) => {
    const state = gameStateRef.current;
    const captureRadius = net.isSuper ? 50 : 35;

    for (let i = state.fishes.length - 1; i >= 0; i--) {
      const fish = state.fishes[i];
      const dist = Math.hypot(fish.x - net.x, fish.y - net.y);

      if (dist <= captureRadius + fish.size * 0.7) {
        fish.hp -= 1;

        if (fish.hp <= 0) {
          // Fish captured!
          sounds.playCoin();
          state.score += fish.points;
          state.fishCaughtCount += 1;
          setScore(state.score);
          setFishCaught(state.fishCaughtCount);

          // Spawn floating text
          state.particles.push({
            x: fish.x,
            y: fish.y,
            vx: 0,
            vy: -1.5,
            alpha: 1,
            text: `+${fish.points}`,
          });

          // Gold coin sparks
          for (let p = 0; p < 6; p++) {
            state.particles.push({
              x: fish.x,
              y: fish.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              alpha: 1,
            });
          }

          if (fish.type === 'dragon') {
            fireJackpotConfetti();
          }

          state.fishes.splice(i, 1);
        } else {
          // Hit flash sound
          sounds.playTick();
        }
      }
    }
  };

  const handleShoot = (targetX: number, targetY: number) => {
    const state = gameStateRef.current;
    if (state.shotsLeft <= 0 || state.gameOver) return;

    sounds.playLaser();
    const cannonX = state.cannonX;
    const cannonY = state.cannonY;

    const angle = Math.atan2(targetY - cannonY, targetX - cannonX);
    state.aimAngle = angle;

    const speed = 12;
    state.nets.push({
      x: cannonX,
      y: cannonY,
      targetX,
      targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6,
      isExpanded: false,
      expandTimer: 0,
      isSuper: state.isSuperNet,
    });

    state.shotsLeft -= 1;
    setShotsLeft(state.shotsLeft);

    if (state.isSuperNet) {
      state.isSuperNet = false;
      setSuperNetActive(false);
    }

    if (state.shotsLeft <= 0) {
      setTimeout(() => endGame(), 1000);
    }
  };

  const handleCanvasClickOrTouch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (!e.touches[0]) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const targetX = clientX - rect.left;
    const targetY = clientY - rect.top;

    handleShoot(targetX, targetY);
  };

  const handleActivateFreeze = () => {
    const state = gameStateRef.current;
    if (state.isFrozen) return;
    sounds.playClick();
    state.isFrozen = true;
    state.freezeUntil = Date.now() + 4000;
    setFreezeActive(true);
  };

  const handleActivateSuperNet = () => {
    const state = gameStateRef.current;
    sounds.playClick();
    state.isSuperNet = true;
    setSuperNetActive(true);
  };

  const endGame = async () => {
    const state = gameStateRef.current;
    state.gameOver = true;
    setGameOver(true);

    const duration = Date.now() - startTimeRef.current;
    try {
      const res = await api.validateGameReward('FISHING', state.score, Math.max(duration, 3000), {
        fishCaught: state.fishCaughtCount,
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
            className="flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 px-2.5 py-1.5 rounded-lg bg-sky-950/60 border border-sky-800/80 transition-colors"
            title="View Fishing Era Mechanics & Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-bold tabular-nums text-slate-300">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>Score: {score}</span>
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-sky-400 flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Ammo: {shotsLeft}</span>
          </span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
          <span>Fishing Era: Ocean Hunter</span>
        </h2>
        <p className="text-xs text-slate-400">Tap anywhere on the deep sea to fire electric capture nets at swimming fish.</p>
      </div>

      {/* Canvas Area */}
      <div className="relative mx-auto rounded-3xl overflow-hidden border-2 border-sky-600/50 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={340}
          height={440}
          onClick={handleCanvasClickOrTouch}
          onTouchStart={handleCanvasClickOrTouch}
          className="cursor-crosshair block touch-none"
        />

        {/* In-game Skills Bar */}
        {!gameOver && (
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
            <button
              onClick={handleActivateFreeze}
              disabled={freezeActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
                freezeActive
                  ? 'bg-sky-500 text-white animate-pulse'
                  : 'bg-slate-950/80 border border-sky-400/50 text-sky-300 hover:bg-sky-950'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5" />
              <span>{freezeActive ? 'Frozen!' : 'Freeze (4s)'}</span>
            </button>

            <button
              onClick={handleActivateSuperNet}
              disabled={superNetActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
                superNetActive
                  ? 'bg-amber-500 text-slate-950 animate-bounce'
                  : 'bg-slate-950/80 border border-amber-400/50 text-amber-300 hover:bg-amber-950'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{superNetActive ? 'Mega Net Ready' : 'Mega Net'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
          <h3 className="text-xl font-black text-white">Ocean Expedition Completed!</h3>
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 block">Fish Captured</span>
              <span className="text-xl font-bold text-white tabular-nums">{fishCaught}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Reward Points</span>
              <span className="text-xl font-bold text-amber-400 tabular-nums">+{reward ?? Math.floor(score / 10)} Pts</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={initGame}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hunt Again</span>
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
        initialGame="FISHING"
      />
    </div>
  );
};
