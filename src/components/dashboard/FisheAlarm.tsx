import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import fisheImg from '@/assets/fishe.png';

interface FisheAlarmProps {
  warnings: string[];
  muted: boolean;
  onToggleMute: () => void;
}

const FisheAlarm = ({ warnings, muted, onToggleMute }: FisheAlarmProps) => {
  const [visible, setVisible] = useState(false);
  const [currentWarning, setCurrentWarning] = useState('');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const activeWarnings = warnings.filter(w => !dismissed.has(w));
    if (activeWarnings.length > 0) {
      setCurrentWarning(activeWarnings[0]);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [warnings, dismissed]);

  const dismiss = () => {
    setDismissed(prev => new Set([...prev, currentWarning]));
  };

  return (
    <>
      {/* Fishe avatar always visible near budget summary */}
      <div className="relative inline-flex items-center gap-2">
        <motion.img
          src={fisheImg}
          alt="Fishe the Financer"
          className={`w-12 h-12 rounded-full border-2 object-cover ${
            warnings.length > 0 ? 'border-destructive' : 'border-border'
          }`}
          animate={warnings.length > 0 && !muted ? { rotate: [-3, 3, -3, 3, 0] } : {}}
          transition={{ duration: 0.5, repeat: warnings.length > 0 ? Infinity : 0, repeatDelay: 2 }}
        />
        {warnings.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            {warnings.filter(w => !dismissed.has(w)).length || '!'}
          </span>
        )}
      </div>

      {/* Alarm popup */}
      <AnimatePresence>
        {visible && !muted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="kawaii-card bg-card border-destructive border-2 p-4">
              <div className="flex items-start gap-3">
                <motion.img
                  src={fisheImg}
                  alt="Fishe"
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                  animate={{ x: [-2, 2, -2, 2, 0] }}
                  transition={{ duration: 0.3, repeat: 3 }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">🚨 Fishe Alert!</p>
                  <p className="text-sm text-foreground">{currentWarning}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" onClick={dismiss} className="h-6 w-6">
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={onToggleMute} className="text-xs gap-1 text-muted-foreground">
                  <VolumeX className="w-3 h-3" /> Mute alerts
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unmute button when muted */}
      {muted && warnings.length > 0 && (
        <Button variant="ghost" size="sm" onClick={onToggleMute} className="text-xs gap-1 text-muted-foreground">
          <Volume2 className="w-3 h-3" /> Unmute Fishe
        </Button>
      )}
    </>
  );
};

export default FisheAlarm;
