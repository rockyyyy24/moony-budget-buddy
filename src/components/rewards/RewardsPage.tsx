import { motion } from 'framer-motion';
import { Reward, REWARD_BADGES } from '@/types/budget';
import { Trophy, Flame } from 'lucide-react';

interface RewardsPageProps {
  rewards: Reward[];
  greenDayStreak: number;
}

const RewardsPage = ({ rewards, greenDayStreak }: RewardsPageProps) => {
  const earned = new Set(rewards.map(r => r.id));

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">🏆 Sticker Book</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Streak */}
        <div className="text-center kawaii-card bg-secondary/20 border-secondary">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-accent" />
            <span className="font-display text-foreground">Green Day Streak</span>
          </div>
          <p className="text-3xl font-display text-foreground">{greenDayStreak}</p>
          <p className="text-xs text-muted-foreground">days within daily budget</p>
        </div>

        {/* Badges */}
        <div>
          <h3 className="font-display text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Your Stickers
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REWARD_BADGES.map((badge, i) => {
              const isEarned = earned.has(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`kawaii-card text-center ${isEarned ? 'bg-card' : 'bg-muted/50 opacity-50'}`}
                >
                  <span className="text-3xl block mb-1">{badge.emoji}</span>
                  <p className="text-xs font-semibold text-foreground">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.description}</p>
                  {isEarned && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-success">✓ Earned!</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {rewards.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Keep tracking to earn stickers! 🌟
          </p>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;
