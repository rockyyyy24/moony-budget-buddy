export interface Category {
  id: string;
  name: string;
  color: string;
  monthlyLimit: number;
  icon: string;
  type: 'essential' | 'lifestyle';
}

export interface Expense {
  id: string;
  date: string; // ISO string
  amount: number;
  category: string; // category id
  note: string;
  rawText: string;
}

export interface BudgetConfig {
  monthlyBudget: number;
  dailyLimit: number;
  yearlyBudget: number;
  month: number;
  year: number;
  currency: string;
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

export interface Reward {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedDate: string;
  month: number;
  year: number;
}

export interface StickerPlacement {
  stickerId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotation: number; // degrees
  scale: number;
}

export interface AppState {
  isOnboarded: boolean;
  mode: 'budgeting' | 'analysis';
  categories: Category[];
  expenses: Expense[];
  budgetConfig: BudgetConfig;
  rewards: Reward[];
  fisheAlarmMuted: boolean;
  greenDayStreak: number;
  stickerPlacements: StickerPlacement[];
  hasSeenGuide: boolean;
  lastMonthPromptYM?: string; // "YYYY-MM" last time we asked the end-of-month switch
  financialYearStartMonth?: number; // 0-11, default 0 (Jan)
  financialYearStartYear?: number; // e.g. 2026 — anchor year for "March 26 → April 27"
  monthlyBudgetOverrides?: Record<string, number>; // key "YYYY-MM" → budget for that month
  monthlyBudgetLabels?: Record<string, string>; // key "YYYY-MM" → label like "Goa trip"
  dayLabels?: Record<string, string>; // key "YYYY-MM-DD" → free-text label for that day
}

export const DEFAULT_CATEGORIES: Omit<Category, 'monthlyLimit'>[] = [
  { id: 'food', name: 'Food', color: 'peach', icon: '🍔', type: 'essential' },
  { id: 'travel', name: 'Travel', color: 'sky', icon: '🚗', type: 'lifestyle' },
  { id: 'rent', name: 'Rent', color: 'lavender', icon: '🏠', type: 'essential' },
  { id: 'shopping', name: 'Shopping', color: 'bubblegum', icon: '🛍️', type: 'lifestyle' },
  { id: 'bills', name: 'Bills', color: 'mint', icon: '📄', type: 'essential' },
  { id: 'entertainment', name: 'Entertainment', color: 'sunshine', icon: '🎬', type: 'lifestyle' },
  { id: 'savings', name: 'Savings', color: 'success', icon: '💰', type: 'essential' },
  { id: 'subscriptions', name: 'Subscriptions', color: 'primary', icon: '📱', type: 'lifestyle' },
  { id: 'health', name: 'Health', color: 'secondary', icon: '💊', type: 'essential' },
  { id: 'groceries', name: 'Groceries', color: 'mint', icon: '🛒', type: 'essential' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  peach: 'bg-peach',
  sky: 'bg-sky',
  lavender: 'bg-lavender',
  bubblegum: 'bg-bubblegum',
  mint: 'bg-mint',
  sunshine: 'bg-sunshine',
  success: 'bg-success',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  accent: 'bg-accent',
};

export const REWARD_BADGES: Omit<Reward, 'earnedDate' | 'month' | 'year'>[] = [
  { id: 'budget-boss', name: 'Budget Boss', emoji: '🏆', description: 'Stayed within budget all month!' },
  { id: 'savings-star', name: 'Savings Star', emoji: '⭐', description: 'Saved more than planned!' },
  { id: 'streak-master', name: 'Streak Master', emoji: '🔥', description: '7-day green streak!' },
  { id: 'penny-pincher', name: 'Penny Pincher', emoji: '🪙', description: 'Under budget in 5+ categories!' },
  { id: 'first-steps', name: 'First Steps', emoji: '👣', description: 'Logged your first expense!' },
  { id: 'week-warrior', name: 'Week Warrior', emoji: '⚔️', description: '7 days of tracking!' },
  { id: 'green-goddess', name: 'Green Goddess', emoji: '🌿', description: 'Green streak for an entire month!' },
  { id: 'mooney-vip', name: 'Mooney VIP', emoji: '👑', description: 'Tracked 30+ expenses in a month!' },
  { id: 'comeback-kid', name: 'Comeback Kid', emoji: '🚀', description: 'Bounced back under budget after an overshoot!' },
];
