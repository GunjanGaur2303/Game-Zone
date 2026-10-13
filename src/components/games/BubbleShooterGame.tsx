import React, { useRef, useEffect, useState, useCallback } from 'react';
import { sounds } from '../../utils/audio';
import { api } from '../../utils/api';
import { UserProfile } from '../../types';
import { fireWinConfetti } from '../common/Confetti';
import { ArrowLeft, RotateCcw, Award } from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onBack: () => void;
}

const COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#A855F7'];
const BUBBLE_RADIUS = 16;
const ROWS = 6;
const COLS = 9;

interface Bubble {
  row: number;
  col: number;
  x: number;
  y: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
}

export const BubbleShooterGame: React.FC<Props> = ({ onUpdateUser, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [shotsLeft, setShotsLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [reward, setReward] = useState<number | null>(null);

  const gameStateRef = useRef<{
    grid: (Bubble | null)[][];
    currentBubbleColor: string;
    nextBubbleColor: string;
    aimAngle: number;
    flyingBubble: { x: number; y: number; vx: number; vy: number; color: string } | null;
    particles: Particle[];
    score: number;
    shotsLeft: number;
    gameOver: boolean;
    bubblesPopped: number;
  }>({
    grid: [],
    currentBubbleColor: COLORS[0],
    nextBubbleColor: COLORS[1],
    aimAngle: -Math.PI / 2,
    flyingBubble: null,
    particles: [],
    score: 0,
    shotsLeft: 20,
    gameOver: false,
    bubblesPopped: 0,
  });

  const startTimeRef = useRef<number>(Date.now());
  const animFrameRef = useRef<number | null>(null);

  const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

  // Initialize Grid
  const initGrid = useCallback(() => {
    const grid: (Bubble | null)[][] = [];
    const width = 320;
    const colSpacing = (width - BUBBLE_RADIUS * 2) / (COLS - 1);

    for (let r = 0; r < ROWS; r++) {
      grid[r] = [];
      const offset = (r % 2 === 1) ? colSpacing / 2 : 0;
      for (let c = 0; c < COLS; c++) {
        if (r < 4) {
          // Fill top 4 rows
          const x = BUBBLE_RADIUS + c * colSpacing + offset;
          const y = BUBBLE_RADIUS + r * (BUBBLE_RADIUS * 1.75);
          grid[r][c] = {
            row: r,
            col: c,
            x,
            y,
            color: getRandomColor(),
          };
        } else {
          grid[r][c] = null;
        }
      }
    }

    gameStateRef.current = {
      grid,
      currentBubbleColor: getRandomColor(),
      nextBubbleColor: getRandomColor(),
      aimAngle: -Math.PI / 2,
      flyingBubble: null,
      particles: [],
      score: 0,
      shotsLeft: 20,
      gameOver: false,
      bubblesPopped: 0,
    };

    setScore(0);
    setShotsLeft(20);
    setGameOver(false);
    setReward(null);
    startTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    initGrid();
  }, [initGrid]);

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
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid lines
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);

      // Danger line at bottom of play area
      const dangerY = height - 70;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(0, dangerY);
      ctx.lineTo(width, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Grid Bubbles
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const b = state.grid[r]?.[c];
          if (b) {
            drawGlossyBubble(ctx, b.x, b.y, BUBBLE_RADIUS, b.color);
          }
        }
      }

      // Update & Draw Flying Bubble
      if (state.flyingBubble) {
        state.flyingBubble.x += state.flyingBubble.vx;
        state.flyingBubble.y += state.flyingBubble.vy;

        // Bounce on side walls
        if (state.flyingBubble.x <= BUBBLE_RADIUS) {
          state.flyingBubble.x = BUBBLE_RADIUS;
          state.flyingBubble.vx = -state.flyingBubble.vx;
        } else if (state.flyingBubble.x >= width - BUBBLE_RADIUS) {
          state.flyingBubble.x = width - BUBBLE_RADIUS;
          state.flyingBubble.vx = -state.flyingBubble.vx;
        }

        // Check collision with top or bubbles
        let collided = false;
        if (state.flyingBubble.y <= BUBBLE_RADIUS) {
          collided = true;
        } else {
          for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
              const b = state.grid[r]?.[c];
              if (b) {
                const dist = Math.hypot(b.x - state.flyingBubble.x, b.y - state.flyingBubble.y);
                if (dist <= BUBBLE_RADIUS * 1.85) {
                  collided = true;
                  break;
                }
              }
            }
            if (collided) break;
          }
        }

        if (collided) {
          snapBubbleToGrid(state.flyingBubble);
          state.flyingBubble = null;
        } else {
          drawGlossyBubble(ctx, state.flyingBubble.x, state.flyingBubble.y, BUBBLE_RADIUS, state.flyingBubble.color);
        }
      }

      // Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Draw Aiming Guide Line
      const cannonX = width / 2;
      const cannonY = height - 32;

      ctx.beginPath();
      ctx.moveTo(cannonX, cannonY);
      ctx.lineTo(cannonX + Math.cos(state.aimAngle) * 60, cannonY + Math.sin(state.aimAngle) * 60);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Next Bubble Preview
      ctx.beginPath();
      ctx.arc(cannonX - 45, cannonY, 11, 0, Math.PI * 2);
      ctx.fillStyle = state.nextBubbleColor;
      ctx.fill();

      // Draw Cannon Base & Ready Bubble
      ctx.beginPath();
      ctx.arc(cannonX, cannonY, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();

      drawGlossyBubble(ctx, cannonX, cannonY, BUBBLE_RADIUS, state.currentBubbleColor);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const drawGlossyBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.stroke();

    // Gloss highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
  };

  const snapBubbleToGrid = (flying: { x: number; y: number; color: string }) => {
    const state = gameStateRef.current;
    const width = 320;
    const colSpacing = (width - BUBBLE_RADIUS * 2) / (COLS - 1);

    // Find closest cell
    let closestRow = 0;
    let closestCol = 0;
    let minDist = Infinity;

    for (let r = 0; r < ROWS; r++) {
      const offset = (r % 2 === 1) ? colSpacing / 2 : 0;
      for (let c = 0; c < COLS; c++) {
        if (!state.grid[r][c]) {
          const cx = BUBBLE_RADIUS + c * colSpacing + offset;
          const cy = BUBBLE_RADIUS + r * (BUBBLE_RADIUS * 1.75);
          const dist = Math.hypot(cx - flying.x, cy - flying.y);
          if (dist < minDist) {
            minDist = dist;
            closestRow = r;
            closestCol = c;
          }
        }
      }
    }

    const offset = (closestRow % 2 === 1) ? colSpacing / 2 : 0;
    const placedX = BUBBLE_RADIUS + closestCol * colSpacing + offset;
    const placedY = BUBBLE_RADIUS + closestRow * (BUBBLE_RADIUS * 1.75);

    const placedBubble: Bubble = {
      row: closestRow,
      col: closestCol,
      x: placedX,
      y: placedY,
      color: flying.color,
    };
    state.grid[closestRow][closestCol] = placedBubble;

    // Check cluster matching
    const cluster = findCluster(closestRow, closestCol, flying.color);
    if (cluster.length >= 3) {
      sounds.playPop();
      // Remove popped bubbles & create particles
      cluster.forEach((b) => {
        state.grid[b.row][b.col] = null;
        for (let i = 0; i < 6; i++) {
          state.particles.push({
            x: b.x,
            y: b.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            color: b.color,
            alpha: 1,
          });
        }
      });

      const pts = cluster.length * 25;
      state.score += pts;
      state.bubblesPopped += cluster.length;
      setScore(state.score);
    }

    // Prepare next bubble
    state.currentBubbleColor = state.nextBubbleColor;
    state.nextBubbleColor = getRandomColor();
    state.shotsLeft -= 1;
    setShotsLeft(state.shotsLeft);

    // Check game over
    if (state.shotsLeft <= 0 || closestRow >= ROWS - 1) {
      endGame();
    }
  };

  const findCluster = (startR: number, startC: number, matchColor: string): Bubble[] => {
    const state = gameStateRef.current;
    const visited = new Set<string>();
    const cluster: Bubble[] = [];

    const getNeighbors = (r: number, c: number) => {
      const isOdd = r % 2 === 1;
      const offsets = isOdd
        ? [
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, 0],
            [1, 1],
          ]
        : [
            [-1, -1],
            [-1, 0],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
          ];

      return offsets
        .map(([dr, dc]) => [r + dr, c + dc])
        .filter(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS);
    };

    const queue: [number, number][] = [[startR, startC]];
    visited.add(`${startR},${startC}`);

    while (queue.length > 0) {
      const [r, c] = queue.shift()!;
      const bubble = state.grid[r]?.[c];
      if (bubble && bubble.color === matchColor) {
        cluster.push(bubble);
        getNeighbors(r, c).forEach(([nr, nc]) => {
          const key = `${nr},${nc}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        });
      }
    }

    return cluster;
  };

  const handleShoot = () => {
    const state = gameStateRef.current;
    if (state.flyingBubble || state.gameOver) return;

    sounds.playShoot();
    const width = 320;
    const height = 400;
    const cannonX = width / 2;
    const cannonY = height - 32;
    const speed = 10;

    state.flyingBubble = {
      x: cannonX,
      y: cannonY,
      vx: Math.cos(state.aimAngle) * speed,
      vy: Math.sin(state.aimAngle) * speed,
      color: state.currentBubbleColor,
    };
  };

  const handleCanvasTouchOrMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const cannonX = canvas.width / 2;
    const cannonY = canvas.height - 32;

    const angle = Math.atan2(mouseY - cannonY, mouseX - cannonX);
    // Constrain aim to upper half (-160 deg to -20 deg)
    if (angle < -0.3 && angle > -Math.PI + 0.3) {
      gameStateRef.current.aimAngle = angle;
    }
  };

  const endGame = async () => {
    const state = gameStateRef.current;
    state.gameOver = true;
    setGameOver(true);

    const duration = Date.now() - startTimeRef.current;
    try {
      const res = await api.validateGameReward('BUBBLE', state.score, Math.max(duration, 3000), {
        bubblesPopped: state.bubblesPopped,
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
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-bold tabular-nums text-slate-300">
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1 text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>Score: {score}</span>
          </span>
          <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">Shots: {shotsLeft}</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white">Bubble Blaster Space</h2>
        <p className="text-xs text-slate-400">Aim and shoot to pop clusters of 3+ matching color bubbles.</p>
      </div>

      {/* Canvas Area */}
      <div className="relative mx-auto rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={320}
          height={400}
          onMouseMove={handleCanvasTouchOrMove}
          onTouchMove={handleCanvasTouchOrMove}
          onClick={handleShoot}
          onTouchEnd={handleShoot}
          className="cursor-crosshair block touch-none"
        />

        {/* Tap to shoot hint */}
        {!gameOver && (
          <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-slate-500 font-medium">
            Drag to aim · Tap to shoot
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95">
          <h3 className="text-xl font-black text-white">Session Complete!</h3>
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 block">Final Score</span>
              <span className="text-xl font-bold text-white tabular-nums">{score}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Reward Points</span>
              <span className="text-xl font-bold text-amber-400 tabular-nums">+{reward ?? Math.floor(score / 15)} Pts</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={initGrid}
              className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
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
