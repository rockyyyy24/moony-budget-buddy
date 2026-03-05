import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Expense, Category } from '@/types/budget';
import { ChevronDown, ChevronUp, Search, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CATEGORY_COLORS } from '@/types/budget';

interface CategoryCardProps {
  category: Category;
  spent: number;
  expenses: Expense[];
  onChangeCategory: (expenseId: string, newCatId: string) => void;
  allCategories: Category[];
}

const CategoryCard = ({ category, spent, expenses, onChangeCategory, allCategories }: CategoryCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const remaining = category.monthlyLimit > 0 ? category.monthlyLimit - spent : null;
  const percentage = category.monthlyLimit > 0 ? Math.min((spent / category.monthlyLimit) * 100, 100) : 0;
  const isOver = remaining !== null && remaining < 0;

  const filtered = expenses.filter(e =>
    e.note.toLowerCase().includes(search.toLowerCase()) ||
    e.rawText.toLowerCase().includes(search.toLowerCase())
  );

  const colorClass = CATEGORY_COLORS[category.color] || 'bg-muted';

  return (
    <motion.div
      layout
      className="kawaii-card bg-card cursor-pointer overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center text-2xl shrink-0`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
          <p className={`text-lg font-bold ${isOver ? 'text-destructive' : 'text-foreground'}`}>
            ₹{spent.toLocaleString()}
          </p>
          {category.monthlyLimit > 0 && (
            <div className="mt-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-destructive' : 'gradient-primary'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOver ? `Over by ₹${Math.abs(remaining!).toLocaleString()}` : `₹${remaining!.toLocaleString()} left`}
                {' '}/ ₹{category.monthlyLimit.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 border-t border-border pt-3"
            onClick={e => e.stopPropagation()}
          >
            {expenses.length > 3 && (
              <div className="mb-3">
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="text-sm bg-background border-border"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No transactions yet</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filtered.map(exp => (
                  <div key={exp.id} className="flex items-center justify-between text-sm bg-background rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{exp.note || exp.rawText}</p>
                      <p className="text-xs text-muted-foreground">{new Date(exp.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">₹{exp.amount}</span>
                      <select
                        value={exp.category}
                        onChange={e => onChangeCategory(exp.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="text-xs bg-muted rounded px-1 py-0.5 border-0 text-foreground"
                      >
                        {allCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {category.monthlyLimit > 0 && expenses.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Avg ₹{Math.round(spent / expenses.length)}/transaction</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryCard;
