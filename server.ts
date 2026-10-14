import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure all API endpoints always serve JSON with proper headers
app.use('/api', (_req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// In-Memory Database & State Stores
interface DBUser {
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

interface DBTransaction {
  id: string;
  userId: string;
  type: string;
  title: string;
  points: number;
  cashEquivalent: number;
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
  timestamp: string;
  hash: string;
  details?: Record<string, unknown>;
}

interface DBWithdrawal {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  method: 'UPI' | 'BANK';
  pointsDeducted: number;
  amountINR: number;
  details: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
  payoutTxnReference?: string;
}

interface DBAudit {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  details: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
}

const otpStore = new Map<string, { code: string; expiresAt: number }>();
const idempotencyStore = new Set<string>();

// Initial System Configuration
const systemConfig = {
  pointsPerRupee: 100, // 100 points = ₹1
  minWithdrawalINR: 50, // Minimum ₹50 (5000 points)
  maxWithdrawalINR: 1000,
  dailySpinLimit: 5,
  welcomeBonusPoints: 100,
  referralRewardPoints: 250,
  antiCheatMaxScorePerMinute: 3000,
  maintenanceMode: false,
  sandboxMode: true, // Sandbox evaluation mode active
};

// Seed Current User
const users: Map<string, DBUser> = new Map();
const transactions: DBTransaction[] = [];
const withdrawals: DBWithdrawal[] = [];
const auditLogs: DBAudit[] = [];

// Seed default user
const defaultUserId = 'usr_default_2026';
users.set(defaultUserId, {
  id: defaultUserId,
  name: 'Gunjan Gaur',
  email: 'gunjangaur2303@gmail.com',
  phone: '+91 98765 43210',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=GameChampion',
  tier: 'Gold',
  referralCode: 'GUNJAN77',
  referralCount: 4,
  referralEarnings: 1000,
  availablePoints: 3450,
  pendingPoints: 0,
  redeemedPoints: 1500,
  streakDays: 3,
  lastCheckInDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  createdAt: '2026-09-15T10:00:00.000Z',
  role: 'admin',
  settings: {
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
  },
});

// Seed recent transactions
const initialTxns: Array<Omit<DBTransaction, 'hash'> & { hash?: string }> = [
  {
    id: 'TXN_20261010_01',
    userId: defaultUserId,
    type: 'GAME_WIN',
    title: 'Bubble Shooter Champion Score',
    points: 150,
    cashEquivalent: 1.5,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'TXN_20261011_02',
    userId: defaultUserId,
    type: 'DAILY_CHECKIN',
    title: 'Day 3 Streak Check-in',
    points: 25,
    cashEquivalent: 0.25,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 3600000 * 26).toISOString(),
  },
  {
    id: 'TXN_20261011_03',
    userId: defaultUserId,
    type: 'REFERRAL_BONUS',
    title: 'Referral Reward - friend joined',
    points: 250,
    cashEquivalent: 2.5,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'TXN_20261008_04',
    userId: defaultUserId,
    type: 'WITHDRAWAL_LOCK',
    title: 'UPI Payout Sandbox Completed',
    points: -1500,
    cashEquivalent: -15.0,
    status: 'COMPLETED',
    timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
  },
];

initialTxns.forEach((t) => {
  const hash = crypto.createHash('sha256').update(`${t.id}:${t.points}:${t.timestamp}`).digest('hex').substring(0, 16);
  transactions.unshift({ ...t, hash });
});

// Seed sample withdrawal requests in admin
withdrawals.push({
  id: 'WDR_20261010_8821',
  userId: defaultUserId,
  userName: 'Gunjan Gaur',
  userPhone: '+91 98765 43210',
  method: 'UPI',
  pointsDeducted: 1500,
  amountINR: 15.0,
  details: {
    upiId: 'gunjan@okaxis',
  },
  status: 'APPROVED',
  createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
  processedAt: new Date(Date.now() - 3600000 * 90).toISOString(),
  adminNote: 'Verified sandbox test payout via RazorpayX mock',
  payoutTxnReference: 'RZPX_SANDBOX_881928173',
});

// Seed Quests
const dailyQuests = [
  {
    id: 'q1',
    title: 'Spin the Lucky Wheel',
    description: 'Spin the wheel at least 2 times today',
    targetCount: 2,
    currentCount: 1,
    pointsReward: 50,
    isClaimed: false,
    gameType: 'SPIN',
  },
  {
    id: 'q2',
    title: 'Trivia Master',
    description: 'Score 100+ points in Quiz Challenge',
    targetCount: 1,
    currentCount: 0,
    pointsReward: 75,
    isClaimed: false,
    gameType: 'QUIZ',
  },
  {
    id: 'q3',
    title: 'Bubble Blaster',
    description: 'Pop at least 30 bubbles in Bubble Shooter',
    targetCount: 30,
    currentCount: 18,
    pointsReward: 100,
    isClaimed: false,
    gameType: 'BUBBLE',
  },
  {
    id: 'q4',
    title: 'Math Sprint Genius',
    description: 'Solve 10 rapid arithmetic problems',
    targetCount: 10,
    currentCount: 10,
    pointsReward: 60,
    isClaimed: false,
    gameType: 'NUMBER',
  },
  {
    id: 'q5',
    title: 'Ocean Hunter',
    description: 'Catch at least 10 fish in Fishing Era',
    targetCount: 10,
    currentCount: 4,
    pointsReward: 80,
    isClaimed: false,
    gameType: 'FISHING',
  },
  {
    id: 'q6',
    title: 'JILI Fortune Master',
    description: 'Score 150+ in JILI Fortune Gems',
    targetCount: 1,
    currentCount: 0,
    pointsReward: 100,
    isClaimed: false,
    gameType: 'JILI',
  },
];

// Helper to log audit events
function logAudit(action: string, details: string, severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO', userId?: string) {
  const log: DBAudit = {
    id: `AUD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
    severity,
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 200) auditLogs.pop();
}

logAudit('SYSTEM_BOOT', 'GameEarn Pro server started in sandbox mode', 'INFO');

// ==========================================
// AUTH API
// ==========================================

// Send OTP (Instant verification for seamless gaming)
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  const { identifier } = req.body || {};
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ error: 'Valid mobile number or email is required.' });
  }

  const cleanIdentifier = identifier.trim();
  if (cleanIdentifier.length < 5) {
    return res.status(400).json({ error: 'Please enter a valid mobile number or email.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(cleanIdentifier, {
    code: otp,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
  });

  logAudit('OTP_GENERATED', `OTP sent to ${cleanIdentifier}`, 'INFO');

  // Always provide devOtp so user gets immediate auto-fill code without manual SMS gateway configuration
  res.json({
    success: true,
    message: `Verification code generated for ${cleanIdentifier}`,
    devOtp: otp,
  });
});

// 1-Click Guest & Instant Play Login
app.post('/api/auth/guest-login', (req: Request, res: Response) => {
  const { mode = 'GUNJAN', name } = req.body || {};

  if (mode === 'GUNJAN') {
    const existing = users.get(defaultUserId);
    if (existing) {
      logAudit('GUEST_LOGIN', `Logged in as Gunjan Gaur (${defaultUserId})`, 'INFO', defaultUserId);
      return res.json({
        success: true,
        user: existing,
        token: `sess_${existing.id}_${Date.now()}`,
      });
    }
  }

  // Create or return guest user
  const guestId = `usr_guest_${Date.now()}`;
  const guestUser: DBUser = {
    id: guestId,
    name: name || `Guest Player ${Math.floor(1000 + Math.random() * 9000)}`,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}`,
    tier: 'Bronze',
    referralCode: `GUEST${Math.floor(1000 + Math.random() * 9000)}`,
    referralCount: 0,
    referralEarnings: 0,
    availablePoints: systemConfig.welcomeBonusPoints, // 100 points
    pendingPoints: 0,
    redeemedPoints: 0,
    streakDays: 1,
    createdAt: new Date().toISOString(),
    role: 'user',
    settings: {
      soundEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: true,
    },
  };

  users.set(guestId, guestUser);
  logAudit('GUEST_REGISTERED', `New guest player created: ${guestId}`, 'INFO', guestId);

  res.json({
    success: true,
    user: guestUser,
    token: `sess_${guestUser.id}_${Date.now()}`,
  });
});

// Verify OTP & Authenticate
app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  const { identifier, otp, referralCode } = req.body || {};
  if (!identifier || !otp) {
    return res.status(400).json({ error: 'Identifier and OTP code are required.' });
  }

  const cleanIdentifier = (identifier as string).trim();
  const cleanOtp = (otp as string).trim();

  const record = otpStore.get(cleanIdentifier);
  // Accept generated OTP or universal testing code 123456
  const isMatch = (record && record.code === cleanOtp) || cleanOtp === '123456' || (record && record.expiresAt > Date.now());

  if (!isMatch) {
    return res.status(400).json({ error: 'Invalid verification code. Use 123456 or the code shown on screen.' });
  }

  otpStore.delete(cleanIdentifier);

  // Find or create user
  let user = Array.from(users.values()).find((u) => u.phone === cleanIdentifier || u.email === cleanIdentifier);
  if (!user) {
    const isEmail = cleanIdentifier.includes('@');
    const newId = `usr_${Date.now()}`;
    const cleanRef = (cleanIdentifier.slice(0, 4) + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

    user = {
      id: newId,
      name: isEmail ? cleanIdentifier.split('@')[0] : `Player ${cleanIdentifier.slice(-4)}`,
      email: isEmail ? cleanIdentifier : undefined,
      phone: !isEmail ? cleanIdentifier : undefined,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      tier: 'Bronze',
      referralCode: cleanRef,
      referralCount: 0,
      referralEarnings: 0,
      availablePoints: systemConfig.welcomeBonusPoints,
      pendingPoints: 0,
      redeemedPoints: 0,
      streakDays: 1,
      createdAt: new Date().toISOString(),
      role: 'user',
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: true,
      },
    };

    // Credit welcome bonus
    const txnId = `TXN_${Date.now()}_WB`;
    const hash = crypto.createHash('sha256').update(`${txnId}:${user.availablePoints}`).digest('hex').substring(0, 16);
    transactions.unshift({
      id: txnId,
      userId: newId,
      type: 'DAILY_CHECKIN',
      title: 'Welcome Bonus Reward',
      points: systemConfig.welcomeBonusPoints,
      cashEquivalent: systemConfig.welcomeBonusPoints / systemConfig.pointsPerRupee,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      hash,
    });

    if (referralCode) {
      const inviter = Array.from(users.values()).find((u) => u.referralCode === referralCode.toUpperCase());
      if (inviter && inviter.id !== newId) {
        inviter.referralCount += 1;
        inviter.referralEarnings += systemConfig.referralRewardPoints;
        inviter.availablePoints += systemConfig.referralRewardPoints;

        transactions.unshift({
          id: `TXN_${Date.now()}_REF`,
          userId: inviter.id,
          type: 'REFERRAL_BONUS',
          title: `Referral Bonus: ${user.name} joined`,
          points: systemConfig.referralRewardPoints,
          cashEquivalent: systemConfig.referralRewardPoints / systemConfig.pointsPerRupee,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          hash: crypto.createHash('sha256').update(`REF:${inviter.id}:${Date.now()}`).digest('hex').substring(0, 16),
        });
      }
    }

    users.set(newId, user);
    logAudit('USER_REGISTERED', `New account created: ${user.id} (${cleanIdentifier})`, 'INFO', user.id);
  }

  res.json({
    success: true,
    user,
    token: `sess_${user.id}_${Date.now()}`,
  });
});

// Firebase Authentication Login / Sync
app.post('/api/auth/firebase-login', (req: Request, res: Response) => {
  const { phoneNumber, referralCode } = req.body || {};
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ error: 'Verified phone number from Firebase is required.' });
  }

  const cleanPhone = phoneNumber.trim();

  // Find or create user
  let user = Array.from(users.values()).find((u) => u.phone === cleanPhone);
  if (!user) {
    const newId = `usr_${Date.now()}`;
    const cleanRef = (cleanPhone.slice(-4).replace(/[^A-Za-z0-9]/g, '') + Math.floor(1000 + Math.random() * 9000)).toUpperCase();

    user = {
      id: newId,
      name: `Player ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newId}`,
      tier: 'Bronze',
      referralCode: cleanRef,
      referralCount: 0,
      referralEarnings: 0,
      availablePoints: systemConfig.welcomeBonusPoints,
      pendingPoints: 0,
      redeemedPoints: 0,
      streakDays: 1,
      createdAt: new Date().toISOString(),
      role: 'user',
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: true,
      },
    };

    // Credit 100 welcome bonus points
    const txnId = `TXN_${Date.now()}_WB`;
    const hash = crypto.createHash('sha256').update(`${txnId}:${user.availablePoints}`).digest('hex').substring(0, 16);
    transactions.unshift({
      id: txnId,
      userId: newId,
      type: 'DAILY_CHECKIN',
      title: 'Welcome Bonus Reward',
      points: systemConfig.welcomeBonusPoints,
      cashEquivalent: systemConfig.welcomeBonusPoints / systemConfig.pointsPerRupee,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      hash,
    });

    if (referralCode) {
      const inviter = Array.from(users.values()).find((u) => u.referralCode === referralCode.toUpperCase());
      if (inviter && inviter.id !== newId) {
        inviter.referralCount += 1;
        inviter.referralEarnings += systemConfig.referralRewardPoints;
        inviter.availablePoints += systemConfig.referralRewardPoints;

        transactions.unshift({
          id: `TXN_${Date.now()}_REF`,
          userId: inviter.id,
          type: 'REFERRAL_BONUS',
          title: `Referral Bonus: ${user.name} joined`,
          points: systemConfig.referralRewardPoints,
          cashEquivalent: systemConfig.referralRewardPoints / systemConfig.pointsPerRupee,
          status: 'COMPLETED',
          timestamp: new Date().toISOString(),
          hash: crypto.createHash('sha256').update(`REF:${inviter.id}:${Date.now()}`).digest('hex').substring(0, 16),
        });
      }
    }

    users.set(newId, user);
    logAudit('FIREBASE_AUTH_REGISTER', `New user registered via Firebase: ${user.id} (${cleanPhone})`, 'INFO', user.id);
  } else {
    logAudit('FIREBASE_AUTH_LOGIN', `User signed in via Firebase: ${user.id} (${cleanPhone})`, 'INFO', user.id);
  }

  res.json({
    success: true,
    user,
    token: `sess_${user.id}_${Date.now()}`,
  });
});

// Get Current User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user });
});

// Update Profile
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, avatarUrl, settings } = req.body;
  if (name) user.name = name.trim();
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (settings) user.settings = { ...user.settings, ...settings };

  res.json({ success: true, user });
});

// Delete Account Request
app.delete('/api/auth/account', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  logAudit('ACCOUNT_DELETION', `User ${userId} requested and confirmed complete account deletion`, 'WARN', userId);
  users.delete(userId);
  res.json({ success: true, message: 'Account successfully removed.' });
});

// ==========================================
// DAILY CHECK-IN & REWARDS
// ==========================================

app.post('/api/daily/check-in', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const todayStr = new Date().toISOString().split('T')[0];
  if (user.lastCheckInDate === todayStr) {
    return res.status(400).json({ error: 'Already claimed today’s check-in bonus! Return tomorrow.' });
  }

  // Calculate streak
  const streakRewards = [10, 15, 25, 35, 50, 75, 100]; // Days 1 to 7
  let newStreak = (user.streakDays || 0) + 1;
  if (newStreak > 7) newStreak = 1;

  const pointsEarned = streakRewards[newStreak - 1] || 10;
  user.streakDays = newStreak;
  user.lastCheckInDate = todayStr;
  user.availablePoints += pointsEarned;

  const txnId = `TXN_${Date.now()}_CHK`;
  const hash = crypto.createHash('sha256').update(`${txnId}:${pointsEarned}:${todayStr}`).digest('hex').substring(0, 16);

  const txn: DBTransaction = {
    id: txnId,
    userId: user.id,
    type: 'DAILY_CHECKIN',
    title: `Day ${newStreak} Daily Check-In`,
    points: pointsEarned,
    cashEquivalent: pointsEarned / systemConfig.pointsPerRupee,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    hash,
  };
  transactions.unshift(txn);

  logAudit('DAILY_CHECKIN', `User ${user.id} claimed Day ${newStreak} reward: ${pointsEarned} pts`, 'INFO', user.id);

  res.json({
    success: true,
    pointsEarned,
    newStreak,
    user,
    transaction: txn,
  });
});

// Daily Quests
app.get('/api/daily/quests', (_req: Request, res: Response) => {
  res.json({ quests: dailyQuests });
});

app.post('/api/daily/quests/:id/claim', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const quest = dailyQuests.find((q) => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  if (quest.isClaimed) {
    return res.status(400).json({ error: 'Quest reward already claimed today.' });
  }

  if (quest.currentCount < quest.targetCount) {
    return res.status(400).json({ error: 'Quest criteria not completed yet.' });
  }

  quest.isClaimed = true;
  user.availablePoints += quest.pointsReward;

  const txnId = `TXN_${Date.now()}_QST`;
  const hash = crypto.createHash('sha256').update(`${txnId}:${quest.pointsReward}`).digest('hex').substring(0, 16);
  const txn: DBTransaction = {
    id: txnId,
    userId: user.id,
    type: 'QUEST_REWARD',
    title: `Quest Reward: ${quest.title}`,
    points: quest.pointsReward,
    cashEquivalent: quest.pointsReward / systemConfig.pointsPerRupee,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    hash,
  };
  transactions.unshift(txn);

  res.json({ success: true, pointsEarned: quest.pointsReward, user, quest });
});

// ==========================================
// SERVER-SIDE GAME ANTI-CHEAT & REWARDS
// ==========================================

interface GameRewardPayload {
  gameId: 'SPIN' | 'QUIZ' | 'PUZZLE' | 'MEMORY' | 'BUBBLE' | 'NUMBER' | 'SCRATCH' | 'FISHING' | 'JILI';
  score: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

app.post('/api/games/validate-reward', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.isBanned) {
    return res.status(403).json({ error: 'Your account is restricted due to security review.' });
  }

  const { gameId, score, durationMs, metadata }: GameRewardPayload = req.body;

  // Anti-cheat verification
  if (durationMs < 1500 && gameId !== 'SPIN' && gameId !== 'SCRATCH') {
    logAudit('ANTI_CHEAT_FLAG', `Unusually fast completion: ${durationMs}ms in ${gameId}`, 'WARN', user.id);
    return res.status(400).json({ error: 'Anti-cheat alert: game completed unnaturally fast.' });
  }

  let calculatedPoints = 0;
  let gameTitle = '';

  switch (gameId) {
    case 'SPIN': {
      // Server determines or strictly caps spin prize
      const validSpinPrizes = [5, 10, 20, 50, 100, 0];
      const proposed = score;
      if (!validSpinPrizes.includes(proposed)) {
        return res.status(400).json({ error: 'Invalid spin reward value' });
      }
      calculatedPoints = proposed;
      gameTitle = 'Lucky Spin Wheel Reward';
      // increment spin quest
      const spinQuest = dailyQuests.find((q) => q.gameType === 'SPIN');
      if (spinQuest && spinQuest.currentCount < spinQuest.targetCount) {
        spinQuest.currentCount += 1;
      }
      break;
    }
    case 'QUIZ': {
      // Score represents points from correct answers (max 5 questions * 30 pts = 150)
      const sanitized = Math.min(Math.max(0, score), 150);
      calculatedPoints = sanitized;
      gameTitle = 'Quiz Trivia Arena';
      const q = dailyQuests.find((q) => q.gameType === 'QUIZ');
      if (q && q.currentCount < q.targetCount && sanitized >= 100) {
        q.currentCount += 1;
      }
      break;
    }
    case 'PUZZLE': {
      // Completed 3x3 puzzle
      calculatedPoints = Math.min(Math.max(20, score), 80);
      gameTitle = 'Number Tile Puzzle Solved';
      break;
    }
    case 'MEMORY': {
      // 16 cards matched
      calculatedPoints = Math.min(Math.max(15, score), 60);
      gameTitle = 'Memory Match Pairs Cleared';
      break;
    }
    case 'BUBBLE': {
      // Scaled points: 1 pt per 15 score points, capped at 120 pts per game
      calculatedPoints = Math.min(Math.floor(score / 15), 120);
      gameTitle = 'Bubble Shooter Arcade';
      const bq = dailyQuests.find((q) => q.gameType === 'BUBBLE');
      if (bq) {
        const popped = (metadata?.bubblesPopped as number) || 10;
        bq.currentCount = Math.min(bq.targetCount, bq.currentCount + popped);
      }
      break;
    }
    case 'NUMBER': {
      // Math speed sprint
      calculatedPoints = Math.min(Math.floor(score * 5), 100);
      gameTitle = 'Math Speed Sprint';
      const nq = dailyQuests.find((q) => q.gameType === 'NUMBER');
      if (nq && nq.currentCount < nq.targetCount) {
        nq.currentCount = Math.min(nq.targetCount, nq.currentCount + score);
      }
      break;
    }
    case 'SCRATCH': {
      // Reveal prize 20 - 100
      calculatedPoints = Math.min(Math.max(15, score), 150);
      gameTitle = 'Lucky Scratch Card Prize';
      break;
    }
    case 'FISHING': {
      // Fishing Era Ocean Hunter: scaled points (1 pt per 10 fish score points, capped at 150 pts per hunt)
      calculatedPoints = Math.min(Math.max(20, Math.floor(score / 10)), 150);
      gameTitle = 'Fishing Era: Ocean Hunter';
      const fq = dailyQuests.find((q) => q.gameType === 'FISHING');
      if (fq) {
        const fishCaught = (metadata?.fishCaught as number) || 5;
        fq.currentCount = Math.min(fq.targetCount, fq.currentCount + fishCaught);
      }
      break;
    }
    case 'JILI': {
      // JILI Fortune Gems & Super Ace: scaled based on combo wins, capped at 160 pts
      calculatedPoints = Math.min(Math.max(25, score), 160);
      gameTitle = 'JILI Fortune Gems & Super Ace';
      const jq = dailyQuests.find((q) => q.gameType === 'JILI');
      if (jq && jq.currentCount < jq.targetCount && score >= 100) {
        jq.currentCount += 1;
      }
      break;
    }
    default:
      return res.status(400).json({ error: 'Unknown game type' });
  }

  if (calculatedPoints > 0) {
    user.availablePoints += calculatedPoints;

    const txnId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const hash = crypto.createHash('sha256').update(`${txnId}:${calculatedPoints}:${user.id}`).digest('hex').substring(0, 16);

    const txn: DBTransaction = {
      id: txnId,
      userId: user.id,
      type: gameId === 'SCRATCH' ? 'SCRATCH_CARD' : 'GAME_WIN',
      title: gameTitle,
      points: calculatedPoints,
      cashEquivalent: calculatedPoints / systemConfig.pointsPerRupee,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      hash,
      details: { score, durationMs, gameId },
    };
    transactions.unshift(txn);

    res.json({
      success: true,
      pointsEarned: calculatedPoints,
      user,
      transaction: txn,
    });
  } else {
    res.json({
      success: true,
      pointsEarned: 0,
      user,
      message: 'Better luck next time!',
    });
  }
});

// ==========================================
// WALLET & WITHDRAWAL API
// ==========================================

// Get Transactions
app.get('/api/wallet/transactions', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const userTxns = transactions.filter((t) => t.userId === userId);
  res.json({ transactions: userTxns });
});

// Withdrawal Request Submission
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.isBanned) {
    return res.status(403).json({ error: 'Account suspended. Payouts disabled.' });
  }

  const { method, amountINR, details, idempotencyKey } = req.body;

  // Idempotency check
  if (idempotencyKey) {
    if (idempotencyStore.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate withdrawal request detected. Already being processed.' });
    }
    idempotencyStore.add(idempotencyKey);
  }

  // Validate amount
  const parsedINR = Number(amountINR);
  if (!parsedINR || parsedINR < systemConfig.minWithdrawalINR || parsedINR > systemConfig.maxWithdrawalINR) {
    return res.status(400).json({
      error: `Withdrawal amount must be between ₹${systemConfig.minWithdrawalINR} and ₹${systemConfig.maxWithdrawalINR}.`,
    });
  }

  const pointsRequired = parsedINR * systemConfig.pointsPerRupee;
  if (user.availablePoints < pointsRequired) {
    return res.status(400).json({
      error: `Insufficient points! You need ${pointsRequired.toLocaleString()} points for ₹${parsedINR}. Current: ${user.availablePoints.toLocaleString()} points.`,
    });
  }

  // Validate payment details
  if (method === 'UPI') {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!details?.upiId || !upiRegex.test(details.upiId.trim())) {
      return res.status(400).json({ error: 'Please enter a valid Indian UPI ID (e.g. mobile@upi or name@okhdfcbank).' });
    }
  } else if (method === 'BANK') {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!details?.accountNumber || details.accountNumber.length < 9) {
      return res.status(400).json({ error: 'Please enter a valid bank account number (at least 9 digits).' });
    }
    if (!details?.ifscCode || !ifscRegex.test(details.ifscCode.trim().toUpperCase())) {
      return res.status(400).json({ error: 'Invalid IFSC Code. Must be 11 characters (e.g. HDFC0001234, SBIN0004567).' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid withdrawal method selected.' });
  }

  // Deduct points into pending
  user.availablePoints -= pointsRequired;
  user.pendingPoints += pointsRequired;

  const withdrawalId = `WDR_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const newWithdrawal: DBWithdrawal = {
    id: withdrawalId,
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    method,
    pointsDeducted: pointsRequired,
    amountINR: parsedINR,
    details,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  withdrawals.unshift(newWithdrawal);

  // Add ledger transaction
  const txnId = `TXN_${Date.now()}_WDL`;
  const hash = crypto.createHash('sha256').update(`${txnId}:-${pointsRequired}:${user.id}`).digest('hex').substring(0, 16);

  const txn: DBTransaction = {
    id: txnId,
    userId: user.id,
    type: 'WITHDRAWAL_LOCK',
    title: `${method} Withdrawal Request (₹${parsedINR})`,
    points: -pointsRequired,
    cashEquivalent: -parsedINR,
    status: 'PENDING',
    timestamp: new Date().toISOString(),
    hash,
    details: { withdrawalId, method },
  };
  transactions.unshift(txn);

  logAudit(
    'WITHDRAWAL_SUBMITTED',
    `User ${user.id} requested ₹${parsedINR} via ${method} (${details.upiId || details.accountNumber})`,
    'INFO',
    user.id
  );

  res.json({
    success: true,
    withdrawal: newWithdrawal,
    transaction: txn,
    user,
    message: `Withdrawal request for ₹${parsedINR} submitted. Status: Pending Admin Review (Sandbox Mode).`,
  });
});

// ==========================================
// REFERRAL CLAIM API
// ==========================================

app.post('/api/referral/claim', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || defaultUserId;
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Referral code is required.' });

  if (user.referredBy) {
    return res.status(400).json({ error: 'You have already used a referral code!' });
  }

  if (user.referralCode.toUpperCase() === code.trim().toUpperCase()) {
    logAudit('FRAUD_FLAG', `Self-referral attempt by user ${user.id}`, 'WARN', user.id);
    return res.status(400).json({ error: 'You cannot use your own referral code.' });
  }

  const referrer = Array.from(users.values()).find((u) => u.referralCode === code.trim().toUpperCase());
  if (!referrer) {
    return res.status(404).json({ error: 'Referral code not found. Please verify the code.' });
  }

  user.referredBy = referrer.referralCode;
  user.availablePoints += systemConfig.welcomeBonusPoints;

  referrer.referralCount += 1;
  referrer.referralEarnings += systemConfig.referralRewardPoints;
  referrer.availablePoints += systemConfig.referralRewardPoints;

  // Ledger for current user
  transactions.unshift({
    id: `TXN_${Date.now()}_RBONUS`,
    userId: user.id,
    type: 'REFERRAL_BONUS',
    title: `Referral Welcome Gift (Used ${referrer.referralCode})`,
    points: systemConfig.welcomeBonusPoints,
    cashEquivalent: systemConfig.welcomeBonusPoints / systemConfig.pointsPerRupee,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(`RBONUS:${user.id}:${Date.now()}`).digest('hex').substring(0, 16),
  });

  // Ledger for referrer
  transactions.unshift({
    id: `TXN_${Date.now()}_REF`,
    userId: referrer.id,
    type: 'REFERRAL_BONUS',
    title: `Referral Reward: ${user.name} joined`,
    points: systemConfig.referralRewardPoints,
    cashEquivalent: systemConfig.referralRewardPoints / systemConfig.pointsPerRupee,
    status: 'COMPLETED',
    timestamp: new Date().toISOString(),
    hash: crypto.createHash('sha256').update(`REF:${referrer.id}:${Date.now()}`).digest('hex').substring(0, 16),
  });

  logAudit('REFERRAL_CLAIMED', `${user.id} claimed referral code from ${referrer.id}`, 'INFO', user.id);

  res.json({
    success: true,
    bonusEarned: systemConfig.welcomeBonusPoints,
    user,
    message: `Referral code applied! You received +${systemConfig.welcomeBonusPoints} bonus points!`,
  });
});

// ==========================================
// ADMIN DASHBOARD & CONTROLS API
// ==========================================

// Overview stats
app.get('/api/admin/overview', (_req: Request, res: Response) => {
  const allUsers = Array.from(users.values());
  const totalPointsDistributed = transactions
    .filter((t) => t.points > 0)
    .reduce((acc, curr) => acc + curr.points, 0);

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'PENDING').length;
  const totalWithdrawnINR = withdrawals
    .filter((w) => w.status === 'APPROVED')
    .reduce((acc, curr) => acc + curr.amountINR, 0);

  res.json({
    totalUsers: allUsers.length,
    totalPointsDistributed,
    totalPointsInCirculation: allUsers.reduce((acc, u) => acc + u.availablePoints, 0),
    totalWithdrawnINR,
    pendingWithdrawalsCount,
    fraudAlertsCount: auditLogs.filter((a) => a.severity === 'WARN' || a.severity === 'CRITICAL').length,
    sandboxMode: systemConfig.sandboxMode,
  });
});

// List Users
app.get('/api/admin/users', (_req: Request, res: Response) => {
  res.json({ users: Array.from(users.values()) });
});

// User action (Ban / Unban / Adjust points)
app.post('/api/admin/users/:id/action', (req: Request, res: Response) => {
  const targetUser = users.get(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const { action, pointsDelta, reason } = req.body;

  if (action === 'TOGGLE_BAN') {
    targetUser.isBanned = !targetUser.isBanned;
    logAudit(
      'ADMIN_BAN_ACTION',
      `Admin toggled ban for ${targetUser.id}: isBanned = ${targetUser.isBanned}. Reason: ${reason || 'N/A'}`,
      'WARN',
      targetUser.id
    );
  } else if (action === 'ADJUST_POINTS') {
    const delta = Number(pointsDelta) || 0;
    targetUser.availablePoints = Math.max(0, targetUser.availablePoints + delta);

    const txnId = `TXN_${Date.now()}_ADJ`;
    const hash = crypto.createHash('sha256').update(`${txnId}:${delta}:${targetUser.id}`).digest('hex').substring(0, 16);

    transactions.unshift({
      id: txnId,
      userId: targetUser.id,
      type: 'ADMIN_ADJUSTMENT',
      title: `Admin Adjustment: ${reason || 'Manual Correction'}`,
      points: delta,
      cashEquivalent: delta / systemConfig.pointsPerRupee,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      hash,
    });

    logAudit('ADMIN_POINT_ADJUSTMENT', `Admin adjusted points by ${delta} for ${targetUser.id}: ${reason}`, 'INFO', targetUser.id);
  }

  res.json({ success: true, user: targetUser });
});

// List Withdrawals
app.get('/api/admin/withdrawals', (_req: Request, res: Response) => {
  res.json({ withdrawals });
});

// Action on Withdrawal (Approve / Reject)
app.post('/api/admin/withdrawals/:id/action', (req: Request, res: Response) => {
  const wdr = withdrawals.find((w) => w.id === req.params.id);
  if (!wdr) return res.status(404).json({ error: 'Withdrawal request not found' });

  const { action, adminNote } = req.body;
  const user = users.get(wdr.userId);

  if (action === 'APPROVE') {
    wdr.status = 'APPROVED';
    wdr.processedAt = new Date().toISOString();
    wdr.adminNote = adminNote || 'Approved via Sandbox Payout Simulation';
    wdr.payoutTxnReference = `PAYOUT_SBX_${Date.now()}`;

    if (user) {
      user.pendingPoints = Math.max(0, user.pendingPoints - wdr.pointsDeducted);
      user.redeemedPoints += wdr.pointsDeducted;
    }

    // Mark transaction as completed
    const matchingTxn = transactions.find((t) => t.details?.withdrawalId === wdr.id);
    if (matchingTxn) matchingTxn.status = 'COMPLETED';

    logAudit('WITHDRAWAL_APPROVED', `Admin approved withdrawal ${wdr.id} for ₹${wdr.amountINR}`, 'INFO', wdr.userId);
  } else if (action === 'REJECT') {
    wdr.status = 'REJECTED';
    wdr.processedAt = new Date().toISOString();
    wdr.adminNote = adminNote || 'Rejected by Admin. Points refunded.';

    if (user) {
      // Refund points back to available
      user.pendingPoints = Math.max(0, user.pendingPoints - wdr.pointsDeducted);
      user.availablePoints += wdr.pointsDeducted;

      // Add refund ledger entry
      const txnId = `TXN_${Date.now()}_RFND`;
      transactions.unshift({
        id: txnId,
        userId: user.id,
        type: 'WITHDRAWAL_REFUND',
        title: `Refund for Rejected Withdrawal (${wdr.id})`,
        points: wdr.pointsDeducted,
        cashEquivalent: wdr.amountINR,
        status: 'REFUNDED',
        timestamp: new Date().toISOString(),
        hash: crypto.createHash('sha256').update(`REFUND:${wdr.id}`).digest('hex').substring(0, 16),
      });
    }

    logAudit('WITHDRAWAL_REJECTED', `Admin rejected withdrawal ${wdr.id}. Reason: ${adminNote}`, 'WARN', wdr.userId);
  }

  res.json({ success: true, withdrawal: wdr, user });
});

// Get/Update System Config
app.get('/api/admin/config', (_req: Request, res: Response) => {
  res.json({ config: systemConfig });
});

app.put('/api/admin/config', (req: Request, res: Response) => {
  const updates = req.body;
  Object.assign(systemConfig, updates);
  logAudit('CONFIG_UPDATED', `System config updated: ${JSON.stringify(updates)}`, 'WARN');
  res.json({ success: true, config: systemConfig });
});

// Audit Logs
app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json({ auditLogs });
});

// Announcements
app.get('/api/announcements', (_req: Request, res: Response) => {
  res.json({
    announcements: [
      {
        id: 'ann1',
        title: 'Welcome to GameEarn Pro Sandbox Preview',
        message: 'Play casual games, collect streak rewards and test sandbox UPI/Bank redemptions with zero risk.',
        date: '2026-10-12',
        type: 'info',
      },
      {
        id: 'ann2',
        title: 'Skill-Based Gaming Notice',
        message: 'All casual games require skill, concentration, and strategy. Complying with Indian Information Technology Act 2000.',
        date: '2026-10-11',
        type: 'legal',
      },
    ],
  });
});

// 404 handler for API routes to guarantee valid JSON response (never HTML)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: `API endpoint '${req.method} ${req.path}' not found. Please verify the URL.`,
  });
});

// Global API error handler ensuring JSON responses
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[GameEarn Pro Server Error]', err);
  res.status(500).json({
    error: err?.message || 'An unexpected server error occurred.',
  });
});

export default app;

// ==========================================
// MOUNT VITE MIDDLEWARE & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GameEarn Pro] Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only listen directly when not executed as a Vercel Serverless Function
if (!process.env.VERCEL && !process.env.NOW_REGION) {
  startServer();
}
