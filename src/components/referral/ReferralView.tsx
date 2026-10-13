import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import { fireWinConfetti } from '../common/Confetti';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  ShieldAlert,
  ArrowRight,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
}

export const ReferralView: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const referralLink = `https://gameearn.pro/join?ref=${user.referralCode}`;

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform?: 'whatsapp' | 'telegram') => {
    sounds.playClick();
    const shareText = `Hey! Join me on GameEarn Pro - the exciting mobile casual gaming app. Use my referral code ${user.referralCode} to get 100 free bonus reward points! Join here: ${referralLink}`;

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'GameEarn Pro Invitation',
            text: shareText,
            url: referralLink,
          });
        } catch {
          handleCopyCode();
        }
      } else {
        handleCopyCode();
      }
    }
  };

  const handleClaimCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setError(null);
    setMessage(null);
    setLoading(true);
    sounds.playClick();

    try {
      const res = await api.claimReferral(inputCode.trim());
      sounds.playVictory();
      fireWinConfetti();
      setMessage(res.message);
      onUpdateUser(res.user);
      setInputCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to claim referral code';
      setError(msg);
      sounds.playIncorrect();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-800/60 rounded-3xl p-5 text-white shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Gift className="w-4 h-4" />
          <span>Refer & Earn Program</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-white">
            Earn ₹2.50 (250 Pts) For Every Friend
          </h2>
          <p className="text-xs text-indigo-200">
            Invite your friends to GameEarn Pro. When they sign up, they get 100 welcome bonus points and you receive 250 points!
          </p>
        </div>

        {/* User Code Box */}
        <div className="bg-slate-950/70 border border-indigo-700/50 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">YOUR UNIQUE REFERRAL CODE</span>
            <span className="text-xl font-black text-amber-400 tracking-wider font-mono">
              {user.referralCode}
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => handleShare('whatsapp')}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare()}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700"
          >
            <Share2 className="w-4 h-4" />
            <span>More Options</span>
          </button>
        </div>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Friends Joined
          </span>
          <span className="text-2xl font-black text-white tabular-nums">{user.referralCount}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            Referral Earnings
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400 tabular-nums">
              {user.referralEarnings.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">Pts (₹{(user.referralEarnings / 100).toFixed(2)})</span>
          </div>
        </div>
      </div>

      {/* Claim a Friend's Referral Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white">Have a Referral Code?</h3>
          <p className="text-xs text-slate-400">
            {user.referredBy
              ? `You already redeemed code: ${user.referredBy}`
              : 'Enter a friend’s code to get an instant +100 bonus points.'}
          </p>
        </div>

        {!user.referredBy ? (
          <form onSubmit={handleClaimCode} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 8-digit code (e.g. FRIEND24)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 font-mono text-xs uppercase focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={loading || !inputCode.trim()}
                className="px-4 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs hover:bg-amber-400 active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-md"
              >
                <span>Apply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}
          </form>
        ) : (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Referral bonus active. Verified referee status.</span>
          </div>
        )}
      </div>

      {/* Anti-Fraud Notice */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Anti-Fraud & Fair Play Policy</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-slate-400">
          <li>Self-referrals and emulated accounts on the same device/IP are strictly banned.</li>
          <li>Points earned through automated bots or duplicate accounts are automatically revoked.</li>
          <li>Referee must complete at least 1 game round to validate the referral bonus credit.</li>
        </ul>
      </div>
    </div>
  );
};
