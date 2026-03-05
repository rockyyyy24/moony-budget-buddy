import { AppState, BudgetConfig, Category, Expense, Reward, StickerPlacement } from '@/types/budget';

const STORAGE_KEY = 'moony-budget-buddy';

const getDefaultState = (): AppState => ({
  isOnboarded: false,
  categories: [],
  expenses: [],
  budgetConfig: {
    monthlyBudget: 0,
    dailyLimit: 0,
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  },
  rewards: [],
  fisheAlarmMuted: false,
  greenDayStreak: 0,
  stickerPlacements: [],
});

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const addExpense = (state: AppState, expense: Expense): AppState => {
  const newState = { ...state, expenses: [...state.expenses, expense] };
  saveState(newState);
  return newState;
};

export const updateCategories = (state: AppState, categories: Category[]): AppState => {
  const newState = { ...state, categories };
  saveState(newState);
  return newState;
};

export const updateBudget = (state: AppState, config: BudgetConfig): AppState => {
  const newState = { ...state, budgetConfig: config };
  saveState(newState);
  return newState;
};

export const completeOnboarding = (state: AppState): AppState => {
  const newState = { ...state, isOnboarded: true };
  saveState(newState);
  return newState;
};

export const addReward = (state: AppState, reward: Reward): AppState => {
  const exists = state.rewards.some(r => r.id === reward.id && r.month === reward.month && r.year === reward.year);
  if (exists) return state;
  const newState = { ...state, rewards: [...state.rewards, reward] };
  saveState(newState);
  return newState;
};

export const toggleFisheAlarm = (state: AppState): AppState => {
  const newState = { ...state, fisheAlarmMuted: !state.fisheAlarmMuted };
  saveState(newState);
  return newState;
};

export const deleteExpense = (state: AppState, expenseId: string): AppState => {
  const newState = { ...state, expenses: state.expenses.filter(e => e.id !== expenseId) };
  saveState(newState);
  return newState;
};

export const updateExpenseCategory = (state: AppState, expenseId: string, newCategoryId: string): AppState => {
  const newState = {
    ...state,
    expenses: state.expenses.map(e => e.id === expenseId ? { ...e, category: newCategoryId } : e),
  };
  saveState(newState);
  return newState;
};

export const resetMonth = (state: AppState): AppState => {
  const now = new Date();
  const newState = {
    ...state,
    expenses: [],
    budgetConfig: { ...state.budgetConfig, month: now.getMonth(), year: now.getFullYear() },
  };
  saveState(newState);
  return newState;
};

export const updateStickerPlacements = (state: AppState, placements: StickerPlacement[]): AppState => {
  const newState = { ...state, stickerPlacements: placements };
  saveState(newState);
  return newState;
};

export const exportData = (state: AppState): string => {
  return JSON.stringify(state, null, 2);
};

export const exportCSV = (expenses: Expense[], categories: Category[]): string => {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const header = 'Date,Amount,Category,Note\n';
  const rows = expenses.map(e =>
    `${e.date},${e.amount},"${catMap[e.category] || e.category}","${e.note}"`
  ).join('\n');
  return header + rows;
};
