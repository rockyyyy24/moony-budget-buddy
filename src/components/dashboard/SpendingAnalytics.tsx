import { Category, Expense } from '@/types/budget';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Props {
  categories: Category[];
  expenses: Expense[];
  currencySymbol: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#f5b8d0', '#a8e6cf', '#87ceeb', '#fcd5a0', '#d4a0e8'];

const SpendingAnalytics = ({ categories, expenses, currencySymbol }: Props) => {
  const byCategory = categories.map(c => ({
    name: c.name,
    value: expenses.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.value > 0);

  // Last 7 days
  const days: { day: string; spent: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const spent = expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    days.push({ day: d.toLocaleDateString(undefined, { weekday: 'short' }), spent });
  }

  if (expenses.length === 0) {
    return (
      <div className="retro-window">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">📊 Spending Analytics</span>
        </div>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Start logging expenses to see your spending charts! 📈
        </div>
      </div>
    );
  }

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div className="retro-dot bg-destructive" />
        <div className="retro-dot bg-warning" />
        <div className="retro-dot bg-success" />
        <span className="ml-2 text-sm font-semibold text-foreground font-display">📊 Spending Analytics</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-2 text-center">Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={days}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${currencySymbol}${v.toLocaleString()}`} />
              <Bar dataKey="spent" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground mb-2 text-center">By Category</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={70} label={(e: any) => e.name}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `${currencySymbol}${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalytics;