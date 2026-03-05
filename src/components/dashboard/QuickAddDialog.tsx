import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category } from '@/types/budget';

interface QuickAddDialogProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onAdd: (amount: number, categoryId: string, note: string) => void;
}

const QuickAddDialog = ({ open, onClose, categories, onAdd }: QuickAddDialogProps) => {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAdd(amt, categoryId, note);
    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">✏️ Quick Add Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Amount (₹)</label>
            <Input
              type="number"
              placeholder="250"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground block mb-1">Note</label>
            <Input
              placeholder="What was this for?"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="bg-background border-border"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full gradient-primary text-primary-foreground border-0">
            Add Expense ✨
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddDialog;
