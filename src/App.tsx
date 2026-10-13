import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import { api } from './utils/api';
import { sounds } from './utils/audio';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav, TabId } from './components/layout/BottomNav';
import { DashboardView } from './components/home/DashboardView';
import { GamesCatalog } from './components/games/GamesCatalog';
import { SpinWheelGame } from './components/games/SpinWheelGame';
import { QuizGame } from './components/games/QuizGame';
import { PuzzleGame } from './components/games/PuzzleGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { BubbleShooterGame } from './components/games/BubbleShooterGame';
import { NumberSprintGame } from './components/games/NumberSprintGame';
import { ScratchCardGame } from './components/games/ScratchCardGame';
import { FishingEraGame } from './components/games/FishingEraGame';
import { JiliFortuneGemsGame } from './components/games/JiliFortuneGemsGame';
import { WalletView } from './components/wallet/WalletView';
import { WithdrawalModal } from './components/wallet/WithdrawalModal';
import { ReferralView } from './components/referral/ReferralView';
import { ProfileView } from './components/profile/ProfileView';
import { LegalModal } from './components/profile/LegalModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { GameTutorialModal } from './components/games/GameTutorialModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabId | 'PROFILE'>('HOME');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'TERMS' | 'PRIVACY' | 'GAMING_LAWS' | 'PLAY_POLICY' | null>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [tutorialState, setTutorialState] = useState<{ isOpen: boolean; game: 'FISHING' | 'JILI' }>({
    isOpen: false,
    game: 'FISHING',
  });
  const [isFrameMode, setIsFrameMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user
  const fetchUser = async () => {
    try {
      setLoadingUser(true);
      const u = await api.getCurrentUser();
      setUser(u);
      setSoundEnabled(u.settings?.soundEnabled ?? true);
      sounds.setEnabled(u.settings?.soundEnabled ?? true);
    } catch {
      // Prompt auth if user not found
      setIsAuthOpen(true);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    sounds.setEnabled(nextVal);
    if (nextVal) sounds.playClick();
    if (user) {
      api.updateProfile({ settings: { ...user.settings, soundEnabled: nextVal } });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthOpen(true);
  };

  if (loadingUser && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center animate-bounce">
          <span className="text-xl font-black text-amber-400">₹</span>
        </div>
        <span className="text-xs font-bold text-slate-400 tracking-wider">Loading GameEarn Pro...</span>
      </div>
    );
  }

  // Active game view router
  const renderGame = () => {
    if (!user) return null;
    switch (activeGame) {
      case 'SPIN':
        return (
          <SpinWheelGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'QUIZ':
        return (
          <QuizGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'PUZZLE':
        return (
          <PuzzleGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'MEMORY':
        return (
          <MemoryMatchGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'BUBBLE':
        return (
          <BubbleShooterGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'NUMBER':
        return (
          <NumberSprintGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'SCRATCH':
        return (
          <ScratchCardGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'FISHING':
        return (
          <FishingEraGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      case 'JILI':
        return (
          <JiliFortuneGemsGame
            user={user}
            onUpdateUser={setUser}
            onBack={() => setActiveGame(null)}
          />
        );
      default:
        return null;
    }
  };

  // Main tab content
  const renderTabContent = () => {
    if (!user) return null;

    if (activeGame) {
      return renderGame();
    }

    switch (activeTab) {
      case 'HOME':
        return (
          <DashboardView
            user={user}
            onUpdateUser={setUser}
            onNavigateTab={(tab) => {
              if (tab === 'PROFILE') setActiveTab('PROFILE');
              else setActiveTab(tab);
            }}
            onSelectGame={(gId) => setActiveGame(gId)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            onOpenTutorial={(gId) => {
              setTutorialState({ isOpen: true, game: gId || 'FISHING' });
            }}
          />
        );
      case 'GAMES':
        return (
          <GamesCatalog
            user={user}
            onSelectGame={(gId) => setActiveGame(gId)}
          />
        );
      case 'WALLET':
        return (
          <WalletView
            user={user}
            onUpdateUser={setUser}
          />
        );
      case 'REFER':
        return (
          <ReferralView
            user={user}
            onUpdateUser={setUser}
          />
        );
      case 'PROFILE':
        return (
          <ProfileView
            user={user}
            onUpdateUser={setUser}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onLogout={handleLogout}
            onOpenLegal={(doc) => setLegalDoc(doc)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-amber-500 selection:text-slate-950">
      {/* Outer wrapper: Fullscreen or Simulated Android Phone Frame */}
      <div
        className={`w-full transition-all duration-300 flex flex-col ${
          isFrameMode
            ? 'max-w-[420px] my-4 rounded-[40px] border-[8px] border-slate-800 shadow-2xl overflow-hidden bg-slate-950 relative min-h-[840px] max-h-[92vh]'
            : 'max-w-md min-h-screen relative'
        }`}
      >
        {/* Android Speaker Notch in Frame Mode */}
        {isFrameMode && (
          <div className="h-6 bg-slate-900 flex items-center justify-center shrink-0">
            <div className="w-16 h-3.5 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
          </div>
        )}

        {/* Top Header */}
        {user && !activeGame && (
          <TopHeader
            user={user}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onOpenWallet={() => setActiveTab('WALLET')}
            onOpenProfile={() => setActiveTab('PROFILE')}
            onOpenAdmin={() => setIsAdminOpen(true)}
            isFrameMode={isFrameMode}
            onToggleFrameMode={() => setIsFrameMode(!isFrameMode)}
            onOpenTutorial={() => setTutorialState({ isOpen: true, game: 'FISHING' })}
          />
        )}

        {/* Scrollable Content Body */}
        <main className="flex-1 p-4 overflow-y-auto">
          {renderTabContent()}
        </main>

        {/* Bottom Navigation */}
        {user && !activeGame && (
          <BottomNav
            activeTab={activeTab === 'PROFILE' ? 'HOME' : activeTab}
            onChangeTab={(t) => {
              setActiveGame(null);
              setActiveTab(t);
            }}
          />
        )}

        {/* Android Home Indicator in Frame Mode */}
        {isFrameMode && (
          <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
            <div className="w-24 h-1 bg-slate-700 rounded-full" />
          </div>
        )}
      </div>

      {/* Admin Dashboard Overlay Modal */}
      {isAdminOpen && user && (
        <AdminDashboard
          currentUser={user}
          onClose={() => setIsAdminOpen(false)}
          onRefreshCurrentUser={fetchUser}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen || !user}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setIsAuthOpen(false);
        }}
        onOpenLegal={(doc) => setLegalDoc(doc)}
      />

      {/* Legal & Compliance Modal */}
      <LegalModal
        docType={legalDoc}
        onClose={() => setLegalDoc(null)}
      />

      {/* Standalone Withdrawal Modal trigger */}
      {user && (
        <WithdrawalModal
          user={user}
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={(u) => setUser(u)}
        />
      )}

      {/* Global Interactive Tutorial Overlay Modal */}
      <GameTutorialModal
        isOpen={tutorialState.isOpen}
        onClose={() => setTutorialState((prev) => ({ ...prev, isOpen: false }))}
        initialGame={tutorialState.game}
        onLaunchGame={(gId) => {
          setTutorialState((prev) => ({ ...prev, isOpen: false }));
          setActiveGame(gId);
        }}
      />
    </div>
  );
}
