import React, { useState, useEffect } from 'react';
import { UserProfile, DailyQuest } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import { fireWinConfetti } from '../common/Confetti';
import {
  Sparkles,
  Flame,
  ArrowRight,
  Gift,
  Trophy,
  CheckCircle,
  Play,
  Share2,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onNavigateTab: (tab: 'GAMES' | 'WALLET' | 'REFER' | 'PROFILE') => void;
  onSelectGame: (gameId: string) => void;
  onOpenWithdraw: () => void;
  onOpenTutorial?: (gameId?: 'FISHING' | 'JILI') => void;
}

const STREAK_DAYS = [
  { day: 1, points: 10 },
  { day: 2, points: 15 },
  { day: 3, points: 25 },
  { day: 4, points: 35 },
  { day: 5, points: 50 },
  { day: 6, points: 75 },
  { day: 7, points: 100, bonus: 'Scratch Card' },
];

export const DashboardView: React.FC<Props> = ({
  user,
  onUpdateUser,
  onNavigateTab,
  onSelectGame,
  onOpenWithdraw,
  onOpenTutorial,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [claimingCheckIn, setClaimingCheckIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; message: string }>>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isCheckedInToday = user.lastCheckInDate === todayStr;

  useEffect(() => {
    api.getQuests().then(setQuests).catch(() => {});
    api.getAnnouncements().then(setAnnouncements).catch(() => {});
  }, []);

  const handleClaimDaily = async () => {
    if (isCheckedInToday || claimingCheckIn) return;
    setClaimingCheckIn(true);
    sounds.playClick();

    try {
      const res = await api.claimDailyCheckIn();
      sounds.playCoin();
      fireWinConfetti();
      setCheckInMsg(`Claimed +${res.pointsEarned} Points for Day ${res.newStreak}!`);
      onUpdateUser(res.user);
    } catch (err: unknown) {
      setCheckInMsg(err instanceof Error ? err.message : 'Already checked in today');
    } finally {
      setClaimingCheckIn(false);
    }
  };

  const handleClaimQuest = async (qId: string) => {
    sounds.playClick();
    try {
      const res = await api.claimQuest(qId);
      sounds.playVictory();
      fireWinConfetti();
      onUpdateUser(res.user);
      const updated = await api.getQuests();
      setQuests(updated);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Announcements notice */}
      {announcements.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 flex-1">
            <span className="font-bold text-white block">{announcements[0].title}</span>
            <p className="text-[11px] text-amber-200/90 leading-tight">{announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* Main Rewards Wallet Card */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-800/60 rounded-3xl p-5 shadow-2xl overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Total Rewards Balance</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase">
                {user.tier}
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('WALLET')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight">
                  {user.availablePoints.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-400">Pts</span>
              </div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <span>Cash Value:</span>
                <span className="text-sm font-black text-emerald-400 tabular-nums">
                  ₹{(user.availablePoints / 100).toFixed(2)} INR
                </span>
              </div>
            </div>

            <button
              onClick={onOpenWithdraw}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all hover:brightness-110"
            >
              <span>Redeem</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick stats mini-row */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <div>
              <span className="text-[10px] text-slate-500 block">Current Streak</span>
              <span className="font-bold text-white tabular-nums">{user.streakDays} Days Active</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Referral Earnings</span>
              <span className="font-bold text-amber-400 tabular-nums">{user.referralEarnings.toLocaleString()} Pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Daily Check-in Streak Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">7-Day Check-in Streak</h3>
          </div>
          <span className="text-[11px] font-bold text-amber-400 tabular-nums">
            {user.streakDays}/7 Days
          </span>
        </div>

        {/* 7 Streak Pills */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {STREAK_DAYS.map((s) => {
            const isCompleted = user.streakDays >= s.day;
            const isCurrent = user.streakDays + 1 === s.day && !isCheckedInToday;

            return (
              <div
                key={s.day}
                className={`rounded-xl p-1.5 border flex flex-col items-center justify-between text-[10px] transition-all ${
                  isCompleted
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : isCurrent
                    ? 'bg-indigo-950 border-indigo-500 text-white animate-pulse'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span className="font-medium text-[9px]">D{s.day}</span>
                <span className="font-bold tabular-nums">+{s.points}</span>
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3 text-amber-400 mt-0.5" />
                ) : (
                  <span className="text-[8px] opacity-60">Pts</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Claim Streak Button */}
        <button
          onClick={handleClaimDaily}
          disabled={isCheckedInToday || claimingCheckIn}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
            isCheckedInToday
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-98 shadow-md'
          }`}
        >
          {isCheckedInToday ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Day {user.streakDays} Checked-In! (Return Tomorrow)</span>
            </>
          ) : (
            <>
              <Gift className="w-3.5 h-3.5" />
              <span>Claim Today’s Bonus (+{STREAK_DAYS[(user.streakDays % 7)]?.points || 10} Pts)</span>
            </>
          )}
        </button>

        {checkInMsg && !isCheckedInToday && (
          <p className="text-[11px] text-amber-300 text-center">{checkInMsg}</p>
        )}
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-5 gap-1.5">
        {[
          { label: 'Fishing Era', icon: '🎣', gameId: 'FISHING' },
          { label: 'JILI Gems', icon: '🎰', gameId: 'JILI' },
          { label: 'Spin Wheel', icon: '🎡', gameId: 'SPIN' },
          { label: 'Scratch Card', icon: '✨', gameId: 'SCRATCH' },
          { label: 'Redeem', icon: '₹', action: onOpenWithdraw },
        ].map((act, idx) => (
          <button
            key={idx}
            onClick={() => {
              sounds.playClick();
              if (act.gameId) onSelectGame(act.gameId);
              else if (act.action) act.action();
            }}
            className="p-2 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-md"
          >
            <span className="text-lg">{act.icon}</span>
            <span className="text-[10px] font-semibold text-slate-200 text-center leading-tight whitespace-nowrap">
              {act.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tutorial Overlay Guide Banner for Fishing Era & JILI */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-amber-950/80 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
            🎮
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">New User Tutorial Overlay</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-sky-500 to-amber-500 text-slate-950 uppercase">
                Guide
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Master mechanics for <strong>Fishing Era</strong> & <strong>JILI Games</strong> with interactive steps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto relative z-10">
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenTutorial) onOpenTutorial('FISHING');
            }}
            className="flex-1 sm:flex-none px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🎣 Fishing Guide</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              if (onOpenTutorial) onOpenTutorial('JILI');
            }}
            className="flex-1 sm:flex-none px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <span>🎰 JILI Guide</span>
          </button>
        </div>
      </div>

      {/* Featured Games Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Hot & Featured Games</h3>
          </div>
          <button
            onClick={() => onNavigateTab('GAMES')}
            className="text-xs text-amber-400 font-semibold hover:text-amber-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* 4 Featured Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Fishing Era */}
          <div
            onClick={() => {
              sounds.playClick();
              onSelectGame('FISHING');
            }}
            className="group relative bg-slate-900 border border-slate-800 hover:border-sky-400/50 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all active:scale-[0.99]"
          >
            <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
              <img
                src="/src/assets/images/banner_fishing_era_1791821515433.jpg"
                alt="Fishing Era Ocean Hunter"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    if (onOpenTutorial) onOpenTutorial('FISHING');
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-sky-300 border border-sky-400/50 hover:bg-sky-500 hover:text-white transition-colors"
                >
                  ? Tutorial
                </button>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500 text-white shadow">
                  🎣 Fishing Era
                </span>
              </div>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                  Fishing Era: Ocean Hunter
                </h4>
                <span className="text-[11px] text-slate-400">Aim laser nets & capture golden dragons</span>
              </div>
              <button className="p-2 rounded-xl bg-sky-500 text-white font-bold">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Card 2: JILI Games */}
          <div
            onClick={() => {
              sounds.playClick();
              onSelectGame('JILI');
            }}
            className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all active:scale-[0.99]"
          >
            <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
              <img
                src="/src/assets/images/banner_jili_arcade_1791821531038.jpg"
                alt="JILI Golden Fortune Gems"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    if (onOpenTutorial) onOpenTutorial('JILI');
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-amber-300 border border-amber-400/50 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                >
                  ? Tutorial
                </button>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                  🎰 JILI Official
                </span>
              </div>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  JILI Golden Fortune Gems
                </h4>
                <span className="text-[11px] text-slate-400">Super Ace cascade reels & 15x boost</span>
              </div>
              <button className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Card 3: Spin Wheel */}
          <div
            onClick={() => {
              sounds.playClick();
              onSelectGame('SPIN');
            }}
            className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all active:scale-[0.99]"
          >
            <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
              <img
                src="/src/assets/images/banner_spin_wheel_1791818183557.jpg"
                alt="Lucky Spin Wheel"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                5 Free Daily
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Lucky Spin Wheel
                </h4>
                <span className="text-[11px] text-slate-400">Guaranteed points on every spin</span>
              </div>
              <button className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Card 4: Trivia */}
          <div
            onClick={() => {
              sounds.playClick();
              onSelectGame('QUIZ');
            }}
            className="group relative bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all active:scale-[0.99]"
          >
            <div className="h-32 w-full overflow-hidden bg-slate-950 relative">
              <img
                src="/src/assets/images/banner_quiz_trivia_1791818195738.jpg"
                alt="Quiz Trivia Arena"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white shadow">
                Cricket & GK
              </span>
            </div>
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Quiz Trivia Arena
                </h4>
                <span className="text-[11px] text-slate-400">10-sec speed trivia challenges</span>
              </div>
              <button className="p-2 rounded-xl bg-indigo-500 text-white font-bold">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenges & Quests */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Daily Quests & Missions</h3>
          </div>
          <span className="text-[11px] text-slate-400">Resets in 12h</span>
        </div>

        <div className="space-y-2.5">
          {quests.map((q) => {
            const isDone = q.currentCount >= q.targetCount;
            return (
              <div
                key={q.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{q.title}</span>
                    <span className="text-[10px] font-semibold text-amber-400 tabular-nums">
                      +{q.pointsReward} Pts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{q.description}</p>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min((q.currentCount / q.targetCount) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 tabular-nums">
                      {q.currentCount}/{q.targetCount}
                    </span>
                  </div>
                </div>

                {q.isClaimed ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-500">
                    Claimed
                  </span>
                ) : isDone ? (
                  <button
                    onClick={() => handleClaimQuest(q.id)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 animate-bounce"
                  >
                    Claim
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectGame(q.gameType)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Go
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Refer Friends Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 border border-indigo-800 rounded-3xl p-4.5 flex items-center justify-between gap-3 shadow-xl">
        <div className="space-y-1">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-amber-400" />
            Invite Friends & Earn ₹2.50
          </span>
          <p className="text-[11px] text-indigo-200">
            Share code <span className="font-mono font-bold text-amber-400">{user.referralCode}</span> with buddies.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('REFER')}
          className="px-3.5 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 active:scale-95 shrink-0 shadow-md"
        >
          Invite
        </button>
      </div>

      {/* Trust & Transparency Badge */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center gap-2.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="leading-tight">
          GameEarn Pro promotes transparent skill gaming. Zero entry fees. Instant UPI & Bank withdrawal testing sandbox active.
        </p>
      </div>
    </div>
  );
};
