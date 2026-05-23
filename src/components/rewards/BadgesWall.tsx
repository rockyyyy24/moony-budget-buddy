import { motion } from 'framer-motion';
import { Reward, REWARD_BADGES } from '@/types/budget';

interface Props {
  rewards: Reward[];
}

const FRAME_STYLES = [
  'rotate-[-3deg] bg-peach',
  'rotate-[2deg] bg-sky',
  'rotate-[-1deg] bg-mint',
  'rotate-[4deg] bg-bubblegum',
  'rotate-[-2deg] bg-sunshine',
  'rotate-[3deg] bg-lavender',
];

const BadgesWall = ({ rewards }: Props) => {
  const earnedMap = new Map(rewards.map(r => [r.id, r]));

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">🖼️ Hall of Quack</span>
      </div>
      <div
        className="p-6 relative"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, hsl(var(--secondary) / 0.15) 0 2px, transparent 2px 40px),
            repeating-linear-gradient(90deg, hsl(var(--lavender) / 0.1) 0 2px, transparent 2px 40px)
          `,
        }}
      >
        <p className="text-center text-sm text-muted-foreground mb-6 font-display">
          Every badge you win gets framed here forever 🦆✨
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          {REWARD_BADGES.map((badge, i) => {
            const earned = earnedMap.get(badge.id);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 30, rotate: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring' }}
                whileHover={{ scale: 1.08, rotate: 0, y: -4 }}
                className={`relative ${FRAME_STYLES[i % FRAME_STYLES.length]} p-3 rounded-lg border-4 border-foreground/80 shadow-[6px_6px_0_hsl(var(--foreground)/0.2)] ${!earned ? 'opacity-40 grayscale' : ''}`}
              >
                {/* Nail */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-foreground/80 shadow" />
                <div className="bg-card rounded-md p-3 text-center min-h-[120px] flex flex-col items-center justify-center">
                  <motion.span
                    className="text-4xl block mb-1"
                    animate={earned ? { rotate: [0, -8, 8, 0] } : {}}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  >
                    {badge.emoji}
                  </motion.span>
                  <p className="text-xs font-display text-foreground leading-tight">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{badge.description}</p>
                  {earned ? (
                    <span className="mt-1 text-[10px] font-bold text-success">
                      ✓ {new Date(earned.earnedDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="mt-1 text-[10px] text-muted-foreground italic">Locked 🔒</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          {rewards.length} / {REWARD_BADGES.length} badges earned
        </p>
      </div>
    </div>
  );
};

export default BadgesWall;