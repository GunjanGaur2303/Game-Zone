export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralEarnings: number;
  availablePoints: number;
  pendingPoints: number;
  redeemedPoints: number;
  streakDays: number;
  lastCheckInDate?: string;
  createdAt: string;
  role: 'user' | 'admin';
  isBanned?: boolean;
  settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

export type TransactionType =
  | 'GAME_WIN'
  | 'DAILY_CHECKIN'
  | 'REFERRAL_BONUS'
  | 'SCRATCH_CARD'
  | 'QUEST_REWARD'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_REFUND'
  | 'ADMIN_ADJUSTMENT';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  title: string;
  points: number;
  cashEquivalent: number; // In INR ₹
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  timestamp: string;
  details?: Record<string, unknown>;
  hash?: string; // Tamper check
}

export type WithdrawalMethod = 'UPI' | 'BANK';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  method: WithdrawalMethod;
  pointsDeducted: number;
  amountINR: number;
  details: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
  payoutTxnReference?: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  currentCount: number;
  pointsReward: number;
  isClaimed: boolean;
  gameType: 'SPIN' | 'QUIZ' | 'PUZZLE' | 'MEMORY' | 'BUBBLE' | 'NUMBER' | 'FISHING' | 'JILI' | 'ANY';
}

export interface SystemConfig {
  pointsPerRupee: number; // e.g. 100 points = ₹1
  minWithdrawalINR: number; // e.g. ₹50 (5000 points)
  maxWithdrawalINR: number; // e.g. ₹1000
  dailySpinLimit: number;
  welcomeBonusPoints: number;
  referralRewardPoints: number;
  antiCheatMaxScorePerMinute: number;
  maintenanceMode: boolean;
  sandboxMode: boolean; // Production test mode active
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}
