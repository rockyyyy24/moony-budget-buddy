import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  currentMode: 'budgeting' | 'analysis';
  onContinue: () => void;
  onSwitch: () => void;
}

const EndOfMonthDialog = ({ open, currentMode, onContinue, onSwitch }: Props) => {
  const target = currentMode === 'budgeting' ? 'Spending Analysis' : 'Budgeting';
  return (
    <Dialog open={open}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">🗓️ New month, new vibes!</DialogTitle>
          <DialogDescription>
            You're currently in <b>{currentMode === 'budgeting' ? 'Budgeting' : 'Spending Analysis'}</b> mode.
            Wanna keep it that way or switch to <b>{target}</b>? Your expenses stick around either way 🦆💕
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={onContinue} className="w-full gradient-primary text-primary-foreground border-0">
            ✨ Continue with {currentMode === 'budgeting' ? 'Budgeting' : 'Spending Analysis'}
          </Button>
          <Button onClick={onSwitch} variant="outline" className="w-full">
            🔄 Switch to {target}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EndOfMonthDialog;