import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Expense } from '@/types/budget';
import { CalendarRange, Sparkles } from 'lucide-react';

interface Props {
  expenses: Expense[];
  defaultMonthlyBudget: number;
  overrides: Record<string, number>;
  fyStartMonth: number;
  fyStartYear: number;
  currencySymbol: string;
  onUpdateOverrides: (next: Record<string, number>) => void;
  onUpdateFY: (startMonth: number, startYear: number) => void;
  onUpdateDefaultMonthly: (amount: number) => void;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_EMOJI = ['❄️','💕','🌸','🌷','🌼','☀️','🏖️','🌻','🍂','🎃','🦃','🎄'];

const keyFor = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;

const YearlyOverview = ({
  expenses, defaultMonthlyBudget, overrides, fyStartMonth, fyStartYear,
  currencySymbol, onUpdateOverrides, onUpdateFY, onUpdateDefaultMonthly,
}: Props) => {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [fyOpen, setFyOpen] = useState(false);
  const [tmpStartMonth, setTmpStartMonth] = useState(fyStartMonth);
  const [tmpStartYear, setTmpStartYear] = useState(fyStartYear);
  const [defaultInput, setDefaultInput] = useState(String(defaultMonthlyBudget || ''));

  // Build 12 FY months
  const fyMonths = useMemo(() => {
    const arr: { y: number; m: number; key: string }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(fyStartYear, fyStartMonth + i, 1);
      arr.push({ y: d.getFullYear(), m: d.getMonth(), key: keyFor(d.getFullYear(), d.getMonth()) });
    }
    return arr;
  }, [fyStartMonth, fyStartYear]);

  const spentByMonth = useMemo(() => {
    const acc: Record<string, number> = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const k = keyFor(d.getFullYear(), d.getMonth());
      acc[k] = (acc[k] || 0) + e.amount;
    });
    return acc;
  }, [expenses]);

  const budgetFor = (k: string) =>
    overrides[k] != null ? overrides[k] : (defaultMonthlyBudget || 0);

  const totalYearBudget = fyMonths.reduce((s, m) => s + budgetFor(m.key), 0);
  const totalYearSpent = fyMonths.reduce((s, m) => s + (spentByMonth[m.key] || 0), 0);

  const openEdit = (k: string) => {
    setEditKey(k);
    setEditValue(overrides[k] != null ? String(overrides[k]) : String(defaultMonthlyBudget || ''));
  };

  const saveEdit = () => {
    if (!editKey) return;
    const next = { ...overrides };
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) delete next[editKey];
    else next[editKey] = val;
    onUpdateOverrides(next);
    setEditKey(null);
  };

  const clearOverride = () => {
    if (!editKey) return;
    const next = { ...overrides };
    delete next[editKey];
    onUpdateOverrides(next);
    setEditKey(null);
  };

  const applyToAll = () => {
    const val = parseFloat(defaultInput);
    if (isNaN(val) || val < 0) return;
    onUpdateDefaultMonthly(val);
    // Clear all overrides so every month uses the new default
    onUpdateOverrides({});
  };

  const fyLabel = `${MONTH_NAMES[fyStartMonth]} ${String(fyStartYear).slice(-2)} → ${MONTH_NAMES[fyMonths[11].m]} ${String(fyMonths[11].y).slice(-2)}`;

  const editingLabel = editKey
    ? (() => {
        const [y, m] = editKey.split('-').map(Number);
        return `${MONTH_NAMES[m - 1]} ${y}`;
      })()
    : '';

  return (
    <div className="space-y-4">
      <div className="retro-window">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">📅 Yearly Overview</span>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Financial Year</p>
              <p className="text-base font-display text-foreground">{fyLabel}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setFyOpen(true)}>
              <CalendarRange className="w-3.5 h-3.5 mr-1" /> Change FY
            </Button>
          </div>

          <div className="kawaii-card bg-secondary/30 border-secondary">
            <p className="text-xs text-muted-foreground mb-2">Default monthly budget — applies to every month unless you override</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={defaultInput}
                onChange={e => setDefaultInput(e.target.value)}
                placeholder={`e.g. 30000`}
                className="bg-background border-border"
              />
              <Button size="sm" onClick={applyToAll} className="gradient-primary text-primary-foreground border-0 shrink-0">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Apply to all months
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fyMonths.map(({ y, m, key }, i) => {
              const spent = spentByMonth[key] || 0;
              const bud = budgetFor(key);
              const pct = bud > 0 ? Math.min(100, (spent / bud) * 100) : 0;
              const over = bud > 0 && spent > bud;
              const hasOverride = overrides[key] != null;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openEdit(key)}
                  className={`kawaii-card text-left bg-card relative ${over ? 'ring-2 ring-destructive/40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-foreground text-sm">
                      {MONTH_EMOJI[m]} {MONTH_NAMES[m]} {String(y).slice(-2)}
                    </span>
                    {hasOverride && (
                      <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                        custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Budget: <span className="font-semibold text-foreground">{currencySymbol}{bud.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Spent: <span className={`font-semibold ${over ? 'text-destructive' : 'text-foreground'}`}>{currencySymbol}{spent.toLocaleString()}</span>
                  </p>
                  <div className="h-1.5 w-full bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-destructive' : 'bg-success'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="kawaii-card bg-card flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Total yearly budget (auto)</p>
              <p className="text-xl font-display text-foreground">{currencySymbol}{totalYearBudget.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Spent so far</p>
              <p className={`text-xl font-display ${totalYearSpent > totalYearBudget && totalYearBudget > 0 ? 'text-destructive' : 'text-success'}`}>
                {currencySymbol}{totalYearSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit month dialog */}
      <Dialog open={!!editKey} onOpenChange={o => !o && setEditKey(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              ✏️ Budget for {editingLabel}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Planning something special this month? Override the default budget just for {editingLabel}.
            </p>
            <Input
              type="number"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder={`Default: ${currencySymbol}${(defaultMonthlyBudget || 0).toLocaleString()}`}
              className="bg-background border-border text-lg"
              autoFocus
            />
            <div className="flex gap-2">
              <Button onClick={saveEdit} className="flex-1 gradient-primary text-primary-foreground border-0">
                Save ✨
              </Button>
              {editKey && overrides[editKey] != null && (
                <Button variant="outline" onClick={clearOverride}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Financial year dialog */}
      <Dialog open={fyOpen} onOpenChange={setFyOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">📆 Your Financial Year</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              When does your financial year start? Mooney will calculate your yearly budget across those 12 months.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Start month</label>
                <Select value={String(tmpStartMonth)} onValueChange={v => setTmpStartMonth(parseInt(v))}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTH_NAMES.map((n, i) => (
                      <SelectItem key={i} value={String(i)}>{MONTH_EMOJI[i]} {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">Start year</label>
                <Input
                  type="number"
                  value={tmpStartYear}
                  onChange={e => setTmpStartYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: <span className="text-foreground font-semibold">March 2026</span> means your FY runs Mar 2026 → Feb 2027.
            </p>
            <Button
              onClick={() => { onUpdateFY(tmpStartMonth, tmpStartYear); setFyOpen(false); }}
              className="w-full gradient-primary text-primary-foreground border-0"
            >
              Save FY ✨
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YearlyOverview;