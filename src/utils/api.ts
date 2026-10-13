import { UserProfile, WalletTransaction, WithdrawalRequest, DailyQuest, SystemConfig, AuditLog } from '../types';

class ApiService {
  private currentUserId: string = 'usr_default_2026';

  public setUserId(id: string) {
    this.currentUserId = id;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-user-id': this.currentUserId,
      ...options.headers,
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed. Please try again.');
    }

    return data as T;
  }

  // Auth
  async sendOtp(identifier: string): Promise<{ success: boolean; devOtp: string; message: string }> {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
  }

  async verifyOtp(identifier: string, otp: string, referralCode?: string): Promise<{ success: boolean; user: UserProfile; token: string }> {
    const res = await this.request<{ success: boolean; user: UserProfile; token: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, otp, referralCode }),
    });
    this.currentUserId = res.user.id;
    return res;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>('/api/auth/me');
    return res.user;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.user;
  }

  async deleteAccount(): Promise<void> {
    await this.request('/api/auth/account', { method: 'DELETE' });
  }

  // Daily
  async claimDailyCheckIn(): Promise<{ pointsEarned: number; newStreak: number; user: UserProfile; transaction: WalletTransaction }> {
    return this.request('/api/daily/check-in', { method: 'POST' });
  }

  async getQuests(): Promise<DailyQuest[]> {
    const res = await this.request<{ quests: DailyQuest[] }>('/api/daily/quests');
    return res.quests;
  }

  async claimQuest(id: string): Promise<{ pointsEarned: number; user: UserProfile }> {
    return this.request(`/api/daily/quests/${id}/claim`, { method: 'POST' });
  }

  // Games
  async validateGameReward(
    gameId: 'SPIN' | 'QUIZ' | 'PUZZLE' | 'MEMORY' | 'BUBBLE' | 'NUMBER' | 'SCRATCH' | 'FISHING' | 'JILI',
    score: number,
    durationMs: number,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; pointsEarned: number; user: UserProfile; transaction?: WalletTransaction; message?: string }> {
    return this.request('/api/games/validate-reward', {
      method: 'POST',
      body: JSON.stringify({ gameId, score, durationMs, metadata }),
    });
  }

  // Wallet
  async getTransactions(): Promise<WalletTransaction[]> {
    const res = await this.request<{ transactions: WalletTransaction[] }>('/api/wallet/transactions');
    return res.transactions;
  }

  async requestWithdrawal(
    method: 'UPI' | 'BANK',
    amountINR: number,
    details: Record<string, string>,
    idempotencyKey?: string
  ): Promise<{ success: boolean; withdrawal: WithdrawalRequest; transaction: WalletTransaction; user: UserProfile; message: string }> {
    return this.request('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ method, amountINR, details, idempotencyKey }),
    });
  }

  // Referral
  async claimReferral(code: string): Promise<{ bonusEarned: number; user: UserProfile; message: string }> {
    return this.request('/api/referral/claim', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Admin
  async getAdminOverview(): Promise<{
    totalUsers: number;
    totalPointsDistributed: number;
    totalPointsInCirculation: number;
    totalWithdrawnINR: number;
    pendingWithdrawalsCount: number;
    fraudAlertsCount: number;
    sandboxMode: boolean;
  }> {
    return this.request('/api/admin/overview');
  }

  async getAdminUsers(): Promise<UserProfile[]> {
    const res = await this.request<{ users: UserProfile[] }>('/api/admin/users');
    return res.users;
  }

  async adminUserAction(userId: string, action: 'TOGGLE_BAN' | 'ADJUST_POINTS', pointsDelta?: number, reason?: string): Promise<UserProfile> {
    const res = await this.request<{ user: UserProfile }>(`/api/admin/users/${userId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, pointsDelta, reason }),
    });
    return res.user;
  }

  async getAdminWithdrawals(): Promise<WithdrawalRequest[]> {
    const res = await this.request<{ withdrawals: WithdrawalRequest[] }>('/api/admin/withdrawals');
    return res.withdrawals;
  }

  async adminWithdrawalAction(id: string, action: 'APPROVE' | 'REJECT', adminNote?: string): Promise<{ withdrawal: WithdrawalRequest; user?: UserProfile }> {
    return this.request(`/api/admin/withdrawals/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNote }),
    });
  }

  async getAdminConfig(): Promise<SystemConfig> {
    const res = await this.request<{ config: SystemConfig }>('/api/admin/config');
    return res.config;
  }

  async updateAdminConfig(updates: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await this.request<{ config: SystemConfig }>('/api/admin/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.config;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await this.request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs');
    return res.auditLogs;
  }

  async getAnnouncements(): Promise<Array<{ id: string; title: string; message: string; date: string; type: string }>> {
    const res = await this.request<{ announcements: Array<{ id: string; title: string; message: string; date: string; type: string }> }>('/api/announcements');
    return res.announcements;
  }
}

export const api = new ApiService();
