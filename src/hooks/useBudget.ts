import { useState, useCallback, useEffect } from 'react';
import { AppState, Category, Expense, BudgetConfig, Reward, StickerPlacement } from '@/types/budget';
import {
  loadState, saveState, addExpense as addExp, updateCategories as updateCats,
  updateBudget as updateBudg, completeOnboarding as completeOnb,
  addReward as addRew, toggleFisheAlarm as toggleFishe,
  deleteExpense as delExp, updateExpenseCategory as updateExpCat,
  resetMonth as resetMo, updateStickerPlacements as updateStickers,
} from '@/utils/storage';

export const useBudget = () => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => { saveState(state); }, [state]);

  const addExpense = useCallback((expense: Expense) => {
    setState(prev => addExp(prev, expense));
  }, []);

  const updateCategories = useCallback((categories: Category[]) => {
    setState(prev => updateCats(prev, categories));
  }, []);

  const updateBudgetConfig = useCallback((config: BudgetConfig) => {
    setState(prev => updateBudg(prev, config));
  }, []);

  const finishOnboarding = useCallback(() => {
    setState(prev => completeOnb(prev));
  }, []);

  const earnReward = useCallback((reward: Reward) => {
    setState(prev => addRew(prev, reward));
  }, []);

  const toggleAlarm = useCallback(() => {
    setState(prev => toggleFishe(prev));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setState(prev => delExp(prev, id));
  }, []);

  const changeExpenseCategory = useCallback((expenseId: string, newCatId: string) => {
    setState(prev => updateExpCat(prev, expenseId, newCatId));
  }, []);

  const resetCurrentMonth = useCallback(() => {
    setState(prev => resetMo(prev));
  }, []);

  const setStickerPlacements = useCallback((placements: StickerPlacement[]) => {
    setState(prev => updateStickers(prev, placements));
  }, []);

  const setFullState = useCallback((newState: AppState) => {
    setState(newState);
    saveState(newState);
  }, []);

  // Computed values
  const now = new Date();
  const currentMonthExpenses = state.expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const todayStr = now.toISOString().split('T')[0];
  const todayExpenses = currentMonthExpenses.filter(e => e.date.startsWith(todayStr));
  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const effectiveDailyLimit = state.budgetConfig.dailyLimit > 0
    ? state.budgetConfig.dailyLimit
    : state.budgetConfig.monthlyBudget / daysInMonth;

  const getCategorySpent = (catId: string) =>
    currentMonthExpenses.filter(e => e.category === catId).reduce((s, e) => s + e.amount, 0);

  const getExpensesForDay = (dateStr: string) =>
    state.expenses.filter(e => e.date.startsWith(dateStr));

  const getDaySpent = (dateStr: string) =>
    getExpensesForDay(dateStr).reduce((s, e) => s + e.amount, 0);

  const isOverMonthlyBudget = totalSpent > state.budgetConfig.monthlyBudget;
  const isOverDailyLimit = todaySpent > effectiveDailyLimit;

  const overBudgetCategories = state.categories.filter(c =>
    c.monthlyLimit > 0 && getCategorySpent(c.id) > c.monthlyLimit
  );

  return {
    state,
    addExpense,
    updateCategories,
    updateBudgetConfig,
    finishOnboarding,
    earnReward,
    toggleAlarm,
    removeExpense,
    changeExpenseCategory,
    resetCurrentMonth,
    setStickerPlacements,
    setFullState,
    currentMonthExpenses,
    totalSpent,
    todaySpent,
    effectiveDailyLimit,
    getCategorySpent,
    getExpensesForDay,
    getDaySpent,
    isOverMonthlyBudget,
    isOverDailyLimit,
    overBudgetCategories,
    daysInMonth,
  };
};
