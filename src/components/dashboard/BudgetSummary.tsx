import { motion } from 'framer-motion';
import { Category } from '@/types/budget';
import fisheImg from '@/assets/fishe.png';

interface BudgetSummaryProps {
  monthlyBudget: number;
  totalSpent: number;
  todaySpent: number;
  dailyLimit: number;
  categories: Category[];
  getCategorySpent: (id: string) => number;
}

const BudgetSummary = ({ monthlyBudget, totalSpent, todaySpent, dailyLimit }: BudgetSummaryProps) => {
  const remaining = monthlyBudget - totalSpent;
  const percentage = monthlyBudget > 0 ? Math.min((totalSpent / monthlyBudget) * 100, 100) : 0;
  const isOver = remaining < 0;

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">💰 Budget Overview</span>
        <img src={fisheImg} alt="Fishe" className="w-6 h-6 rounded-full object-cover ml-auto border border-border" />
      </div>

      <div className="p-4 space-y-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Monthly Budget</p>
          <p className="text-2xl font-display text-foreground">₹{monthlyBudget.toLocaleString()}</p>
        </div>

        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isOver ? 'bg-destructive' : 'gradient-primary'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center kawaii-card bg-background py-2">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className={`text-lg font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}>
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="text-center kawaii-card bg-background py-2">
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className={`text-lg font-bold ${isOver ? 'text-destructive' : 'text-success'}`}>
              {isOver ? '-' : ''}₹{Math.abs(remaining).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="kawaii-card bg-background py-2 text-center">
          <p className="text-xs text-muted-foreground">Today's Spending</p>
          <p className={`text-lg font-bold ${todaySpent > dailyLimit && dailyLimit > 0 ? 'text-destructive' : 'text-foreground'}`}>
            ₹{todaySpent.toLocaleString()}
            <span className="text-xs font-normal text-muted-foreground"> / ₹{Math.round(dailyLimit).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;
