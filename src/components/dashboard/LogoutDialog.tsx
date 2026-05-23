import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  onKeep: () => void;
  onReset: () => void;
}

const LogoutDialog = ({ open, onClose, onKeep, onReset }: Props) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="bg-card border-border">
      <DialogHeader>
        <DialogTitle className="font-display text-foreground">👋 Logging out?</DialogTitle>
        <DialogDescription>
          Want me to keep your stuff safe for when you're back, or wipe the slate clean?
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3 pt-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={onKeep} className="w-full gradient-primary text-primary-foreground border-0">
            💾 Save my data
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={onReset} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
            🧹 Reset & start fresh
          </Button>
        </motion.div>
        <Button variant="ghost" onClick={onClose} className="w-full">Cancel</Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default LogoutDialog;