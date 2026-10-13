import React, { useState } from 'react';
import { UserProfile, WithdrawalMethod } from '../../types';
import { api } from '../../utils/api';
import { sounds } from '../../utils/audio';
import { X, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Building, Smartphone } from 'lucide-react';

interface Props {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: UserProfile) => void;
}

export const WithdrawalModal: React.FC<Props> = ({ user, isOpen, onClose, onSuccess }) => {
  const [method, setMethod] = useState<WithdrawalMethod>('UPI');
  const [amountINR, setAmountINR] = useState<number>(50);
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [holderName, setHolderName] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const pointsRequired = amountINR * 100;
  const canAfford = user.availablePoints >= pointsRequired;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!canAfford) {
      setError(`Insufficient points. You need ${pointsRequired.toLocaleString()} points for ₹${amountINR}.`);
      return;
    }

    if (method === 'UPI') {
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId.trim())) {
        setError('Invalid UPI ID. Please enter format like yourname@okhdfcbank or 9876543210@paytm');
        return;
      }
    } else {
      if (accountNumber !== confirmAccount) {
        setError('Account numbers do not match.');
        return;
      }
      if (accountNumber.length < 9) {
        setError('Account number must be at least 9 digits.');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
        setError('Invalid IFSC Code. Must be 11 characters (e.g. SBIN0001234, HDFC0000456)');
        return;
      }
    }

    setLoading(true);
    sounds.playClick();

    try {
      const idempotencyKey = `IDEMP_${user.id}_${Date.now()}`;
      const payloadDetails: Record<string, string> =
        method === 'UPI'
          ? { upiId: upiId.trim() }
          : {
              accountNumber: accountNumber.trim(),
              ifscCode: ifscCode.trim().toUpperCase(),
              accountHolderName: holderName.trim(),
            };

      const res = await api.requestWithdrawal(method, amountINR, payloadDetails, idempotencyKey);
      setSuccessMsg(res.message);
      sounds.playCoin();
      onSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Withdrawal failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Redeem Rewards</h3>
            <p className="text-xs text-slate-400">Withdraw points to your Indian bank or UPI</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Success screen */}
          {successMsg ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">Withdrawal Initiated!</h4>
                <p className="text-xs text-slate-300">{successMsg}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-amber-400 block">Sandbox Evaluation Mode:</span>
                <p>
                  Request logged to Admin Review Queue. You can switch to the Admin view in the top header or settings to simulate instant approval and payout reconciliation.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Select Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setMethod('UPI');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition-all ${
                      method === 'UPI'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setMethod('BANK');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-2 font-semibold transition-all ${
                      method === 'BANK'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* Amount Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Redeem Amount</label>
                  <span className="text-[11px] text-slate-400">Available: {user.availablePoints.toLocaleString()} Pts</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((amt) => {
                    const reqPts = amt * 100;
                    const isAffordable = user.availablePoints >= reqPts;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setAmountINR(amt);
                        }}
                        className={`py-2 px-1 rounded-xl border text-center font-bold tabular-nums transition-all ${
                          amountINR === amt
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                            : isAffordable
                            ? 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                            : 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        ₹{amt}
                        <span className="block text-[9px] font-normal opacity-75">{reqPts / 1000}k Pts</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Details Form */}
              {method === 'UPI' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">UPI Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@okaxis, 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                  />
                  <span className="text-[10px] text-slate-500">Supports Google Pay, PhonePe, Paytm, BHIM UPI.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-slate-300">Account Holder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Name as registered with bank"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">Bank Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="Account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">Confirm Account Number</label>
                    <input
                      type="text"
                      required
                      placeholder="Re-enter account number"
                      value={confirmAccount}
                      onChange={(e) => setConfirmAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">IFSC Code (11 characters)</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 text-xs uppercase tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* TDS / Compliance Notice */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Indian Compliance & Transparency</span>
                </div>
                <p>
                  No deduction fee. 100 Points = ₹1.00. Real-money payouts remain in sandbox test mode until statutory certifications and gateway integrations are completed.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading || !canAfford}
                className={`w-full h-12 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  canAfford
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {loading ? (
                  <span>Processing Request...</span>
                ) : (
                  <>
                    <span>Confirm Withdrawal (₹{amountINR})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
