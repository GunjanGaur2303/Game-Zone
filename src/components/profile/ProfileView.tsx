import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import {
  Shield,
  Volume2,
  VolumeX,
  Bell,
  Trash2,
  FileText,
  HelpCircle,
  LogOut,
  Check,
  ChevronRight,
  Sparkles,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenLegal: (docType: 'TERMS' | 'PRIVACY' | 'GAMING_LAWS' | 'PLAY_POLICY') => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=GameChampion',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberHero',
  'https://api.dicebear.com/7.x/bottts/svg?seed=LuckyStrike',
  'https://api.dicebear.com/7.x/bottts/svg?seed=SpeedGamer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=TriviaKing',
];

export const ProfileView: React.FC<Props> = ({
  user,
  onUpdateUser,
  onOpenAdmin,
  onLogout,
  onOpenLegal,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarUrl);
  const [soundEnabled, setSoundEnabled] = useState(user.settings.soundEnabled);
  const [notifEnabled, setNotifEnabled] = useState(user.settings.notificationsEnabled);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = async () => {
    sounds.playClick();
    try {
      const updated = await api.updateProfile({
        name,
        avatarUrl: selectedAvatar,
        settings: {
          ...user.settings,
          soundEnabled,
          notificationsEnabled: notifEnabled,
        },
      });
      sounds.setEnabled(soundEnabled);
      onUpdateUser(updated);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleToggleSound = async () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sounds.setEnabled(nextVal);
    if (nextVal) sounds.playClick();
    try {
      await api.updateProfile({
        settings: { ...user.settings, soundEnabled: nextVal },
      });
    } catch {
      // ignore
    }
  };

  const handleDeleteAccount = async () => {
    sounds.playClick();
    try {
      await api.deleteAccount();
      onLogout();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={selectedAvatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-400 p-1 object-cover"
            />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950 uppercase shadow">
              {user.tier}
            </span>
          </div>

          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            <p className="text-xs text-slate-400">{user.email || user.phone || 'Player'}</p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
              <span>Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Choose Avatar</label>
              <div className="flex gap-2">
                {AVATAR_OPTIONS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(av)}
                    className={`w-10 h-10 rounded-xl p-1 bg-slate-800 border transition-all ${
                      selectedAvatar === av ? 'border-amber-400 scale-105' : 'border-slate-700 opacity-60'
                    }`}
                  >
                    <img src={av} alt="avatar option" className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400 flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        )}

        {savedSuccess && (
          <div className="p-2 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center text-xs text-emerald-300">
            Profile updated successfully!
          </div>
        )}
      </div>

      {/* Tier & Rewards Milestone */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            VIP Tier Level
          </span>
          <span className="font-bold text-amber-400">{user.tier} Tier</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 w-3/4 rounded-full" />
        </div>
        <p className="text-[10px] text-slate-400">
          Earn 1,550 more points to unlock Diamond Tier with 1.5x daily spin rewards.
        </p>
      </div>

      {/* App Preferences */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden text-xs">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-200">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>Sound Effects</span>
          </div>
          <button
            onClick={handleToggleSound}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Bell className="w-4 h-4 text-slate-400" />
            <span>Daily Streak Reminders</span>
          </div>
          <button
            onClick={() => setNotifEnabled(!notifEnabled)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              notifEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                notifEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Legal & Compliance Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden text-xs">
        <button
          onClick={() => {
            sounds.playClick();
            onOpenLegal('TERMS');
          }}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-200">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLegal('PRIVACY');
          }}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Privacy Policy & Data Rights</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLegal('GAMING_LAWS');
          }}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-200">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Indian Skill-Gaming Jurisdictions & Tax Notice</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenLegal('PLAY_POLICY');
          }}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-slate-200">
            <ExternalLink className="w-4 h-4 text-blue-400" />
            <span>Google Play Console Compliance Checklist</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Admin Mode Launcher */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-white block">Administrator Console</span>
          <span className="text-[11px] text-slate-400">Review payouts, user ledger & anti-cheat alerts</span>
        </div>
        <button
          onClick={() => {
            sounds.playClick();
            onOpenAdmin();
          }}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition-all"
        >
          Open Admin
        </button>
      </div>

      {/* Account Deletion and Logout */}
      <div className="space-y-2 pt-2">
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-full py-3 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Request Account Deletion</span>
          </button>
        ) : (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded-2xl space-y-2 text-xs animate-in fade-in">
            <span className="font-bold text-red-200 block">Confirm Permanent Deletion?</span>
            <p className="text-[11px] text-red-300">
              All wallet points, referral links, and historical transactions will be permanently purged in accordance with data privacy laws.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500"
              >
                Yes, Delete My Account
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            sounds.playClick();
            onLogout();
          }}
          className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
