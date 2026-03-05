import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Calendar, Trophy, BarChart3, MessageCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAlarmSound, unlockAudio } from '@/utils/sounds';
import { Button } from '@/components/ui/button';
import { useBudget } from '@/hooks/useBudget';
import { Expense, Reward } from '@/types/budget';
import { parseExpenseText, getMoonyResponse, getFisheWarning } from '@/utils/expenseParser';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import CategoryCard from '@/components/dashboard/CategoryCard';
import ChatBox from '@/components/dashboard/ChatBox';
import MoonyZone from '@/components/dashboard/MoonyZone';
import FisheAlarm from '@/components/dashboard/FisheAlarm';
import BudgetSummary from '@/components/dashboard/BudgetSummary';
import CalendarView from '@/components/calendar/CalendarView';
import MonthlySummary from '@/components/monthly/MonthlySummary';
import RewardsPage from '@/components/rewards/RewardsPage';
import QuickAddDialog from '@/components/dashboard/QuickAddDialog';
import EditBudgetDialog from '@/components/dashboard/EditBudgetDialog';
import moonyImg from '@/assets/moony.png';

type View = 'dashboard' | 'calendar' | 'report' | 'rewards';

const Index = () => {
  const budget = useBudget();
  const {
    state, addExpense, updateCategories, updateBudgetConfig, finishOnboarding,
    earnReward, toggleAlarm, changeExpenseCategory, resetCurrentMonth, setStickerPlacements,
    currentMonthExpenses, totalSpent, todaySpent, effectiveDailyLimit,
    getCategorySpent, isOverMonthlyBudget, isOverDailyLimit, overBudgetCategories,
  } = budget;

  const [view, setView] = useState<View>('dashboard');
  const [chatOpen, setChatOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);

  // Check for first-expense reward
  useEffect(() => {
    if (state.expenses.length === 1) {
      earnReward({
        id: 'first-steps',
        name: 'First Steps',
        emoji: '👣',
        description: 'Logged your first expense!',
        earnedDate: new Date().toISOString(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
      });
    }
  }, [state.expenses.length, earnReward]);

  // Build Fishe warnings
  const fisheWarnings: string[] = [];
  if (isOverMonthlyBudget) fisheWarnings.push(getFisheWarning('monthly'));
  if (isOverDailyLimit) fisheWarnings.push(getFisheWarning('daily'));
  overBudgetCategories.forEach(c => fisheWarnings.push(getFisheWarning('category', c.name)));

  // Track previous over-budget state for edge detection
  const prevOverDaily = useRef(isOverDailyLimit);
  const prevOverMonthly = useRef(isOverMonthlyBudget);
  const prevTodaySpent = useRef(todaySpent);

  useEffect(() => {
    // Alarm: just crossed daily or monthly limit
    if ((isOverDailyLimit && !prevOverDaily.current) || (isOverMonthlyBudget && !prevOverMonthly.current)) {
      if (!state.fisheAlarmMuted) {
        playAlarmSound(4000);
      }
    }

    // Confetti: added an expense and still within daily limit
    if (todaySpent > prevTodaySpent.current && !isOverDailyLimit && todaySpent > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4a0e8', '#f5b8d0', '#fcd5a0', '#a8e6cf', '#87ceeb'],
      });
    }

    prevOverDaily.current = isOverDailyLimit;
    prevOverMonthly.current = isOverMonthlyBudget;
    prevTodaySpent.current = todaySpent;
  }, [todaySpent, isOverDailyLimit, isOverMonthlyBudget, state.fisheAlarmMuted]);

  const handleSendExpense = useCallback((text: string): string => {
    const parsed = parseExpenseText(text, state.categories);
    if (!parsed) return "🦆 Hmm, I couldn't find an amount there. Try something like \"Biryani 250\"!";

    const cat = state.categories.find(c => c.id === parsed.categoryId);
    const expense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      amount: parsed.amount,
      category: parsed.categoryId,
      note: parsed.note,
      rawText: text,
    };

    addExpense(expense);
    return getMoonyResponse(parsed.amount, cat?.name || parsed.categoryId, parsed.note);
  }, [state.categories, addExpense]);

  const handleQuickAdd = useCallback((amount: number, categoryId: string, note: string) => {
    const expense: Expense = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: new Date().toISOString(),
      amount,
      category: categoryId,
      note,
      rawText: `${note} ${amount}`,
    };
    addExpense(expense);
  }, [addExpense]);

  const handleEditSave = useCallback((cats: typeof state.categories, monthly: number, daily: number) => {
    updateCategories(cats);
    updateBudgetConfig({ monthlyBudget: monthly, dailyLimit: daily, month: new Date().getMonth(), year: new Date().getFullYear() });
  }, [updateCategories, updateBudgetConfig]);

  // Onboarding
  if (!state.isOnboarded) {
    return (
      <OnboardingWizard
        onComplete={(categories, monthlyBudget, dailyLimit) => {
          updateCategories(categories);
          updateBudgetConfig({
            monthlyBudget,
            dailyLimit,
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
          });
          finishOnboarding();
        }}
      />
    );
  }

  const navItems = [
    { id: 'dashboard' as View, icon: MessageCircle, label: 'Home' },
    { id: 'calendar' as View, icon: Calendar, label: 'Calendar' },
    { id: 'report' as View, icon: BarChart3, label: 'Report' },
    { id: 'rewards' as View, icon: Trophy, label: 'Stickers' },
  ];

  return (
    <div className="min-h-screen bg-background sparkle-bg" onClick={unlockAudio} onTouchStart={unlockAudio}>
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={moonyImg} alt="Mooney" className="w-10 h-10 rounded-full border-2 border-secondary object-cover" />
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
          </div>
        </div>

        {/* Nav */}
        <div className="container mx-auto px-4 pb-2">
          <div className="flex gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  view === item.id
                    ? 'gradient-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Budget + Categories */}
              <div className="lg:col-span-2 space-y-6">
                <BudgetSummary
                  monthlyBudget={state.budgetConfig.monthlyBudget}
                  totalSpent={totalSpent}
                  todaySpent={todaySpent}
                  dailyLimit={effectiveDailyLimit}
                  categories={state.categories}
                  getCategorySpent={getCategorySpent}
                />

                <div>
                  <h2 className="font-display text-foreground mb-3 text-lg">Categories</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.categories.map(cat => (
                      <CategoryCard
                        key={cat.id}
                        category={cat}
                        spent={getCategorySpent(cat.id)}
                        expenses={currentMonthExpenses.filter(e => e.category === cat.id)}
                        onChangeCategory={changeExpenseCategory}
                        allCategories={state.categories}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Chat (desktop) */}
              <div className="hidden lg:block">
                <div className="sticky top-32 h-[calc(100vh-10rem)]">
                  <ChatBox onSendExpense={handleSendExpense} onQuickAdd={() => setQuickAddOpen(true)} />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CalendarView
                expenses={state.expenses}
                categories={state.categories}
                dailyLimit={effectiveDailyLimit}
                month={new Date().getMonth()}
                year={new Date().getFullYear()}
              />
            </motion.div>
          )}

          {view === 'report' && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MonthlySummary
                categories={state.categories}
                expenses={currentMonthExpenses}
                monthlyBudget={state.budgetConfig.monthlyBudget}
                totalSpent={totalSpent}
                onReset={resetCurrentMonth}
              />
            </motion.div>
          )}

          {view === 'rewards' && (
            <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RewardsPage rewards={state.rewards} greenDayStreak={state.greenDayStreak} stickerPlacements={state.stickerPlacements} onUpdatePlacements={setStickerPlacements} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile: Moony floating button */}
      <div className="lg:hidden">
        <MoonyZone onClick={() => setChatOpen(true)} />
      </div>

      {/* Mobile chat drawer */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setChatOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl overflow-hidden"
            >
              <div className="h-full flex flex-col">
                <div className="flex justify-center py-2">
                  <div className="w-12 h-1.5 rounded-full bg-muted" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setChatOpen(false)}
                  className="absolute top-2 right-2 z-10"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-h-0">
                  <ChatBox onSendExpense={handleSendExpense} onQuickAdd={() => { setChatOpen(false); setQuickAddOpen(true); }} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <QuickAddDialog
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        categories={state.categories}
        onAdd={handleQuickAdd}
      />
      <EditBudgetDialog
        open={editBudgetOpen}
        onClose={() => setEditBudgetOpen(false)}
        categories={state.categories}
        monthlyBudget={state.budgetConfig.monthlyBudget}
        dailyLimit={state.budgetConfig.dailyLimit}
        onSave={handleEditSave}
      />
    </div>
  );
};

export default Index;
