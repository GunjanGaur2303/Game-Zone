import React, { useState, useEffect } from 'react';
import { UserProfile, WithdrawalRequest, SystemConfig, AuditLog } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import {
  ShieldAlert,
  ArrowLeft,
  Users,
  CreditCard,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Lock,
  Unlock,
  PlusCircle,
  RefreshCw,
  Sliders,
} from 'lucide-react';

interface Props {
  currentUser: UserProfile;
  onClose: () => void;
  onRefreshCurrentUser: () => void;
}

export const AdminDashboard: React.FC<Props> = ({ onClose, onRefreshCurrentUser }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WITHDRAWALS' | 'USERS' | 'CONFIG' | 'LOGS'>('OVERVIEW');
  const [overview, setOverview] = useState<{
    totalUsers: number;
    totalPointsDistributed: number;
    totalPointsInCirculation: number;
    totalWithdrawnINR: number;
    pendingWithdrawalsCount: number;
    fraudAlertsCount: number;
    sandboxMode: boolean;
  } | null>(null);

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, wdr, usr, cfg, logs] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminWithdrawals(),
        api.getAdminUsers(),
        api.getAdminConfig(),
        api.getAuditLogs(),
      ]);
      setOverview(ov);
      setWithdrawals(wdr);
      setUsersList(usr);
      setConfig(cfg);
      setAuditLogs(logs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveWithdrawal = async (id: string) => {
    sounds.playClick();
    try {
      await api.adminWithdrawalAction(id, 'APPROVE', 'Approved via Admin Console (Sandbox Mode)');
      sounds.playCoin();
      loadData();
      onRefreshCurrentUser();
    } catch {
      // ignore
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    sounds.playClick();
    try {
      await api.adminWithdrawalAction(id, 'REJECT', rejectReason || 'Declined per verification policy. Points refunded.');
      setRejectingId(null);
      setRejectReason('');
      loadData();
      onRefreshCurrentUser();
    } catch {
      // ignore
    }
  };

  const handleToggleBan = async (userId: string) => {
    sounds.playClick();
    try {
      await api.adminUserAction(userId, 'TOGGLE_BAN', 0, 'Admin manual moderation');
      loadData();
    } catch {
      // ignore
    }
  };

  const handleAdjustPointsSubmit = async (userId: string) => {
    sounds.playClick();
    try {
      await api.adminUserAction(userId, 'ADJUST_POINTS', adjustPoints, adjustReason || 'Admin adjustment');
      setAdjustUserId(null);
      setAdjustReason('');
      loadData();
      onRefreshCurrentUser();
    } catch {
      // ignore
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    sounds.playClick();
    try {
      const updated = await api.updateAdminConfig(config);
      setConfig(updated);
      alert('System configuration updated successfully!');
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Admin Control Center</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Role: SuperAdmin
            </span>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Admin Tab Navigation */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/60 px-4 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'WITHDRAWALS', label: 'Withdrawal Queue', icon: <CreditCard className="w-3.5 h-3.5" />, count: overview?.pendingWithdrawalsCount },
          { id: 'USERS', label: 'User Directory', icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'CONFIG', label: 'System Rules', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'LOGS', label: 'Audit & Fraud Alerts', icon: <ShieldAlert className="w-3.5 h-3.5" />, count: overview?.fraudAlertsCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sounds.playClick();
              setActiveTab(tab.id as typeof activeTab);
            }}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full space-y-4">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && overview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-400 block">Total Registered Users</span>
                <span className="text-2xl font-black text-white tabular-nums">{overview.totalUsers}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-400 block">Points In Circulation</span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">
                  {overview.totalPointsInCirculation.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-400 block">Pending Withdrawals</span>
                <span className="text-2xl font-black text-amber-400 tabular-nums">
                  {overview.pendingWithdrawalsCount}
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-400 block">Total Withdrawn (INR)</span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">
                  ₹{overview.totalWithdrawnINR.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Status callout */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <Settings className="w-4 h-4" />
                <span>Sandbox Mode & Regulatory Safeguards</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                App environment is currently executing in <strong>Sandbox Mode</strong>. Real-money disbursements require activating live RazorpayX / Cashfree Payout webhooks, signing legal counsel declarations for Indian state laws (Assam, Odisha, Telangana exemptions), and filing PAN KYC.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: WITHDRAWAL QUEUE */}
        {activeTab === 'WITHDRAWALS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Withdrawal Approval Queue</h3>
              <span className="text-xs text-slate-400">{withdrawals.length} total requests</span>
            </div>

            <div className="space-y-2.5">
              {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                  No withdrawal requests in queue.
                </div>
              ) : (
                withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{w.userName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {w.method}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : w.status === 'REJECTED'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 block font-mono">
                          ID: {w.id} · {new Date(w.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-amber-400 tabular-nums">₹{w.amountINR}</span>
                        <span className="text-[11px] text-slate-400 block tabular-nums">
                          {w.pointsDeducted.toLocaleString()} Points
                        </span>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1">
                      {w.method === 'UPI' ? (
                        <div>
                          <span className="text-slate-500">UPI VPA: </span>
                          <span className="text-amber-300 font-bold">{w.details.upiId}</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div>
                            <span className="text-slate-500">Holder: </span>
                            <span className="text-white">{w.details.accountHolderName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">A/C: </span>
                            <span className="text-amber-300 font-bold">{w.details.accountNumber}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">IFSC: </span>
                            <span className="text-white">{w.details.ifscCode}</span>
                          </div>
                        </div>
                      )}
                      {w.payoutTxnReference && (
                        <div className="pt-1 text-[10px] text-emerald-400">
                          Ref: {w.payoutTxnReference}
                        </div>
                      )}
                    </div>

                    {/* Action buttons if Pending */}
                    {w.status === 'PENDING' && (
                      <div className="space-y-2 pt-1">
                        {rejectingId === w.id ? (
                          <div className="p-3 bg-slate-950 rounded-xl border border-red-900 space-y-2">
                            <input
                              type="text"
                              placeholder="Reason for rejection (e.g. Invalid UPI ID)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectWithdrawal(w.id)}
                                className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                              >
                                Confirm Rejection & Refund Points
                              </button>
                              <button
                                onClick={() => setRejectingId(null)}
                                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Approve & Simulate Payout</span>
                            </button>
                            <button
                              onClick={() => setRejectingId(w.id)}
                              className="px-4 py-2 bg-red-950/60 border border-red-800 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: USER DIRECTORY */}
        {activeTab === 'USERS' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email, or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              {usersList
                .filter(
                  (u) =>
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    u.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={u.avatarUrl} alt={u.name} className="w-10 h-10 rounded-xl bg-slate-800 p-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{u.name}</span>
                            {u.isBanned && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-950 text-red-400 border border-red-800">
                                BANNED
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{u.email || u.phone} · Code: {u.referralCode}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-amber-400 tabular-nums">
                          {u.availablePoints.toLocaleString()} Pts
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          ₹{(u.availablePoints / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Adjust points modal inside card */}
                    {adjustUserId === u.id ? (
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-white block">Adjust Wallet Points</span>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step={50}
                            value={adjustPoints}
                            onChange={(e) => setAdjustPoints(Number(e.target.value) || 0)}
                            className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Reason for adjustment"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAdjustPointsSubmit(u.id)}
                            className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg font-bold"
                          >
                            Apply Adjustment
                          </button>
                          <button
                            onClick={() => setAdjustUserId(null)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => setAdjustUserId(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Adjust Balance</span>
                        </button>
                        <button
                          onClick={() => handleToggleBan(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                            u.isBanned
                              ? 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-red-950 text-red-400 hover:bg-red-900'
                          }`}
                        >
                          {u.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{u.isBanned ? 'Unban User' : 'Ban User'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM CONFIG */}
        {activeTab === 'CONFIG' && config && (
          <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">System & Reward Rules Configuration</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Points per INR ₹1.00</label>
                <input
                  type="number"
                  value={config.pointsPerRupee}
                  onChange={(e) => setConfig({ ...config, pointsPerRupee: Number(e.target.value) || 100 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Minimum Withdrawal (₹)</label>
                <input
                  type="number"
                  value={config.minWithdrawalINR}
                  onChange={(e) => setConfig({ ...config, minWithdrawalINR: Number(e.target.value) || 50 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Daily Spin Limit</label>
                <input
                  type="number"
                  value={config.dailySpinLimit}
                  onChange={(e) => setConfig({ ...config, dailySpinLimit: Number(e.target.value) || 5 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Referral Reward (Points)</label>
                <input
                  type="number"
                  value={config.referralRewardPoints}
                  onChange={(e) => setConfig({ ...config, referralRewardPoints: Number(e.target.value) || 250 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-400"
              >
                Save System Configurations
              </button>
            </div>
          </form>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'LOGS' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">Security & Audit Event Stream</h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        log.severity === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : log.severity === 'WARN'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {log.severity} · {log.action}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
