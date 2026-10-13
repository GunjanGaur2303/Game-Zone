import React, { useState, useEffect } from 'react';
import { UserProfile, WalletTransaction } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import { WithdrawalModal } from './WithdrawalModal';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Filter,
  Copy,
  Check,
  Calculator,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
}

export const WalletView: React.FC<Props> = ({ user, onUpdateUser }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);
  const [calcPoints, setCalcPoints] = useState<number>(5000);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTxns = async () => {
    try {
      setRefreshing(true);
      const list = await api.getTransactions();
      setTransactions(list);
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTxns();
  }, []);

  const handleCopy = (id: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(id);
    setCopiedTxnId(id);
    setTimeout(() => setCopiedTxnId(null), 1800);
  };

  const filteredTxns = filterType === 'ALL'
    ? transactions
    : filterType === 'WINS'
    ? transactions.filter((t) => t.type === 'GAME_WIN' || t.type === 'SCRATCH_CARD')
    : filterType === 'WITHDRAWALS'
    ? transactions.filter((t) => t.type === 'WITHDRAWAL_LOCK' || t.type === 'WITHDRAWAL_REFUND')
    : transactions.filter((t) => t.type === 'DAILY_CHECKIN' || t.type === 'REFERRAL_BONUS' || t.type === 'QUEST_REWARD');

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner / Balance Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-5 text-slate-950 shadow-xl overflow-hidden">
        {/* Subtle background coin watermark pattern */}
        <div className="absolute -right-4 -bottom-6 w-32 h-32 rounded-full border-8 border-amber-400/30 pointer-events-none select-none flex items-center justify-center font-black text-6xl text-amber-400/20">
          ₹
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900/80 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              GameEarn Rewards Ledger
            </span>
            <button
              onClick={() => {
                sounds.playClick();
                fetchTxns();
              }}
              className="text-slate-900 hover:text-white p-1 rounded-full transition-transform active:rotate-180"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
                {user.availablePoints.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-900/90">Points</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <span>Approx Cash Value:</span>
              <span className="text-sm font-black tabular-nums">₹{(user.availablePoints / 100).toFixed(2)} INR</span>
            </div>
          </div>

          {/* Sub balances row */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/15 text-xs">
            <div className="bg-slate-950/10 rounded-xl p-2.5">
              <span className="text-[10px] font-semibold text-slate-900/75 block">Pending Review</span>
              <span className="font-bold tabular-nums text-slate-950">
                {user.pendingPoints.toLocaleString()} Pts (₹{(user.pendingPoints / 100).toFixed(2)})
              </span>
            </div>
            <div className="bg-slate-950/10 rounded-xl p-2.5">
              <span className="text-[10px] font-semibold text-slate-900/75 block">Lifetime Redeemed</span>
              <span className="font-bold tabular-nums text-slate-950">
                {user.redeemedPoints.toLocaleString()} Pts (₹{(user.redeemedPoints / 100).toFixed(2)})
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsModalOpen(true);
            }}
            className="w-full h-12 bg-slate-950 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-900 active:scale-[0.98] shadow-lg shadow-black/20"
          >
            <span>Redeem Rewards via UPI / Bank</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Point Conversion Calculator Widget */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Reward Conversion Calculator</span>
          </div>
          <span className="text-[11px] text-slate-400">100 Points = ₹1.00</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Points to Convert:</span>
            <input
              type="number"
              step={100}
              min={100}
              max={100000}
              value={calcPoints}
              onChange={(e) => setCalcPoints(Number(e.target.value) || 0)}
              className="w-28 bg-transparent text-right font-bold text-white text-sm tabular-nums focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400">Estimated Indian Rupee (INR):</span>
            <span className="font-black text-amber-400 text-sm tabular-nums">
              ₹{(calcPoints / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            Transaction Ledger
          </h3>
          <span className="text-[11px] text-slate-500 tabular-nums">{transactions.length} entries</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-slate-500 text-xs mr-1 flex items-center">
            <Filter className="w-3 h-3" />
          </span>
          {[
            { id: 'ALL', label: 'All History' },
            { id: 'WINS', label: 'Game Wins' },
            { id: 'WITHDRAWALS', label: 'Withdrawals' },
            { id: 'STREAKS', label: 'Daily & Bonuses' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                sounds.playClick();
                setFilterType(f.id);
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                filterType === f.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {filteredTxns.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800/60">
              No transactions found in this category.
            </div>
          ) : (
            filteredTxns.map((txn) => {
              const isCredit = txn.points > 0;
              return (
                <div
                  key={txn.id}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">{txn.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(txn.timestamp).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black tabular-nums block ${
                          isCredit ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {isCredit ? '+' : ''}
                        {txn.points.toLocaleString()} Pts
                      </span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {isCredit ? '+' : ''}₹{Math.abs(txn.cashEquivalent).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Transaction ID & Hash Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1 font-mono">
                      <span>{txn.id}</span>
                      <button
                        onClick={() => handleCopy(txn.id)}
                        className="hover:text-amber-400 transition-colors"
                        title="Copy Txn ID"
                      >
                        {copiedTxnId === txn.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          txn.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : txn.status === 'PENDING'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {txn.status}
                      </span>
                      {txn.hash && (
                        <span className="font-mono text-[9px] opacity-70" title={`SHA256 Hash: ${txn.hash}`}>
                          #{txn.hash.substring(0, 6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Security Disclaimer */}
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Every transaction ledger entry is secured with an immutable SHA-256 hash. Anti-tampering protection enabled.
        </span>
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(updated) => {
          onUpdateUser(updated);
          fetchTxns();
        }}
      />
    </div>
  );
};
