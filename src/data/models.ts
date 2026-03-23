// Budget Tracker Data Models

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: number; // timestamp
}

export interface BudgetGoal {
  daily: number;
  weekly: number;
  monthly: number;
}

export interface StreakData {
  count: number;
  lastDate: string;
  bestStreak: number;
}

export const DEFAULT_BUDGET: BudgetGoal = {
  daily: 50,
  weekly: 350,
  monthly: 1500,
};

export const CATEGORY_META: Record<ExpenseCategory, { label: string; icon: string; color: string }> = {
  food: { label: 'Food & Drinks', icon: 'restaurant-outline', color: '#FF6B6B' },
  transport: { label: 'Transport', icon: 'car-outline', color: '#4ECDC4' },
  shopping: { label: 'Shopping', icon: 'bag-handle-outline', color: '#A78BFA' },
  bills: { label: 'Bills & Utilities', icon: 'flash-outline', color: '#F59E0B' },
  entertainment: { label: 'Entertainment', icon: 'game-controller-outline', color: '#EC4899' },
  health: { label: 'Health', icon: 'fitness-outline', color: '#10B981' },
  education: { label: 'Education', icon: 'book-outline', color: '#3B82F6' },
  other: { label: 'Other', icon: 'ellipsis-horizontal-circle-outline', color: '#6B7280' },
};

export const ALL_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'other',
];

export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatCurrency(amount: number): string {
  return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'k';
  return '$' + amount.toFixed(0);
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return getDateString(d);
}

export function getMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDateString(d));
  }
  return days;
}

export function getShortDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()];
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
