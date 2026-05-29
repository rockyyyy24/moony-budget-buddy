import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Calendar, Trophy, BarChart3, MessageCircle, X, LogOut, Image as ImageIcon, CalendarRange } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { playAlarmSound, unlockAudio } from '@/utils/sounds';
import { Button } from '@/components/ui/button';
import { useBudget } from '@/hooks/useBudget';
import { Expense, Reward, CURRENCIES } from '@/types/budget';
import { parseExpenseText, getMoonyResponse, getFisheWarning } from '@/utils/expenseParser';
import { resetUserData } from '@/utils/storage';
import { recomputeOverrides } from '@/utils/budgetMath';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import CategoryCard from '@/components/dashboard/CategoryCard';
import ChatBox from '@/components/dashboard/ChatBox';
import MoonyZone from '@/components/dashboard/MoonyZone';
import FisheAlarm from '@/components/dashboard/FisheAlarm';
import BudgetSummary from '@/components/dashboard/BudgetSummary';
import CalendarView from '@/components/calendar/CalendarView';
import MonthlySummary from '@/components/monthly/MonthlySummary';
import RewardsPage from '@/components/rewards/RewardsPage';
import BadgesWall from '@/components/rewards/BadgesWall';
import YearlyOverview from '@/components/yearly/YearlyOverview';
import QuickAddDialog from '@/components/dashboard/QuickAddDialog';
import EditBudgetDialog from '@/components/dashboard/EditBudgetDialog';
import WelcomeGuide from '@/components/dashboard/WelcomeGuide';
import SpendingAnalytics from '@/components/dashboard/SpendingAnalytics';
import LogoutDialog from '@/components/dashboard/LogoutDialog';
import EndOfMonthDialog from '@/components/dashboard/EndOfMonthDialog';
import moonyImg from '@/assets/moony.png';

type View = 'dashboard' | 'calendar' | 'year' | 'report' | 'rewards' | 'wall';

const Index = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading, signOut } = useAuth();
  const budget = useBudget();
  const {
    state, addExpense, updateCategories, updateBudgetConfig, finishOnboarding,
    earnReward, toggleAlarm, changeExpenseCategory, resetCurrentMonth, setStickerPlacements,
    currentMonthExpenses, totalSpent, yearSpent, todaySpent, effectiveDailyLimit,
    getCategorySpent, isOverMonthlyBudget, isOverDailyLimit, overBudgetCategories,
    setFullState, daysInMonth,
  } = budget;

  const [view, setView] = useState<View>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [eomOpen, setEomOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !session) navigate('/auth', { replace: true });
  }, [authLoading, session, navigate]);

  // Show welcome guide on first dashboard visit
  useEffect(() => {
    if (state.isOnboarded && !state.hasSeenGuide) {
      setShowGuide(true);
    }
  }, [state.isOnboarded, state.hasSeenGuide]);

  const dismissGuide = useCallback(() => {
    setShowGuide(false);
    setFullState({ ...state, hasSeenGuide: true });
  }, [state, setFullState]);

  // Check for first-expense reward
  useEffect(() => {
    if (state.expenses.length === 1) {
      earnReward({
        id: 'first-steps', name: 'First Steps', emoji: '👣', description: 'Logged your first expense!',
        earnedDate: new Date().toISOString(), month: new Date().getMonth(), year: new Date().getFullYear(),
      });
    }
  }, [state.expenses.length, earnReward]);

  // Award Green Goddess badge: full-month green streak
  useEffect(() => {
    if (state.greenDayStreak >= daysInMonth && daysInMonth > 0) {
      earnReward({
        id: 'green-goddess', name: 'Green Goddess', emoji: '🌿', description: 'Green streak for an entire month!',
        earnedDate: new Date().toISOString(), month: new Date().getMonth(), year: new Date().getFullYear(),
      });
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#a8e6cf', '#d4a0e8', '#fcd5a0'] });
    }
    if (currentMonthExpenses.length >= 30) {
      earnReward({
        id: 'mooney-vip', name: 'Mooney VIP', emoji: '👑', description: 'Tracked 30+ expenses in a month!',
        earnedDate: new Date().toISOString(), month: new Date().getMonth(), year: new Date().getFullYear(),
      });
    }
  }, [state.greenDayStreak, daysInMonth, currentMonthExpenses.length, earnReward]);

  // End-of-month prompt: ask once per month on day 1-3
  useEffect(() => {
    if (!state.isOnboarded) return;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (now.getDate() <= 3 && state.lastMonthPromptYM !== ym && state.expenses.length > 0) {
      setEomOpen(true);
    }
  }, [state.isOnboarded, state.lastMonthPromptYM, state.expenses.length]);

  const fisheWarnings: string[] = [];
  if (isOverMonthlyBudget) fisheWarnings.push(getFisheWarning('monthly'));
  if (isOverDailyLimit) fisheWarnings.push(getFisheWarning('daily'));
  overBudgetCategories.forEach(c => fisheWarnings.push(getFisheWarning('category', c.name)));

  const prevOverDaily = useRef(isOverDailyLimit);
  const prevOverMonthly = useRef(isOverMonthlyBudget);
  const prevTodaySpent = useRef(todaySpent);

  useEffect(() => {
    if ((isOverDailyLimit && !prevOverDaily.current) || (isOverMonthlyBudget && !prevOverMonthly.current)) {
      if (!state.fisheAlarmMuted) playAlarmSound(4000);
    }
    if (todaySpent > prevTodaySpent.current && !isOverDailyLimit && todaySpent > 0) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#d4a0e8', '#f5b8d0', '#fcd5a0', '#a8e6cf', '#87ceeb'] });
    }
    prevOverDaily.current = isOverDailyLimit;
    prevOverMonthly.current = isOverMonthlyBudget;
    prevTodaySpent.current = todaySpent;
  }, [todaySpent, isOverDailyLimit, isOverMonthlyBudget, state.fisheAlarmMuted]);

  const currencySymbol = (CURRENCIES.find(c => c.code === state.budgetConfig.currency) || CURRENCIES[0]).symbol;

  const handleSendExpense = useCallback((text: string): string => {
    const parsed = parseExpenseText(text, state.categories);
    if (!parsed) return "🦆 Hmm, I couldn't find an amount there. Try something like \"Biryani 250\"!";
    const cat = state.categories.find(c => c.id === parsed.categoryId);
    const expenseDate = new Date();
    expenseDate.setDate(expenseDate.getDate() + parsed.dateOffsetDays);
    const expense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: expenseDate.toISOString(), amount: parsed.amount, category: parsed.categoryId, note: parsed.note, rawText: text,
    };
    addExpense(expense);
    let dayLabel = '';
    if (parsed.dateOffsetDays === -1) dayLabel = ' (yesterday)';
    else if (parsed.dateOffsetDays === -2) dayLabel = ' (day before yesterday)';
    else if (parsed.dateOffsetDays < -2) dayLabel = ` (${Math.abs(parsed.dateOffsetDays)} days ago)`;
    return getMoonyResponse(parsed.amount, cat?.name || parsed.categoryId, parsed.note + dayLabel, currencySymbol);
  }, [state.categories, addExpense, currencySymbol]);

  const handleQuickAdd = useCallback((amount: number, categoryId: string, note: string) => {
    const expense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: new Date().toISOString(), amount, category: categoryId, note, rawText: `${note} ${amount}`,
    };
    addExpense(expense);
  }, [addExpense]);

  const handleEditSave = useCallback((cats: typeof state.categories, monthly: number, daily: number) => {
    updateCategories(cats);
    updateBudgetConfig({
      monthlyBudget: monthly,
      dailyLimit: daily,
      yearlyBudget: state.budgetConfig.yearlyBudget,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      currency: state.budgetConfig.currency,
    });
  }, [updateCategories, updateBudgetConfig, state.budgetConfig.currency, state.budgetConfig.yearlyBudget]);

  if (authLoading || !session) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  if (!state.isOnboarded) {
    return (
      <OnboardingWizard
        onComplete={(categories, monthlyBudget, dailyLimit, yearlyBudget, currency, mode, fyStartMonth, fyStartYear, specialOverrides, specialLabels) => {
          updateCategories(categories);
          updateBudgetConfig({ monthlyBudget, dailyLimit, yearlyBudget, month: new Date().getMonth(), year: new Date().getFullYear(), currency });
          // Wizard returns specialOverrides as ADDITIVE extras (the per-month
          // event totals). Store them as extras and compute final overrides.
          const nextExtras = { ...(state.monthlyBudgetExtras || {}), ...specialOverrides };
          const { overrides } = recomputeOverrides(yearlyBudget, fyStartMonth, fyStartYear, nextExtras);
          setFullState({
            ...state, mode, categories, isOnboarded: true,
            budgetConfig: { monthlyBudget, dailyLimit, yearlyBudget, month: new Date().getMonth(), year: new Date().getFullYear(), currency },
            financialYearStartMonth: fyStartMonth,
            financialYearStartYear: fyStartYear,
            monthlyBudgetExtras: nextExtras,
            monthlyBudgetOverrides: overrides,
            monthlyBudgetLabels: { ...(state.monthlyBudgetLabels || {}), ...specialLabels },
          });
          finishOnboarding();
        }}
      />
    );
  }

  const handleLogoutKeep = async () => {
    setLogoutOpen(false);
    await signOut();
  };

  const handleLogoutReset = async () => {
    setLogoutOpen(false);
    resetUserData();
    await signOut();
  };

  const handleSwitchMode = () => {
    const newMode = state.mode === 'budgeting' ? 'analysis' : 'budgeting';
    setFullState({ ...state, mode: newMode });
  };

  const dismissEom = (switchMode: boolean) => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const newMode = switchMode ? (state.mode === 'budgeting' ? 'analysis' : 'budgeting') : state.mode;
    setFullState({ ...state, mode: newMode, lastMonthPromptYM: ym });
    setEomOpen(false);
  };

  // Effective monthly budget = override for current month (if any) else configured monthly
  const nowEff = new Date();
  const currentYM = `${nowEff.getFullYear()}-${String(nowEff.getMonth() + 1).padStart(2, '0')}`;
  const overrideForThisMonth = state.monthlyBudgetOverrides?.[currentYM];
  const effectiveMonthlyBudget = overrideForThisMonth ?? state.budgetConfig.monthlyBudget;
  const currentMonthLabel = state.monthlyBudgetLabels?.[currentYM];

  const handleMooneyActions = (
    actions: Array<{ type: string; monthIso?: string; amount?: number; label?: string }>
  ) => {
    if (!actions || actions.length === 0) return;
    const nextExtras = { ...(state.monthlyBudgetExtras || {}) };
    const nextLabels = { ...(state.monthlyBudgetLabels || {}) };
    for (const a of actions) {
      if (!a.monthIso) continue;
      if (a.type === 'set_month_budget' && typeof a.amount === 'number' && a.amount >= 0) {
        // Mooney sends the EXTRA amount (the special spending). Store as extra.
        nextExtras[a.monthIso] = a.amount;
        if (a.label) nextLabels[a.monthIso] = a.label;
      } else if (a.type === 'reset_month_budget') {
        delete nextExtras[a.monthIso];
        delete nextLabels[a.monthIso];
      }
    }
    const fyM = state.financialYearStartMonth ?? 0;
    const fyY = state.financialYearStartYear ?? new Date().getFullYear();
    const { overrides } = recomputeOverrides(state.budgetConfig.yearlyBudget || 0, fyM, fyY, nextExtras);
    setFullState({
      ...state,
      monthlyBudgetExtras: nextExtras,
      monthlyBudgetOverrides: overrides,
      monthlyBudgetLabels: nextLabels,
    });
  };

  const setDayLabel = (dateStr: string, label: string) => {
    const next = { ...(state.dayLabels || {}) };
    if (label.trim()) next[dateStr] = label.trim();
    else delete next[dateStr];
    setFullState({ ...state, dayLabels: next });
  };

  const chatProps = {
    onSendExpense: handleSendExpense,
    currencySymbol,
    todaySpent,
    dailyLimit: effectiveDailyLimit,
    totalSpent,
    monthlyBudget: effectiveMonthlyBudget,
    categories: state.categories,
    getCategorySpent,
    fyStartMonth: state.financialYearStartMonth ?? 0,
    fyStartYear: state.financialYearStartYear ?? new Date().getFullYear(),
    monthlyBudgetOverrides: state.monthlyBudgetOverrides || {},
    monthlyBudgetLabels: state.monthlyBudgetLabels || {},
    onMooneyActions: handleMooneyActions,
  };

  const navItems = [
    { id: 'dashboard' as View, icon: MessageCircle, label: 'Home' },
    { id: 'calendar' as View, icon: Calendar, label: 'Calendar' },
    { id: 'year' as View, icon: CalendarRange, label: 'Year' },
    { id: 'report' as View, icon: BarChart3, label: 'Report' },
    { id: 'rewards' as View, icon: Trophy, label: 'Stickers' },
    { id: 'wall' as View, icon: ImageIcon, label: 'Wall' },
  ];

  return (
    <div className="min-h-screen bg-background sparkle-bg relative overflow-x-hidden" onClick={unlockAudio} onTouchStart={unlockAudio}>
      {/* Floating background sparkles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {['✨', '🦆', '💖', '⭐', '🌟', '💫', '🐟'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-2xl opacity-20 animate-drift"
            style={{
              left: `${10 + i * 13}%`,
              top: `${15 + (i * 17) % 70}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${12 + i * 2}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.img
              src={moonyImg}
              alt="Mooney"
              className="w-10 h-10 rounded-full border-2 border-secondary object-cover"
              animate={{ y: [0, -4, 0], rotate: [-3, 3, -3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.15, rotate: 360 }}
            />
            <div>
              <h1 className="text-lg font-display text-foreground leading-tight">Mooney</h1>
              <p className="text-xs text-muted-foreground">The Money Manager ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FisheAlarm warnings={fisheWarnings} muted={state.fisheAlarmMuted} onToggleMute={toggleAlarm} />
            <Button variant="ghost" size="icon" onClick={() => setEditBudgetOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLogoutOpen(true)} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="container mx-auto px-4 pb-2">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => (
              <motion.button
                key={item.id}
                onClick={() => setView(item.id)}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  view === item.id ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}>
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {state.mode !== 'analysis' && (
                  <BudgetSummary monthlyBudget={effectiveMonthlyBudget} totalSpent={totalSpent} todaySpent={todaySpent}
                    yearlyBudget={state.budgetConfig.yearlyBudget || 0} yearSpent={yearSpent}
                    dailyLimit={effectiveDailyLimit} categories={state.categories} getCategorySpent={getCategorySpent} currencySymbol={currencySymbol} />
                )}
                {currentMonthLabel && (
                  <p className="text-xs text-center text-muted-foreground -mt-2">
                    ✨ Custom plan this month: <span className="text-foreground font-semibold">{currentMonthLabel}</span>
                  </p>
                )}
                <SpendingAnalytics categories={state.categories} expenses={currentMonthExpenses} currencySymbol={currencySymbol} />
                <div>
                  <h2 className="font-display text-foreground mb-3 text-lg">Categories</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.categories.map(cat => (
                      <CategoryCard key={cat.id} category={cat} spent={getCategorySpent(cat.id)}
                        expenses={currentMonthExpenses.filter(e => e.category === cat.id)}
                        onChangeCategory={changeExpenseCategory} allCategories={state.categories}
                        currencySymbol={currencySymbol} showEncouragement={state.mode !== 'analysis'} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="sticky top-32 h-[calc(100vh-10rem)]">
                  <ChatBox {...chatProps} onQuickAdd={() => setQuickAddOpen(true)} />
                </div>
              </div>
            </motion.div>
          )}
          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <CalendarView expenses={state.expenses} categories={state.categories} dailyLimit={effectiveDailyLimit}
                month={new Date().getMonth()} year={new Date().getFullYear()}
                dayLabels={state.dayLabels || {}} onSetDayLabel={setDayLabel} />
            </motion.div>
          )}
          {view === 'year' && (
            <motion.div key="year" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <YearlyOverview
                expenses={state.expenses}
                defaultMonthlyBudget={state.budgetConfig.monthlyBudget}
                overrides={state.monthlyBudgetOverrides || {}}
                extras={state.monthlyBudgetExtras || {}}
                labels={state.monthlyBudgetLabels || {}}
                yearlyBudget={state.budgetConfig.yearlyBudget || 0}
                fyStartMonth={state.financialYearStartMonth ?? 0}
                fyStartYear={state.financialYearStartYear ?? new Date().getFullYear()}
                currencySymbol={currencySymbol}
                onUpdateExtras={(nextExtras, nextLabels) => {
                  const fyM = state.financialYearStartMonth ?? 0;
                  const fyY = state.financialYearStartYear ?? new Date().getFullYear();
                  const { overrides } = recomputeOverrides(state.budgetConfig.yearlyBudget || 0, fyM, fyY, nextExtras);
                  setFullState({
                    ...state,
                    monthlyBudgetExtras: nextExtras,
                    monthlyBudgetOverrides: overrides,
                    monthlyBudgetLabels: nextLabels,
                  });
                }}
                onUpdateFY={(m, y) => {
                  const { overrides } = recomputeOverrides(state.budgetConfig.yearlyBudget || 0, m, y, state.monthlyBudgetExtras || {});
                  setFullState({ ...state, financialYearStartMonth: m, financialYearStartYear: y, monthlyBudgetOverrides: overrides });
                }}
                onUpdateDefaultMonthly={(amount) => updateBudgetConfig({ ...state.budgetConfig, monthlyBudget: amount })}
              />
            </motion.div>
          )}
          {view === 'report' && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <MonthlySummary categories={state.categories} expenses={currentMonthExpenses}
                monthlyBudget={state.budgetConfig.monthlyBudget} totalSpent={totalSpent} onReset={resetCurrentMonth} />
            </motion.div>
          )}
          {view === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <RewardsPage rewards={state.rewards} greenDayStreak={state.greenDayStreak}
                stickerPlacements={state.stickerPlacements} onUpdatePlacements={setStickerPlacements} />
            </motion.div>
          )}
          {view === 'wall' && (
            <motion.div key="wall" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <BadgesWall rewards={state.rewards} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="lg:hidden">
        <MoonyZone onClick={() => setChatOpen(true)} />
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setChatOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="flex justify-center py-2"><div className="w-12 h-1.5 rounded-full bg-muted" /></div>
                <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)} className="absolute top-2 right-2 z-10">
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-h-0">
                  <ChatBox {...chatProps} onQuickAdd={() => { setChatOpen(false); setQuickAddOpen(true); }} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuide && <WelcomeGuide onDismiss={dismissGuide} />}
      </AnimatePresence>

      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} categories={state.categories} onAdd={handleQuickAdd} />
      <EditBudgetDialog open={editBudgetOpen} onClose={() => setEditBudgetOpen(false)} categories={state.categories}
        monthlyBudget={state.budgetConfig.monthlyBudget} dailyLimit={state.budgetConfig.dailyLimit} onSave={handleEditSave}
        mode={state.mode} onSwitchMode={handleSwitchMode} />
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} onKeep={handleLogoutKeep} onReset={handleLogoutReset} />
      <EndOfMonthDialog open={eomOpen} currentMode={state.mode} onContinue={() => dismissEom(false)} onSwitch={() => dismissEom(true)} />
      </div>
    </div>
  );
};

export default Index;
