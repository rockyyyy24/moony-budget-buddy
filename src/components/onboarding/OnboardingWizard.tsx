import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, DEFAULT_CATEGORIES, CURRENCIES } from '@/types/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, ChevronRight, ChevronLeft, Sparkles, Trash2, AlertTriangle } from 'lucide-react';
import moonyImg from '@/assets/moony.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_EMOJI = ['❄️','💕','🌸','🌷','🌼','☀️','🏖️','🌻','🍂','🎃','🦃','🎄'];

interface OnboardingWizardProps {
  onComplete: (
    categories: Category[],
    monthlyBudget: number,
    dailyLimit: number,
    yearlyBudget: number,
    currency: string,
    mode: 'budgeting' | 'analysis',
    fyStartMonth: number,
    fyStartYear: number,
    specialOverrides: Record<string, number>,
    specialLabels: Record<string, string>,
  ) => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'budgeting' | 'analysis' | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [selectedCats, setSelectedCats] = useState<string[]>(['food', 'travel', 'rent', 'bills', 'groceries','added manually']);
  const [customCatName, setCustomCatName] = useState('');
  const [customCats, setCustomCats] = useState<Omit<Category, 'monthlyLimit'>[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [yearlyBudget, setYearlyBudget] = useState('');
  const [fyStartMonth, setFyStartMonth] = useState(new Date().getMonth());
  const [fyStartYear, setFyStartYear] = useState(new Date().getFullYear());
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});
  // Multiple events per month: { 'YYYY-MM': [{id,label,amount}, ...] }
  type SpecialEvent = { id: string; label: string; amount: number };
  const [specialEvents, setSpecialEvents] = useState<Record<string, SpecialEvent[]>>({});
  const [editKey, setEditKey] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || '₹';

  const allCats = [
    ...DEFAULT_CATEGORIES.filter(c => selectedCats.includes(c.id)),
    ...customCats,
  ];

  const toggleCat = (id: string) => {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const addCustomCategory = () => {
    if (!customCatName.trim()) return;
    const id = customCatName.toLowerCase().replace(/\s+/g, '-');
    if (allCats.find(c => c.id === id)) return;
    const colors = ['peach', 'sky', 'lavender', 'bubblegum', 'mint', 'sunshine'];
    setCustomCats(prev => [...prev, {
      id, name: customCatName.trim(), color: colors[prev.length % colors.length], icon: '📌', type: 'lifestyle' as const,
    }]);
    setCustomCatName('');
  };

  const removeCustomCat = (id: string) => {
    setCustomCats(prev => prev.filter(c => c.id !== id));
  };

  const analyzeMissing = () => {
    const has = new Set([...selectedCats, ...customCats.map(c => c.id)]);
    const missing: string[] = [];
    if (!has.has('rent')) missing.push('Rent 🏠');
    if (!has.has('bills')) missing.push('Bills 📄');
    if (!has.has('savings')) missing.push('Savings 💰');
    if (!has.has('health')) missing.push('Health 💊');
    return missing;
  };

  // Derive overrides (sum per month) + labels (joined) from events
  const specialOverrides: Record<string, number> = {};
  const specialLabels: Record<string, string> = {};
  Object.entries(specialEvents).forEach(([k, evs]) => {
    if (!evs || evs.length === 0) return;
    const total = evs.reduce((s, e) => s + (e.amount || 0), 0);
    if (total > 0) {
      specialOverrides[k] = total;
      const labels = evs.filter(e => e.label.trim()).map(e => e.label.trim());
      if (labels.length) specialLabels[k] = labels.join(' + ');
    }
  });

  const handleComplete = () => {
    const yearly = parseFloat(yearlyBudget) || 0;
    // Default monthly = yearly / 12 if user didn't override
    const budget = parseFloat(monthlyBudget) || (yearly > 0 ? Math.round(yearly / 12) : 0);
    const daily = parseFloat(dailyLimit) || 0;
    const finalCategories: Category[] = allCats.map(c => ({
      ...c,
      monthlyLimit: mode === 'analysis' ? 0 : (parseFloat(categoryLimits[c.id] || '0') || 0),
    }));
    onComplete(finalCategories, budget, daily, yearly, currency, mode || 'budgeting', fyStartMonth, fyStartYear, specialOverrides, specialLabels);
  };

  const missing = analyzeMissing();
  const isAnalysis = mode === 'analysis';
  // budgeting: mode, currency, YEARLY, SPECIALS, categories, monthly, category-limits
  // analysis : mode, currency, categories
  const totalSteps = isAnalysis ? 3 : 7;
  const lastStep = totalSteps - 1;

  const canProceed =
    step === 0 ? mode !== null
    : step === 1 ? true
    : step === 2 ? (isAnalysis ? allCats.length > 0 : true) // yearly always passable
    : step === 3 ? (isAnalysis ? true : true) // specials always skippable
    : step === 4 ? (isAnalysis ? true : allCats.length > 0)
    : true;

  const moonyMessages = isAnalysis
    ? [
        "Hey! 🦆 I'm Mooney. First — what do you want to do?",
        "Cool! 💱 Pick your currency!",
        "Now pick what you usually spend on — tap to select!",
      ]
    : [
        "Hey! 🦆 I'm Mooney. First — what do you want to do?",
        "Cool! 💱 Pick your currency!",
        "📅 Let's start big — what's your YEARLY budget & financial year?",
        "🎂 Got any special months coming up? Tap to add — or skip & ask me later!",
        "Nice! 🎉 Now pick what you spend on — tap to select!",
        "💰 Want a custom monthly cap? (I'll auto-split yearly otherwise)",
        "Almost done! 🌟 Set per-category limits or skip!",
      ];

  // Build the FY's 12 months for the specials step
  const specialMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(fyStartYear, fyStartMonth + i, 1);
    return {
      y: d.getFullYear(),
      m: d.getMonth(),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    };
  });

  // Yearly math for the specials step
  const yearlyNum = parseFloat(yearlyBudget) || 0;
  // specialOverrides above are the EXTRA amounts (per-month event totals)
  // that get ADDED on top of the auto-monthly budget. Recompute the
  // per-month picture so the user sees how the rest of the year adjusts.
  const totalExtras = Object.values(specialOverrides).reduce((s, v) => s + v, 0);
  const overriddenCount = Object.keys(specialOverrides).length;
  const baseAuto = yearlyNum > 0 ? Math.round(yearlyNum / 12) : 0;
  const otherMonthsCount = Math.max(0, 12 - overriddenCount);
  const autoPerOtherMonth = yearlyNum > 0 && otherMonthsCount > 0
    ? Math.floor(baseAuto - totalExtras / otherMonthsCount)
    : baseAuto;
  const overYearly = yearlyNum > 0 && totalExtras > yearlyNum;
  const autoNegative = yearlyNum > 0 && otherMonthsCount > 0 && autoPerOtherMonth < 0;

  const openSpecialEdit = (key: string) => {
    setEditKey(key);
    setNewLabel('');
    setNewAmount('');
  };
  const addEvent = () => {
    if (!editKey) return;
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) return;
    const ev: SpecialEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: newLabel.trim(),
      amount: amt,
    };
    setSpecialEvents(prev => ({ ...prev, [editKey]: [...(prev[editKey] || []), ev] }));
    setNewLabel('');
    setNewAmount('');
  };
  const removeEvent = (key: string, id: string) => {
    setSpecialEvents(prev => {
      const list = (prev[key] || []).filter(e => e.id !== id);
      const next = { ...prev };
      if (list.length === 0) delete next[key];
      else next[key] = list;
      return next;
    });
  };

  const specialsStep = (
    <motion.div key="specials" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Add Special Spendings 🎂🎉</h2>
        <p className="text-muted-foreground text-sm">Birthdays, trips, anniversaries — tap a month to plan it</p>
      </div>
      <div className="kawaii-card bg-secondary/30 border-secondary">
        <p className="text-xs text-foreground">
          💡 You can either add it <span className="font-semibold">manually</span> here, or just <span className="font-semibold">ask Mooney</span> later
          (e.g. <span className="italic">"hey Mooney, trip to Goa in Feb, budget 30000"</span>) and I'll add it for you! 🦆✨
        </p>
      </div>

      {/* Yearly math summary */}
      {yearlyNum > 0 && (
        <div className={`kawaii-card ${overYearly || autoNegative ? 'bg-destructive/15 border-destructive' : 'bg-card'}`}>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div>
              <p className="text-muted-foreground">Yearly</p>
              <p className="font-display text-foreground">{currencySymbol}{yearlyNum.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Extra for specials</p>
              <p className={`font-display ${overYearly ? 'text-destructive' : 'text-foreground'}`}>+{currencySymbol}{totalExtras.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Auto / other month</p>
              <p className={`font-display ${autoNegative ? 'text-destructive' : 'text-success'}`}>
                {otherMonthsCount > 0 ? `${currencySymbol}${autoPerOtherMonth.toLocaleString()}` : '—'}
              </p>
            </div>
          </div>
          {(overYearly || autoNegative) && (
            <div className="mt-2 flex items-start gap-2 text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                🚨 <span className="font-semibold">Exceeding yearly budget!</span> Your plans
                {overYearly ? ` add ${currencySymbol}${totalExtras.toLocaleString()} of extras, which is more than your yearly ${currencySymbol}${yearlyNum.toLocaleString()}.` : ` leave nothing for the other ${otherMonthsCount} months.`}
                {' '}Trim a plan or raise your yearly budget.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
        {specialMonths.map(({ y, m, key }) => {
          const evs = specialEvents[key] || [];
          const has = evs.length > 0;
          const extra = specialOverrides[key] || 0;
          const monthBudget = has ? Math.round(baseAuto + extra) : 0;
          const autoShown = !has && yearlyNum > 0;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openSpecialEdit(key)}
              className={`kawaii-card text-center text-xs py-3 ${has ? 'border-primary ring-2 ring-primary/30 bg-muted' : 'bg-card'}`}
            >
              <div className="text-xl mb-0.5">{MONTH_EMOJI[m]}</div>
              <div className="font-display text-foreground">{MONTH_NAMES[m]} {String(y).slice(-2)}</div>
              {has ? (
                <>
                  <div className="text-[10px] text-primary font-semibold mt-0.5">{currencySymbol}{monthBudget.toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground truncate">+{currencySymbol}{extra.toLocaleString()} · {evs.length} event{evs.length > 1 ? 's' : ''}{specialLabels[key] ? ` · ${specialLabels[key]}` : ''}</div>
                </>
              ) : autoShown ? (
                <>
                  <div className="text-[10px] text-success font-semibold mt-0.5">{currencySymbol}{Math.max(0, autoPerOtherMonth).toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground">auto · tap to plan</div>
                </>
              ) : (
                <div className="text-[10px] text-muted-foreground mt-0.5">tap to add</div>
              )}
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-center text-muted-foreground">It's totally OK to skip — you can do this anytime later 🌟</p>

      <Dialog open={!!editKey} onOpenChange={o => !o && setEditKey(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editKey && (() => {
                const [y, mm] = editKey.split('-').map(Number);
                return `${MONTH_EMOJI[mm - 1]} ${MONTH_NAMES[mm - 1]} ${y}`;
              })()}
            </DialogTitle>
          </DialogHeader>
          {editKey && (() => {
            const evs = specialEvents[editKey] || [];
            const monthTotal = evs.reduce((s, e) => s + e.amount, 0);
            return (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Add as many events as you want — these amounts get ADDED on top of your auto-monthly budget, and Mooney shrinks the other months to keep your yearly total the same. ✨
                </p>

                {evs.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {evs.map(ev => (
                      <div key={ev.id} className="flex items-center gap-2 kawaii-card bg-background py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{ev.label || 'Untitled'}</p>
                        </div>
                        <p className="text-sm font-semibold text-primary">{currencySymbol}{ev.amount.toLocaleString()}</p>
                        <button onClick={() => removeEvent(editKey, ev.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between px-1 pt-1 text-xs">
                      <span className="text-muted-foreground">Month total</span>
                      <span className="font-display text-foreground">{currencySymbol}{monthTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="kawaii-card bg-secondary/20 border-secondary space-y-2">
                  <p className="text-[11px] font-semibold text-foreground">➕ Add an event</p>
                  <Input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    placeholder="e.g. Goa trip, Mom's birthday"
                    className="bg-background border-border text-sm" />
                  <div className="flex gap-2">
                    <Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addEvent()}
                      placeholder={`Amount (${currencySymbol})`}
                      className="bg-background border-border" />
                    <Button onClick={addEvent} className="gradient-primary text-primary-foreground border-0 shrink-0">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </div>

                <Button variant="outline" onClick={() => setEditKey(null)} className="w-full">Done ✨</Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  const yearlyStep = (
    <motion.div key="yearly" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Your Yearly Overview 📅</h2>
        <p className="text-muted-foreground">Mooney will plan your whole year from here</p>
      </div>
      <div className="kawaii-card bg-card space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Yearly Budget ({currencySymbol})</label>
          <Input type="number" placeholder="e.g. 360000" value={yearlyBudget}
            onChange={e => setYearlyBudget(e.target.value)} className="text-lg bg-card border-border" autoFocus />
          {yearlyBudget && (
            <p className="text-xs text-muted-foreground mt-1">
              Auto monthly: {currencySymbol}{Math.round(parseFloat(yearlyBudget) / 12).toLocaleString()}/month — you can override later
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">FY starts (month)</label>
            <Select value={String(fyStartMonth)} onValueChange={v => setFyStartMonth(parseInt(v))}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">FY starts (year)</label>
            <Input type="number" value={fyStartYear}
              onChange={e => setFyStartYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="bg-background border-border" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          e.g. <span className="text-foreground font-semibold">Mar {String(fyStartYear).slice(-2)}</span> → Feb {String(fyStartYear + 1).slice(-2)}. You can edit any individual month later (or just tell Mooney!).
        </p>
      </div>
    </motion.div>
  );

  const allSteps = [
    // Step 0: Mode select
    <motion.div key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">What's your vibe? ✨</h2>
        <p className="text-muted-foreground">Pick how you want to use Mooney</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <button onClick={() => setMode('budgeting')}
          className={`kawaii-card text-left transition-all ${mode === 'budgeting' ? 'border-primary ring-2 ring-primary/30 bg-muted' : 'bg-card'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <p className="font-semibold text-foreground">Budgeting</p>
              <p className="text-xs text-muted-foreground">Set budgets &amp; track limits to save</p>
            </div>
          </div>
        </button>
        <button onClick={() => setMode('analysis')}
          className={`kawaii-card text-left transition-all ${mode === 'analysis' ? 'border-primary ring-2 ring-primary/30 bg-muted' : 'bg-card'}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📊</span>
            <div>
              <p className="font-semibold text-foreground">Spending Analysis</p>
              <p className="text-xs text-muted-foreground">Just log &amp; see where your money goes</p>
            </div>
          </div>
        </button>
      </div>
    </motion.div>,

    // Step 0: Currency
    <motion.div key="currency" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Choose Your Currency 💱</h2>
        <p className="text-muted-foreground">What currency do you spend in?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {CURRENCIES.map(c => (
          <button key={c.code} onClick={() => setCurrency(c.code)}
            className={`kawaii-card text-center transition-all ${currency === c.code ? 'border-primary ring-2 ring-primary/30 bg-muted' : 'bg-card'}`}>
            <span className="text-2xl block mb-1">{c.symbol}</span>
            <span className="text-sm font-semibold text-foreground">{c.code}</span>
            <span className="text-xs block text-muted-foreground">{c.name}</span>
          </button>
        ))}
      </div>
    </motion.div>,

    // Step 1: Categories
    <motion.div key="categories" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Pick Your Categories! 🎨</h2>
        <p className="text-muted-foreground">What do you spend money on?</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {DEFAULT_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => toggleCat(cat.id)}
            className={`kawaii-card text-center transition-all ${selectedCats.includes(cat.id) ? 'border-primary ring-2 ring-primary/30 bg-muted' : 'bg-card'}`}>
            <span className="text-2xl block mb-1">{cat.icon}</span>
            <span className="text-sm font-semibold text-foreground">{cat.name}</span>
            <span className="text-xs block text-muted-foreground">{cat.type}</span>
          </button>
        ))}
      </div>
      {customCats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customCats.map(c => (
            <span key={c.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm">
              {c.icon} {c.name}
              <button onClick={() => removeCustomCat(c.id)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input placeholder="Add custom category..." value={customCatName} onChange={e => setCustomCatName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustomCategory()} className="bg-card border-border" />
        <Button onClick={addCustomCategory} size="icon" variant="outline"><Plus className="w-4 h-4" /></Button>
      </div>
      {missing.length > 0 && (
        <div className="kawaii-card bg-secondary/30 border-secondary">
          <p className="text-sm font-semibold text-foreground mb-1">💡 Mooney suggests adding:</p>
          <p className="text-sm text-muted-foreground">{missing.join(', ')}</p>
        </div>
      )}
    </motion.div>,

    // Step 2: Budget
    <motion.div key="budget" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Set Your Budget! 💰</h2>
        <p className="text-muted-foreground">How much can you spend this month?</p>
      </div>
      <div className="kawaii-card bg-card space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Monthly Budget ({currencySymbol}) *</label>
          <Input type="number" placeholder="e.g. 30000" value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="text-lg bg-card border-border" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Daily Limit ({currencySymbol}) <span className="text-muted-foreground font-normal">— optional</span></label>
          <Input type="number" placeholder={`Auto: ${currencySymbol}${monthlyBudget ? Math.round(parseFloat(monthlyBudget) / 30) : '...'}/day`}
            value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} className="bg-card border-border" />
          {!dailyLimit && monthlyBudget && <p className="text-xs text-muted-foreground mt-1">Default: {currencySymbol}{Math.round(parseFloat(monthlyBudget) / 30)}/day</p>}
        </div>
      </div>
    </motion.div>,

    // Step 4: Category Limits
    <motion.div key="limits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Category Limits ✂️</h2>
        <p className="text-muted-foreground">Set optional limits per category (or skip!)</p>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {allCats.map(cat => (
          <div key={cat.id} className="kawaii-card bg-card flex items-center gap-3">
            <span className="text-xl">{cat.icon}</span>
            <span className="font-semibold text-foreground flex-1 text-sm">{cat.name}</span>
            <Input type="number" placeholder="No limit" value={categoryLimits[cat.id] || ''}
              onChange={e => setCategoryLimits(prev => ({ ...prev, [cat.id]: e.target.value }))} className="w-28 text-sm bg-card border-border" />
          </div>
        ))}
      </div>
    </motion.div>,
  ];

  // Replace the monthly-budget step (index 3) with a leaner monthly + daily,
  // since yearly is now its own earlier step.
  allSteps[3] = (
    <motion.div key="budget" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display text-foreground mb-2">Monthly Cap (optional) 💰</h2>
        <p className="text-muted-foreground">Leave blank to auto-split your yearly budget</p>
      </div>
      <div className="kawaii-card bg-card space-y-4">
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Monthly Budget ({currencySymbol})</label>
          <Input type="number"
            placeholder={yearlyBudget ? `Auto: ${currencySymbol}${Math.round(parseFloat(yearlyBudget) / 12).toLocaleString()}` : 'e.g. 30000'}
            value={monthlyBudget} onChange={e => setMonthlyBudget(e.target.value)} className="text-lg bg-card border-border" />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Daily Limit ({currencySymbol}) <span className="text-muted-foreground font-normal">— optional</span></label>
          <Input type="number"
            placeholder={monthlyBudget ? `Auto: ${currencySymbol}${Math.round(parseFloat(monthlyBudget) / 30)}/day` : 'No limit'}
            value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} className="bg-card border-border" />
        </div>
      </div>
    </motion.div>
  );

  // Reorder for budgeting: mode, currency, YEARLY, SPECIALS, categories, monthly, limits
  const visibleSteps = isAnalysis
    ? [allSteps[0], allSteps[1], allSteps[2]]
    : [allSteps[0], allSteps[1], yearlyStep, specialsStep, allSteps[2], allSteps[3], allSteps[4]];

  return (
    <div className="min-h-screen bg-background sparkle-bg flex items-center justify-center p-4">
      <div className="retro-window w-full max-w-lg">
        <div className="retro-window-header">
          <div className="retro-dot bg-destructive" />
          <div className="retro-dot bg-warning" />
          <div className="retro-dot bg-success" />
          <span className="ml-2 text-sm font-semibold text-foreground font-display">Mooney ✨ Setup</span>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <img src={moonyImg} alt="Mooney" className="w-16 h-16 rounded-full border-2 border-secondary object-cover" />
            <div className="kawaii-card bg-secondary/30 border-secondary flex-1 py-2 px-3">
              <p className="text-sm text-foreground">{moonyMessages[step]}</p>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all ${i <= step ? 'gradient-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <AnimatePresence mode="wait">{visibleSteps[step]}</AnimatePresence>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            {step < lastStep ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="gap-1 gradient-primary text-primary-foreground border-0">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-1 gradient-primary text-primary-foreground border-0">
                <Sparkles className="w-4 h-4" /> Let's Go!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
