import { UserProfile, WalletTransaction, WithdrawalRequest, DailyQuest, SystemConfig, AuditLog } from '../types';

class ApiService {
  private currentUserId: string = (typeof window !== 'undefined' && localStorage.getItem('gameearn_user_id')) || 'usr_default_2026';

  public setUserId(id: string) {
    this.currentUserId = id;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gameearn_user_id', id);
      } catch {
        // ignore
      }
    }
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-user-id': this.currentUserId,
      ...options.headers,
    };

    let res: Response;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : 'Unknown connection error';
      throw new Error(`Network error: Unable to connect to backend (${url}): ${msg}`);
    }

    const contentType = res.headers.get('content-type') || '';
    let data: Record<string, unknown> | null = null;

    if (contentType.includes('application/json')) {
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        throw new Error(`Server returned invalid JSON response (${res.status} ${res.statusText}).`);
      }
    } else {
      const rawText = await res.text();
      const cleanSnippet = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

      if (res.status === 404) {
        throw new Error(
          `API endpoint '${url}' not found (404). If deployed on Vercel, ensure the Vercel API routing rewrite is active.`
        );
      }

      throw new Error(
        `Backend returned unexpected non-JSON response (${res.status}): ${cleanSnippet || res.statusText || 'No response body'}`
      );
    }

    if (!res.ok) {
      const errorMsg = typeof data?.error === 'string' ? data.error : `Request failed with status ${res.status}.`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // Auth
  async sendOtp(identifier: string): Promise<{ success: boolean; devOtp?: string; message: string }> {
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
    this.setUserId(res.user.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gameearn_cached_user', JSON.stringify(res.user));
      } catch {}
    }
    return res;
  }

  async guestLogin(mode: 'GUNJAN' | 'GUEST' = 'GUNJAN', name?: string): Promise<{ success: boolean; user: UserProfile; token: string }> {
    const res = await this.request<{ success: boolean; user: UserProfile; token: string }>('/api/auth/guest-login', {
      method: 'POST',
      body: JSON.stringify({ mode, name }),
    });
    this.setUserId(res.user.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gameearn_cached_user', JSON.stringify(res.user));
      } catch {}
    }
    return res;
  }

  async firebaseLogin(idToken: string, phoneNumber: string, referralCode?: string): Promise<{ success: boolean; user: UserProfile; token: string }> {
    const res = await this.request<{ success: boolean; user: UserProfile; token: string }>('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify({ idToken, phoneNumber, referralCode }),
    });
    this.setUserId(res.user.id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('gameearn_cached_user', JSON.stringify(res.user));
      } catch {}
    }
    return res;
  }

  async getCurrentUser(): Promise<UserProfile> {
    try {
      const res = await this.request<{ user: UserProfile }>('/api/auth/me');
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('gameearn_cached_user', JSON.stringify(res.user));
        } catch {}
      }
      return res.user;
    } catch (err) {
      // If network or cold start fails, check for cached profile
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('gameearn_cached_user');
        if (cached) {
          try {
            return JSON.parse(cached);
          } catch {}
        }
      }
      throw err;
    }
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
