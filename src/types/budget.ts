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
  month: number;
  year: number;
}

export interface Reward {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earnedDate: string;
  month: number;
  year: number;
}

export interface AppState {
  isOnboarded: boolean;
  categories: Category[];
  expenses: Expense[];
  budgetConfig: BudgetConfig;
  rewards: Reward[];
  fisheAlarmMuted: boolean;
  greenDayStreak: number;
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
];
