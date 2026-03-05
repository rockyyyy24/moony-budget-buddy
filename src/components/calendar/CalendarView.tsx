import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Expense, Category } from '@/types/budget';

interface CalendarViewProps {
  expenses: Expense[];
  categories: Category[];
  dailyLimit: number;
  month: number;
  year: number;
}

const CalendarView = ({ expenses, categories, dailyLimit, month, year }: CalendarViewProps) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(month);
  const [viewYear, setViewYear] = useState(year);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const dayData = useMemo(() => {
    const data: Record<string, { spent: number; expenses: Expense[] }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayExpenses = expenses.filter(e => e.date.startsWith(dateStr));
      data[dateStr] = {
        spent: dayExpenses.reduce((s, e) => s + e.amount, 0),
        expenses: dayExpenses,
      };
    }
    return data;
  }, [expenses, viewMonth, viewYear, daysInMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDayData = selectedDay ? dayData[selectedDay] : null;
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">📅 Calendar</span>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-display text-foreground">{monthName}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = dayData[dateStr];
            const isOver = data && data.spent > dailyLimit && dailyLimit > 0;
            const hasSpending = data && data.spent > 0;
            const today = new Date();
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

            return (
              <motion.button
                key={day}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDay(dateStr)}
                className={`relative aspect-square rounded-xl text-xs flex flex-col items-center justify-center gap-0.5 transition-colors border ${
                  isToday ? 'border-primary' : 'border-transparent'
                } ${
                  isOver ? 'bg-destructive/20 text-destructive' :
                  hasSpending ? 'bg-success/20 text-success' :
                  'bg-muted/50 text-muted-foreground'
                } ${selectedDay === dateStr ? 'ring-2 ring-primary' : ''}`}
              >
                <span className="font-semibold">{day}</span>
                {hasSpending && (
                  <span className="text-[10px] font-bold">₹{data.spent > 999 ? `${Math.round(data.spent / 1000)}k` : data.spent}</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Day detail drawer */}
        {selectedDay && selectedDayData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 kawaii-card bg-background"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-foreground text-sm">
                {new Date(selectedDay).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h4>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)} className="h-6 w-6">
                <X className="w-3 h-3" />
              </Button>
            </div>

            <p className={`text-lg font-bold mb-2 ${selectedDayData.spent > dailyLimit && dailyLimit > 0 ? 'text-destructive' : 'text-foreground'}`}>
              ₹{selectedDayData.spent.toLocaleString()} spent
              {dailyLimit > 0 && <span className="text-xs font-normal text-muted-foreground"> / ₹{dailyLimit.toLocaleString()} limit</span>}
            </p>

            {selectedDayData.expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses this day 🎉</p>
            ) : (
              <div className="space-y-2">
                {selectedDayData.expenses.map(exp => {
                  const cat = catMap[exp.category];
                  return (
                    <div key={exp.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <span>{cat?.icon || '📌'} {exp.note || exp.rawText}</span>
                      <span className="font-bold text-foreground">₹{exp.amount}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedDayData.spent > dailyLimit && dailyLimit > 0 && (
              <p className="text-xs text-destructive mt-2">
                💡 Tip: Try to spread your spending more evenly across the month!
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
