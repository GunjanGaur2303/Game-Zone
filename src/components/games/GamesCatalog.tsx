import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { sounds } from '../../utils/audio';
import { Sparkles, Play, Flame, Brain, Award, Shuffle, Grid, HelpCircle, Zap, BookOpen } from 'lucide-react';
import { GameTutorialModal } from './GameTutorialModal';

interface Props {
  user: UserProfile;
  onSelectGame: (gameId: string) => void;
}

interface GameCardItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Arcade' | 'Brain' | 'Trivia' | 'Instant' | 'Fishing' | 'JILI';
  pointsReward: string;
  image?: string;
  badge?: string;
  icon: React.ReactNode;
}

export const GamesCatalog: React.FC<Props> = ({ onSelectGame }) => {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Fishing' | 'JILI' | 'Arcade' | 'Brain' | 'Trivia' | 'Instant'>('ALL');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialGame, setTutorialGame] = useState<'FISHING' | 'JILI'>('FISHING');

  const games: GameCardItem[] = [
    {
      id: 'FISHING',
      title: 'Fishing Era: Ocean Hunter',
      subtitle: 'Aim laser net cannons at swimming fish & golden dragons',
      category: 'Fishing',
      pointsReward: 'Up to 150 Pts',
      image: '/src/assets/images/banner_fishing_era_1791821515433.jpg',
      badge: 'NEW · Hot',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
    },
    {
      id: 'JILI',
      title: 'JILI Golden Fortune Gems',
      subtitle: 'Super Ace cascade reels & 4th multiplier wheel',
      category: 'JILI',
      pointsReward: 'Up to 160 Pts',
      image: '/src/assets/images/banner_jili_arcade_1791821531038.jpg',
      badge: 'JILI Official',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'SPIN',
      title: 'Lucky Spin Wheel',
      subtitle: 'Spin for guaranteed coins & jackpot rewards',
      category: 'Instant',
      pointsReward: 'Up to 100 Pts',
      image: '/src/assets/images/banner_spin_wheel_1791818183557.jpg',
      badge: 'Daily 5 Free',
      icon: <Shuffle className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'QUIZ',
      title: 'Quiz Trivia Arena',
      subtitle: 'Cricket, Science & Indian GK speed trivia',
      category: 'Trivia',
      pointsReward: 'Up to 150 Pts',
      image: '/src/assets/images/banner_quiz_trivia_1791818195738.jpg',
      badge: 'Popular',
      icon: <HelpCircle className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: 'BUBBLE',
      title: 'Bubble Blaster Space',
      subtitle: 'Classic arcade cluster pop shooting action',
      category: 'Arcade',
      pointsReward: 'Up to 120 Pts',
      image: '/src/assets/images/banner_bubble_shooter_1791818206228.jpg',
      badge: 'High Action',
      icon: <Flame className="w-5 h-5 text-red-400" />,
    },
    {
      id: 'SCRATCH',
      title: 'Mystery Scratch Card',
      subtitle: 'Rub foil to uncover mystery cash points',
      category: 'Instant',
      pointsReward: 'Up to 100 Pts',
      badge: 'Instant Win',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 'NUMBER',
      title: 'Math Speed Sprint',
      subtitle: '30-second rapid-fire arithmetic challenge',
      category: 'Brain',
      pointsReward: 'Up to 100 Pts',
      badge: 'Skill Based',
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'PUZZLE',
      title: 'Number Tile Puzzle',
      subtitle: 'Classic 3x3 sliding blocks mental workout',
      category: 'Brain',
      pointsReward: 'Up to 80 Pts',
      icon: <Grid className="w-5 h-5 text-blue-400" />,
    },
    {
      id: 'MEMORY',
      title: 'Memory Card Match',
      subtitle: 'Pair 8 matching icons with lowest moves',
      category: 'Brain',
      pointsReward: 'Up to 60 Pts',
      icon: <Brain className="w-5 h-5 text-purple-400" />,
    },
  ];

  const filteredGames = selectedCategory === 'ALL'
    ? games
    : games.filter((g) => g.category === selectedCategory);

  return (
    <div className="space-y-4 pb-20">
      {/* Title & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Arcade Game Center
          </h2>
          <p className="text-xs text-slate-400">Play casual skill, Fishing Era & JILI games for real rewards</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {(['ALL', 'Fishing', 'JILI', 'Instant', 'Trivia', 'Arcade', 'Brain'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              sounds.playClick();
              setSelectedCategory(cat);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'All Games' : cat === 'Fishing' ? '🎣 Fishing Era' : cat === 'JILI' ? '🎰 JILI Games' : cat}
          </button>
        ))}
      </div>

      {/* Interactive Tutorial Guide Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-purple-950 to-slate-900 border border-sky-800/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              New to Fishing Era & JILI Games?
            </span>
            <span className="text-[10px] text-slate-300">
              Learn aiming, 4th multiplier reel & boss fish mechanics
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setTutorialGame('FISHING');
            setTutorialOpen(true);
          }}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl whitespace-nowrap shadow-md active:scale-95 transition-all"
        >
          View Guide
        </button>
      </div>

      {/* Games List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => {
              sounds.playClick();
              onSelectGame(game.id);
            }}
            className="group relative bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-200 active:scale-[0.99] flex flex-col justify-between"
          >
            {/* Banner image if available */}
            {game.image ? (
              <div className="relative w-full h-32 overflow-hidden bg-slate-950">
                <img
                  src={game.image}
                  alt={game.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                {game.badge && (
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shadow">
                    {game.badge}
                  </span>
                )}
              </div>
            ) : (
              <div className="p-4 pb-0 flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  {game.icon}
                </div>
                {game.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                    {game.badge}
                  </span>
                )}
              </div>
            )}

            {/* Content Details */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  {game.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">{game.subtitle}</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{game.pointsReward}</span>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-amber-500/10 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 text-xs font-bold flex items-center gap-1 transition-all">
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tutorial Overlay Modal */}
      <GameTutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        initialGame={tutorialGame}
        onLaunchGame={(gId) => onSelectGame(gId)}
      />
    </div>
  );
};
