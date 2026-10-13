import React from 'react';
import { UserProfile } from '../../types';
import { sounds } from '../../utils/audio';
import { Volume2, VolumeX, Shield, Smartphone, HelpCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenWallet: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  isFrameMode: boolean;
  onToggleFrameMode: () => void;
  onOpenTutorial?: () => void;
}

export const TopHeader: React.FC<Props> = ({
  user,
  soundEnabled,
  onToggleSound,
  onOpenWallet,
  onOpenProfile,
  onOpenAdmin,
  isFrameMode,
  onToggleFrameMode,
  onOpenTutorial,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 h-14 flex items-center justify-between gap-4">
      {/* Zone 1: Brand Wordmark & Emblem */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-xl overflow-hidden bg-amber-500/10 border border-amber-500/40 p-0.5 shadow-sm">
          <img
            src="/src/assets/images/app_logo_gameearn_1791818170099.jpg"
            alt="GameEarn Pro Logo"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <span className="text-base font-black tracking-tight text-white whitespace-nowrap">
          GameEarn<span className="text-amber-400">Pro</span>
        </span>
      </div>

      {/* Zone 2: Points & Cash Balance Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenWallet();
          }}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl px-2.5 py-1.5 transition-all active:scale-95 shadow-sm"
          title="Open Wallet"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">
            ₹
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-amber-400 tabular-nums block leading-none">
              {user.availablePoints.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 tabular-nums block leading-none">
              ₹{(user.availablePoints / 100).toFixed(2)}
            </span>
          </div>
        </button>
      </div>

      {/* Zone 3: Actions (Sound, Frame simulator toggle, Profile Avatar) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Android Bezel Simulator Toggle (for desktop testing) */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleFrameMode();
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            isFrameMode
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
          }`}
          title={isFrameMode ? 'Switch to Full Screen View' : 'Switch to Android Phone Bezel Frame'}
        >
          <Smartphone className="w-4 h-4" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => {
            sounds.playClick();
            onToggleSound();
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Game Guides & Tutorial Trigger */}
        {onOpenTutorial && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenTutorial();
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sky-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
            title="How to Play: Fishing Era & JILI Mechanics Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Admin quick icon if admin */}
        {user.role === 'admin' && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdmin();
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-indigo-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
            title="Open Admin Dashboard"
          >
            <Shield className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* Profile Avatar Trigger */}
        <button
          onClick={() => {
            sounds.playClick();
            onOpenProfile();
          }}
          className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-amber-400 transition-colors p-0.5 ml-1"
          title="Account Profile & Settings"
        >
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-lg" />
        </button>
      </div>
    </header>
  );
};
