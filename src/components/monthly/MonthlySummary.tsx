import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Download, RotateCcw, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Expense } from '@/types/budget';
import { getSpendingSuggestions } from '@/utils/expenseParser';
import { exportCSV } from '@/utils/storage';
import fisheImg from '@/assets/fishe.png';

interface MonthlySummaryProps {
  categories: Category[];
  expenses: Expense[];
  monthlyBudget: number;
  totalSpent: number;
  onReset: () => void;
}

const MonthlySummary = ({ categories, expenses, monthlyBudget, totalSpent, onReset }: MonthlySummaryProps) => {
  const [guessCategory, setGuessCategory] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const catSpending = categories.map(c => ({
    ...c,
    spent: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).sort((a, b) => b.spent - a.spent);

  const topCategory = catSpending[0];
  const overBudgetCats = catSpending.filter(c => c.monthlyLimit > 0 && c.spent > c.monthlyLimit);
  const remaining = monthlyBudget - totalSpent;
  const percentage = monthlyBudget > 0 ? Math.round((totalSpent / monthlyBudget) * 100) : 0;

  const handleGuess = (catId: string) => {
    setGuessCategory(catId);
    setShowResult(true);
  };

  const handleExport = () => {
    const csv = exportCSV(expenses, categories);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moony-budget-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">📊 Monthly Report</span>
      </div>

      <div className="p-6 space-y-6">
        {/* Budget Overview */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Budget</p>
          <p className="text-3xl font-display text-foreground">₹{monthlyBudget.toLocaleString()}</p>
          <div className="h-4 rounded-full bg-muted overflow-hidden mt-3 mx-auto max-w-xs">
            <motion.div
              className={`h-full rounded-full ${percentage > 100 ? 'bg-destructive' : 'gradient-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className={`text-lg font-bold mt-2 ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
            {remaining >= 0 ? `₹${remaining.toLocaleString()} remaining` : `₹${Math.abs(remaining).toLocaleString()} over budget!`}
            <span className="text-sm font-normal text-muted-foreground ml-2">({percentage}%)</span>
          </p>
        </div>

        {/* Category Ranking */}
        <div>
          <h3 className="font-display text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Spending by Category
          </h3>
          <div className="space-y-2">
            {catSpending.filter(c => c.spent > 0).map((c, i) => {
              const barWidth = topCategory.spent > 0 ? (c.spent / topCategory.spent) * 100 : 0;
              const isOver = c.monthlyLimit > 0 && c.spent > c.monthlyLimit;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 text-center">{c.icon}</span>
                  <span className="w-24 text-sm font-medium text-foreground truncate">{c.name}</span>
                  <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center px-2 text-xs font-bold text-primary-foreground ${
                        isOver ? 'bg-destructive' : 'gradient-primary'
                      }`}
                      style={{ width: `${Math.max(barWidth, 15)}%` }}
                    >
                      ₹{c.spent.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Overspent categories */}
        {overBudgetCats.length > 0 && (
          <div className="kawaii-card bg-destructive/10 border-destructive/30">
            <div className="flex items-center gap-2 mb-2">
              <img src={fisheImg} alt="Fishe" className="w-8 h-8 rounded-full object-cover" />
              <h4 className="font-semibold text-foreground text-sm">🚨 Over Budget Categories</h4>
            </div>
            {overBudgetCats.map(c => (
              <p key={c.id} className="text-sm text-foreground ml-10">
                {c.icon} {c.name}: ₹{c.spent.toLocaleString()} / ₹{c.monthlyLimit.toLocaleString()}
                <span className="text-destructive font-bold"> (+₹{(c.spent - c.monthlyLimit).toLocaleString()})</span>
              </p>
            ))}
          </div>
        )}

        {/* Guess game */}
        {expenses.length > 0 && !showResult && (
          <div className="kawaii-card bg-secondary/20 border-secondary">
            <p className="font-semibold text-foreground text-sm mb-3">🤔 Which category did you spend the most on?</p>
            <div className="flex flex-wrap gap-2">
              {catSpending.slice(0, 5).map(c => (
                <Button key={c.id} variant="outline" size="sm" onClick={() => handleGuess(c.id)} className="gap-1">
                  {c.icon} {c.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showResult && topCategory && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="kawaii-card bg-muted border-primary">
              <p className="text-sm text-foreground">
                {guessCategory === topCategory.id
                  ? `✅ You guessed right! ${topCategory.icon} ${topCategory.name} at ₹${topCategory.spent.toLocaleString()}`
                  : `😅 Actually it was ${topCategory.icon} ${topCategory.name} at ₹${topCategory.spent.toLocaleString()}!`
                }
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        {catSpending.filter(c => c.spent > 0).length > 0 && (
          <div>
            <h3 className="font-display text-foreground mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Tips to Save
            </h3>
            {catSpending.filter(c => c.spent > 0).slice(0, 3).map(c => (
              <div key={c.id} className="mb-3">
                <p className="text-sm font-semibold text-foreground mb-1">{c.icon} {c.name}</p>
                {getSpendingSuggestions(c.name).map((tip, i) => (
                  <p key={i} className="text-xs text-muted-foreground ml-4">{tip}</p>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExport} className="gap-1 text-xs">
            <Download className="w-3 h-3" /> Export CSV
          </Button>
          <Button variant="outline" onClick={onReset} className="gap-1 text-xs text-destructive">
            <RotateCcw className="w-3 h-3" /> Reset Month
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;
