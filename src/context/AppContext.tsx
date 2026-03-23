import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, BudgetGoal, StreakData, ExpenseCategory, DEFAULT_BUDGET, getToday, getWeekStart, getMonthKey } from '../data/models';

interface AppState {
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (v: boolean) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  editExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;

  // Budget
  budget: BudgetGoal;
  setBudget: (budget: BudgetGoal) => void;

  // Streak
  streak: StreakData;

  // Computed
  getTodayTotal: () => number;
  getWeekTotal: () => number;
  getMonthTotal: () => number;
  getExpensesByCategory: () => Record<ExpenseCategory, number>;
  getExpensesForDate: (date: string) => Expense[];
  getDailyTotals: (days: string[]) => number[];
}

const AppContext = createContext<AppState>({} as AppState);

const STORAGE_KEYS = {
  onboarding: 'bt_onboarding',
  expenses: 'bt_expenses',
  budget: 'bt_budget',
  streak: 'bt_streak',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setOnboarding] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudgetState] = useState<BudgetGoal>(DEFAULT_BUDGET);
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: '', bestStreak: 0 });
  const [loaded, setLoaded] = useState(false);

  // Load persisted state
  useEffect(() => {
    (async () => {
      try {
        const [onb, expData, budgetData, streakData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.onboarding),
          AsyncStorage.getItem(STORAGE_KEYS.expenses),
          AsyncStorage.getItem(STORAGE_KEYS.budget),
          AsyncStorage.getItem(STORAGE_KEYS.streak),
        ]);

        if (onb === 'true') setOnboarding(true);
        if (expData) setExpenses(JSON.parse(expData));
        if (budgetData) setBudgetState(JSON.parse(budgetData));

        // Update streak
        if (streakData) {
          const s: StreakData = JSON.parse(streakData);
          const today = getToday();
          const yesterday = (() => {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          })();

          if (s.lastDate === today) {
            setStreak(s);
          } else if (s.lastDate === yesterday) {
            // Check if yesterday was under budget
            const parsedExpenses: Expense[] = expData ? JSON.parse(expData) : [];
            const parsedBudget: BudgetGoal = budgetData ? JSON.parse(budgetData) : DEFAULT_BUDGET;
            const yesterdayTotal = parsedExpenses
              .filter(e => e.date === yesterday)
              .reduce((sum, e) => sum + e.amount, 0);

            if (yesterdayTotal <= parsedBudget.daily) {
              const newCount = s.count + 1;
              const newStreak: StreakData = {
                count: newCount,
                lastDate: today,
                bestStreak: Math.max(s.bestStreak, newCount),
              };
              setStreak(newStreak);
              AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(newStreak));
            } else {
              const reset: StreakData = { count: 0, lastDate: today, bestStreak: s.bestStreak };
              setStreak(reset);
              AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(reset));
            }
          } else {
            const reset: StreakData = { count: 0, lastDate: today, bestStreak: s.bestStreak };
            setStreak(reset);
            AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(reset));
          }
        }
      } catch (e) {
        console.error('Failed to load state:', e);
      }
      setLoaded(true);
    })();
  }, []);

  const setHasCompletedOnboarding = useCallback((v: boolean) => {
    setOnboarding(v);
    AsyncStorage.setItem(STORAGE_KEYS.onboarding, v ? 'true' : 'false');
  }, []);

  // Shared streak recalculation based on current expense list
  const recalculateStreak = useCallback((expenseList: Expense[]) => {
    const today = getToday();
    const todayTotal = expenseList
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);

    setStreak(prevStreak => {
      if (todayTotal <= budget.daily) {
        // Under budget today
        if (prevStreak.lastDate !== today) {
          // First time checking today — increment streak
          const newCount = prevStreak.count + 1;
          const newStreak: StreakData = {
            count: newCount,
            lastDate: today,
            bestStreak: Math.max(prevStreak.bestStreak, newCount),
          };
          AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(newStreak));
          return newStreak;
        }
        // Already checked today and was under — keep current streak
        // But if it was previously reset today (count=0), restore the pre-reset count
        if (prevStreak.count === 0 && prevStreak.lastDate === today && prevStreak.preResetCount != null) {
          const restoredCount = prevStreak.preResetCount;
          const newStreak: StreakData = {
            count: restoredCount,
            lastDate: today,
            bestStreak: Math.max(prevStreak.bestStreak, restoredCount),
          };
          AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(newStreak));
          return newStreak;
        }
        return prevStreak;
      }
      // Over budget today — reset but preserve current count for possible restoration
      const reset: StreakData = {
        count: 0,
        lastDate: today,
        bestStreak: prevStreak.bestStreak,
        preResetCount: prevStreak.count > 0 ? prevStreak.count : prevStreak.preResetCount,
      };
      AsyncStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(reset));
      return reset;
    });
  }, [budget.daily]);

  const addExpense = useCallback((expense: Expense) => {
    setExpenses(prev => {
      const next = [expense, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(next));
      recalculateStreak(next);
      return next;
    });
  }, [recalculateStreak]);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(next));
      recalculateStreak(next);
      return next;
    });
  }, [recalculateStreak]);

  const editExpense = useCallback((id: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...updates } : e);
      AsyncStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(next));
      recalculateStreak(next);
      return next;
    });
  }, [recalculateStreak]);

  const setBudget = useCallback((newBudget: BudgetGoal) => {
    setBudgetState(newBudget);
    AsyncStorage.setItem(STORAGE_KEYS.budget, JSON.stringify(newBudget));
  }, []);

  const getTodayTotal = useCallback(() => {
    const today = getToday();
    return expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getWeekTotal = useCallback(() => {
    const weekStart = getWeekStart();
    return expenses.filter(e => e.date >= weekStart).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getMonthTotal = useCallback(() => {
    const monthKey = getMonthKey();
    return expenses.filter(e => e.date.startsWith(monthKey)).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getExpensesByCategory = useCallback(() => {
    const result: Record<string, number> = {};
    const monthKey = getMonthKey();
    expenses
      .filter(e => e.date.startsWith(monthKey))
      .forEach(e => {
        result[e.category] = (result[e.category] || 0) + e.amount;
      });
    return result as Record<ExpenseCategory, number>;
  }, [expenses]);

  const getExpensesForDate = useCallback((date: string) => {
    return expenses.filter(e => e.date === date);
  }, [expenses]);

  const getDailyTotals = useCallback((days: string[]) => {
    return days.map(day => expenses.filter(e => e.date === day).reduce((sum, e) => sum + e.amount, 0));
  }, [expenses]);

  if (!loaded) return null;

  return (
    <AppContext.Provider
      value={{
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        expenses,
        addExpense,
        deleteExpense,
        editExpense,
        budget,
        setBudget,
        streak,
        getTodayTotal,
        getWeekTotal,
        getMonthTotal,
        getExpensesByCategory,
        getExpensesForDate,
        getDailyTotals,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
