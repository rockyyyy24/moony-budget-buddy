import { motion } from 'framer-motion';
import moonyImg from '@/assets/moony.png';

interface MoonyZoneProps {
  onClick: () => void;
  message?: string;
}

const MoonyZone = ({ onClick, message }: MoonyZoneProps) => {
  return (
    <motion.div
      className="fixed bottom-4 left-4 z-50 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className="relative">
        <motion.img
          src={moonyImg}
          alt="Moony the duck"
          className="w-16 h-16 rounded-full border-2 border-secondary object-cover shadow-lg"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Speech bubble */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="kawaii-card bg-card px-3 py-2 text-xs whitespace-nowrap text-foreground font-medium">
            {message || "Click me to chat! 🦆"}
          </div>
        </div>

        {/* Notification dot */}
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse" />
      </div>
    </motion.div>
  );
};

export default MoonyZone;
