import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, DEFAULT_CATEGORIES, CURRENCIES } from '@/types/budget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import moonyImg from '@/assets/moony.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

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
  ) => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'budgeting' | 'analysis' | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [selectedCats, setSelectedCats] = useState<string[]>(['food', 'travel', 'rent', 'bills', 'groceries']);
  const [customCatName, setCustomCatName] = useState('');
  const [customCats, setCustomCats] = useState<Omit<Category, 'monthlyLimit'>[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [yearlyBudget, setYearlyBudget] = useState('');
  const [fyStartMonth, setFyStartMonth] = useState(new Date().getMonth());
  const [fyStartYear, setFyStartYear] = useState(new Date().getFullYear());
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>({});

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

  const handleComplete = () => {
    const yearly = parseFloat(yearlyBudget) || 0;
    // Default monthly = yearly / 12 if user didn't override
    const budget = parseFloat(monthlyBudget) || (yearly > 0 ? Math.round(yearly / 12) : 0);
    const daily = parseFloat(dailyLimit) || 0;
    const finalCategories: Category[] = allCats.map(c => ({
      ...c,
      monthlyLimit: mode === 'analysis' ? 0 : (parseFloat(categoryLimits[c.id] || '0') || 0),
    }));
    onComplete(finalCategories, budget, daily, yearly, currency, mode || 'budgeting', fyStartMonth, fyStartYear);
  };

  const missing = analyzeMissing();
  const isAnalysis = mode === 'analysis';
  // budgeting: mode, currency, YEARLY, categories, monthly, category-limits
  // analysis : mode, currency, categories
  const totalSteps = isAnalysis ? 3 : 6;
  const lastStep = totalSteps - 1;

  const canProceed =
    step === 0 ? mode !== null
    : step === 1 ? true
    : step === 2 ? (isAnalysis ? allCats.length > 0 : true) // yearly step always passable
    : step === 3 ? (isAnalysis ? true : allCats.length > 0)
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
        "Nice! 🎉 Now pick what you spend on — tap to select!",
        "💰 Want a custom monthly cap? (I'll auto-split yearly otherwise)",
        "Almost done! 🌟 Set per-category limits or skip!",
      ];

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

  // Reorder for budgeting: mode, currency, YEARLY, categories, monthly, limits
  const visibleSteps = isAnalysis
    ? [allSteps[0], allSteps[1], allSteps[2]]
    : [allSteps[0], allSteps[1], yearlyStep, allSteps[2], allSteps[3], allSteps[4]];

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
