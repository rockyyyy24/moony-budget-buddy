import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Reward, REWARD_BADGES, StickerPlacement } from '@/types/budget';
import { Trophy, Flame, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RewardsPageProps {
  rewards: Reward[];
  greenDayStreak: number;
  stickerPlacements: StickerPlacement[];
  onUpdatePlacements: (placements: StickerPlacement[]) => void;
}

const EXTRA_STICKERS = [
  { id: 'star-gold', emoji: '⭐', name: 'Gold Star' },
  { id: 'heart-pink', emoji: '💖', name: 'Love' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow' },
  { id: 'sparkles', emoji: '✨', name: 'Sparkles' },
  { id: 'duck', emoji: '🦆', name: 'Mooney' },
  { id: 'fish', emoji: '🐟', name: 'Fishie' },
  { id: 'money-bag', emoji: '💰', name: 'Money Bag' },
  { id: 'crown', emoji: '👑', name: 'Crown' },
  { id: 'rocket', emoji: '🚀', name: 'Rocket' },
  { id: 'clover', emoji: '🍀', name: 'Lucky' },
  { id: 'diamond', emoji: '💎', name: 'Diamond' },
  { id: 'fire', emoji: '🔥', name: 'Fire' },
];

const RewardsPage = ({ rewards, greenDayStreak, stickerPlacements, onUpdatePlacements }: RewardsPageProps) => {
  const earned = new Set(rewards.map(r => r.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);

  // All available stickers: earned badges + extra decorative stickers
  const earnedBadgeStickers = REWARD_BADGES.filter(b => earned.has(b.id));
  const allAvailable = [
    ...earnedBadgeStickers.map(b => ({ id: b.id, emoji: b.emoji, name: b.name })),
    ...EXTRA_STICKERS,
  ];

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const stickerId = e.dataTransfer.getData('stickerId');
    if (!stickerId || !bookRef.current) return;

    const rect = bookRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const rotation = Math.random() * 30 - 15;

    onUpdatePlacements([
      ...stickerPlacements,
      { stickerId, x, y, rotation, scale: 1 },
    ]);
  };

  const removeSticker = (index: number) => {
    onUpdatePlacements(stickerPlacements.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onUpdatePlacements([]);
  };

  const getStickerEmoji = (id: string) => {
    const badge = REWARD_BADGES.find(b => b.id === id);
    if (badge) return badge.emoji;
    const extra = EXTRA_STICKERS.find(s => s.id === id);
    return extra?.emoji || '📌';
  };

  return (
    <div className="space-y-6">
      {/* Streak Card */}
      <div className="retro-window">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">🏆 Sticker Book</span>
        </div>
        <div className="p-4">
          <div className="text-center kawaii-card bg-secondary/20 border-secondary">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-accent" />
              <span className="font-display text-foreground">Green Day Streak</span>
            </div>
            <p className="text-3xl font-display text-foreground">{greenDayStreak}</p>
            <p className="text-xs text-muted-foreground">days within daily budget</p>
          </div>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="retro-window">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">
            <Trophy className="w-3.5 h-3.5 inline mr-1" /> Achievements
          </span>
        </div>
        <div className="p-4">
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
      </div>

      {/* Interactive Sticker Book */}
      <div className="retro-window">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">
            <BookOpen className="w-3.5 h-3.5 inline mr-1" /> My Sticker Book
          </span>
          <div className="ml-auto flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className="text-xs h-6"
            >
              {editMode ? 'Done' : 'Edit'}
            </Button>
            {stickerPlacements.length > 0 && editMode && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-6 text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Sticker palette - drag from here */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-semibold">Drag stickers onto the book below:</p>
            <div className="flex flex-wrap gap-2">
              {allAvailable.map(s => (
                <motion.div
                  key={s.id}
                  draggable
                  onDragStart={(e: any) => {
                    (e as DragEvent).dataTransfer?.setData('stickerId', s.id);
                    setDragging(s.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className={`cursor-grab active:cursor-grabbing p-2 rounded-xl border-2 transition-colors ${
                    dragging === s.id ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                  title={s.name}
                >
                  <span className="text-2xl">{s.emoji}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* The book page - drop zone */}
          <div
            ref={bookRef}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="relative w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-card overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--secondary) / 0.15) 1px, transparent 1px), radial-gradient(circle at 80% 70%, hsl(var(--lavender) / 0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px, 60px 60px',
            }}
          >
            {stickerPlacements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                <p>Drag & drop stickers here! ✨</p>
              </div>
            )}

            <AnimatePresence>
              {stickerPlacements.map((placement, i) => (
                <motion.div
                  key={`${placement.stickerId}-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: placement.scale, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: `${placement.x}%`,
                    top: `${placement.y}%`,
                    transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
                  }}
                  whileHover={{ scale: placement.scale * 1.2 }}
                  onClick={() => editMode && removeSticker(i)}
                >
                  <span className="text-4xl drop-shadow-md">{getStickerEmoji(placement.stickerId)}</span>
                  {editMode && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                      ×
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Book spine decoration */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-secondary/30" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {stickerPlacements.length} sticker{stickerPlacements.length !== 1 ? 's' : ''} placed • 
            {editMode ? ' Tap a sticker to remove it' : ' Click Edit to remove stickers'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RewardsPage;
