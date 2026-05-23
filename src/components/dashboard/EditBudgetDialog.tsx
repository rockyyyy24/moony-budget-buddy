import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types/budget';
import { ArrowLeftRight } from 'lucide-react';

interface EditBudgetDialogProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  monthlyBudget: number;
  dailyLimit: number;
  onSave: (categories: Category[], monthlyBudget: number, dailyLimit: number) => void;
  mode?: 'budgeting' | 'analysis';
  onSwitchMode?: () => void;
}

const EditBudgetDialog = ({ open, onClose, categories, monthlyBudget, dailyLimit, onSave, mode, onSwitchMode }: EditBudgetDialogProps) => {
  const [budget, setBudget] = useState(String(monthlyBudget));
  const [daily, setDaily] = useState(String(dailyLimit || ''));
  const [limits, setLimits] = useState<Record<string, string>>(
    Object.fromEntries(categories.map(c => [c.id, c.monthlyLimit > 0 ? String(c.monthlyLimit) : '']))
  );

  const handleSave = () => {
    const updatedCats = categories.map(c => ({
      ...c,
      monthlyLimit: parseFloat(limits[c.id] || '0') || 0,
    }));
    onSave(updatedCats, parseFloat(budget) || 0, parseFloat(daily) || 0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">⚙️ Edit Budgets</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode && onSwitchMode && (
            <div className="kawaii-card bg-secondary/30 border-secondary">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Current mode</p>
                  <p className="text-sm font-display text-foreground">
                    {mode === 'budgeting' ? '💰 Budgeting' : '📊 Spending Analysis'}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={onSwitchMode}>
                  <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                  Switch to {mode === 'budgeting' ? 'Analysis' : 'Budgeting'}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">All your expenses stay logged either way ✨</p>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Monthly Budget (₹)</label>
            <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="bg-background border-border" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Daily Limit (₹)</label>
            <Input type="number" value={daily} onChange={e => setDaily(e.target.value)} placeholder="Auto-calculated if empty" className="bg-background border-border" />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">Category Limits</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="text-sm">{c.icon}</span>
                  <span className="text-sm text-foreground flex-1">{c.name}</span>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={limits[c.id] || ''}
                    onChange={e => setLimits(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-28 text-sm bg-background border-border"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground border-0">
            Save Changes ✨
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditBudgetDialog;
