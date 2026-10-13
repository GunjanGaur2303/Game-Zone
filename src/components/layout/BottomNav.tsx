import React from 'react';
import { sounds } from '../../utils/audio';
import { Home, Gamepad2, Wallet, Users } from 'lucide-react';

export type TabId = 'HOME' | 'GAMES' | 'WALLET' | 'REFER';

interface Props {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'HOME' as const, label: 'Home', icon: Home },
    { id: 'GAMES' as const, label: 'Arcade', icon: Gamepad2 },
    { id: 'WALLET' as const, label: 'Wallet', icon: Wallet },
    { id: 'REFER' as const, label: 'Refer', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                sounds.playClick();
                onChangeTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all ${
                isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </div>
              <span className={`text-[10px] font-semibold tracking-tight mt-1 ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
