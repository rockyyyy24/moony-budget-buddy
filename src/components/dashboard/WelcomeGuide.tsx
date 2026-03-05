import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, BarChart3, Trophy, Sparkles } from 'lucide-react';
import moonyImg from '@/assets/moony.png';

interface WelcomeGuideProps {
  onDismiss: () => void;
}

const features = [
  { icon: MessageCircle, title: 'Chat to Log', desc: 'Just type "Pizza 250" and Mooney logs it for you!' },
  { icon: Calendar, title: 'Calendar View', desc: 'See your daily spending at a glance with color coding' },
  { icon: BarChart3, title: 'Monthly Report', desc: 'Track trends and see where your money goes' },
  { icon: Trophy, title: 'Sticker Book', desc: 'Earn badges and decorate your sticker book!' },
];

const WelcomeGuide = ({ onDismiss }: WelcomeGuideProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onDismiss} />
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="retro-window w-full max-w-md relative z-10">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">Welcome to Mooney! 🎉</span>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <img src={moonyImg} alt="Mooney" className="w-14 h-14 rounded-full border-2 border-secondary object-cover" />
            <div className="kawaii-card bg-secondary/30 border-secondary flex-1 py-2 px-3">
              <p className="text-sm text-foreground">Welcome aboard bestie! 🦆✨ Here's a quick tour!</p>
            </div>
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                className="kawaii-card bg-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="kawaii-card bg-primary/10 border-primary/30 text-center">
            <p className="text-sm text-foreground">💡 <strong>Pro tip:</strong> Type "help" in chat anytime!</p>
          </div>
          <Button onClick={onDismiss} className="w-full gradient-primary text-primary-foreground border-0 gap-2">
            <Sparkles className="w-4 h-4" /> Got it, let's go!
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeGuide;
