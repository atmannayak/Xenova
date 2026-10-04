import React, { useEffect, useMemo, useState } from 'react';
import {
  BrainCircuit,
  Target,
  Wallet,
  Flame,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock3,
  Pencil,
  Save,
  X,
} from 'lucide-react';

import { financeApi, productivityApi } from '../services/api';
import { useToast } from '../context/ToastContext';

const DEFAULT_WEEKLY_GOAL = 20;

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getWeekStart = () => {
  const date = new Date();
  const day = date.getDay();

  // Monday = start of week
  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);
  date.setHours(0, 0, 0, 0);

  return date;
};

const isThisWeek = (dateValue) => {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const weekStart = getWeekStart();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return date >= weekStart && date < weekEnd;
};

const StudentInsights = () => {
  const toast = useToast();

  const [focusSessions, setFocusSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const savedGoal = localStorage.getItem('xenovaWeeklyStudyGoal');

    return savedGoal
      ? Number(savedGoal)
      : DEFAULT_WEEKLY_GOAL;
  });

  const [goalInput, setGoalInput] = useState(() => {
    const savedGoal = localStorage.getItem('xenovaWeeklyStudyGoal');

    return savedGoal
      ? String(savedGoal)
      : String(DEFAULT_WEEKLY_GOAL);
  });

  const [editingGoal, setEditingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const [
          focusResponse,
          activityResponse,
          financeSummaryResponse,
          transactionResponse,
        ] = await Promise.all([
          productivityApi.getFocusSessions(),
          productivityApi.getActivities(),
          financeApi.getSummary(),
          financeApi.getTransactions(),
        ]);

        setFocusSessions(focusResponse.data.sessions || []);
        setActivities(activityResponse.data.activities || []);
        setFinanceSummary(financeSummaryResponse.data || {});
        setTransactions(transactionResponse.data.transactions || []);
      } catch (error) {
        console.error('Could not load student insights:', error);
        toast.error('Could not load productivity insights');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [toast]);

  /*
   * ---------------------------------------------------------
   * WEEKLY STUDY DATA
   * ---------------------------------------------------------
   */

  const weeklyFocusSessions = useMemo(() => {
    return focusSessions.filter(
      (session) =>
        session.sessionType === 'focus' &&
        session.completed &&
        isThisWeek(session.startTime)
    );
  }, [focusSessions]);

  const weeklyStudyMinutes = useMemo(() => {
    return weeklyFocusSessions.reduce(
      (total, session) => total + Number(session.duration || 0),
      0
    );
  }, [weeklyFocusSessions]);

  const weeklyStudyHours = weeklyStudyMinutes / 60;

  /*
   * ---------------------------------------------------------
   * WEEKLY GOAL
   * ---------------------------------------------------------
   */

  const goalMinutes = Math.max(Number(weeklyGoal) || 1, 1) * 60;

  const studyGoalPercent = Math.min(
    Math.round((weeklyStudyMinutes / goalMinutes) * 100),
    100
  );

  const saveWeeklyGoal = () => {
    const goal = Number(goalInput);

    if (!goal || goal <= 0) {
      toast.error('Please enter a valid weekly study goal');
      return;
    }

    if (goal > 168) {
      toast.error('Weekly study goal cannot exceed 168 hours');
      return;
    }

    localStorage.setItem('xenovaWeeklyStudyGoal', String(goal));
    setWeeklyGoal(goal);
    setEditingGoal(false);

    toast.success(`Weekly study goal set to ${goal} hours`);
  };

  /*
   * ---------------------------------------------------------
   * ACTIVITY COMPLETION
   * ---------------------------------------------------------
   */

  const activityStats = useMemo(() => {
    const weeklyActivities = activities.filter((activity) =>
      isThisWeek(activity.date)
    );

    const completed = weeklyActivities.filter(
      (activity) => activity.status === 'completed'
    ).length;

    const total = weeklyActivities.length;

    const percentage =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      percentage,
    };
  }, [activities]);

  /*
   * ---------------------------------------------------------
   * CONSISTENCY / STUDY STREAK
   * ---------------------------------------------------------
   */

  const studyDays = useMemo(() => {
    const days = new Set();

    weeklyFocusSessions.forEach((session) => {
      if (!session.startTime) return;

      const date = new Date(session.startTime);

      days.add(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      );
    });

    return days;
  }, [weeklyFocusSessions]);

  const consistencyPercent = Math.round(
    (studyDays.size / 7) * 100
  );

  /*
   * ---------------------------------------------------------
   * CURRENT STUDY STREAK
   * ---------------------------------------------------------
   */

  const studyStreak = useMemo(() => {
    const completedDays = new Set();

    focusSessions
      .filter(
        (session) =>
          session.sessionType === 'focus' && session.completed
      )
      .forEach((session) => {
        if (!session.startTime) return;

        const date = new Date(session.startTime);

        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

        completedDays.add(key);
      });

    let streak = 0;

    const current = new Date();
    current.setHours(0, 0, 0, 0);

    while (true) {
      const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;

      if (!completedDays.has(key)) {
        break;
      }

      streak++;

      current.setDate(current.getDate() - 1);
    }

    return streak;
  }, [focusSessions]);

  /*
   * ---------------------------------------------------------
   * PRODUCTIVITY SCORE
   *
   * Study hours       = 35 points
   * Activity completion = 25 points
   * Focus consistency = 25 points
   * Study consistency = 15 points
   * ---------------------------------------------------------
   */

  const productivityScore = useMemo(() => {
    const studyScore = Math.min(
      weeklyStudyMinutes / goalMinutes,
      1
    ) * 35;

    const activityScore =
      (activityStats.percentage / 100) * 25;

    const focusScore =
      Math.min(weeklyFocusSessions.length / 5, 1) * 25;

    const consistencyScore =
      (consistencyPercent / 100) * 15;

    return Math.round(
      studyScore +
        activityScore +
        focusScore +
        consistencyScore
    );
  }, [
    weeklyStudyMinutes,
    goalMinutes,
    activityStats.percentage,
    weeklyFocusSessions.length,
    consistencyPercent,
  ]);

  /*
   * ---------------------------------------------------------
   * FINANCE DATA
   * ---------------------------------------------------------
   */

  const monthlyBudget = financeSummary?.monthlyBudget || 0;

  const monthlyExpenses = financeSummary?.monthExpenses || 0;

  const budgetPercent =
    monthlyBudget > 0
      ? Math.round(
          (monthlyExpenses / monthlyBudget) * 100
        )
      : 0;

  /*
   * ---------------------------------------------------------
   * SPENDING INSIGHT
   * ---------------------------------------------------------
   */

  const spendingInsight = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const expenses = transactions.filter((transaction) => {
      if (transaction.type !== 'expense') return false;

      const date = new Date(transaction.date);

      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });

    if (expenses.length === 0) {
      return {
        category: null,
        amount: 0,
      };
    }

    const categoryTotals = {};

    expenses.forEach((transaction) => {
      const category = transaction.category || 'Other';

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        Number(transaction.amount || 0);
    });

    const largestCategory = Object.entries(
      categoryTotals
    ).sort((a, b) => b[1] - a[1])[0];

    return {
      category: largestCategory?.[0] || null,
      amount: largestCategory?.[1] || 0,
    };
  }, [transactions]);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card h-40 animate-pulse p-5" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="card h-32 animate-pulse p-5"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ----------------------------------------------------
          PRODUCTIVITY SCORE + WEEKLY GOAL
      ----------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Productivity Score */}

        <div className="card p-6">
          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Productivity Score
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {productivityScore}
                </span>

                <span className="mb-1 text-sm text-zinc-400">
                  / 100
                </span>
              </div>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-600/10">
              <BrainCircuit
                size={20}
                className="text-sage-600 dark:text-sage-400"
              />
            </div>
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-sage-600 transition-all duration-700"
              style={{
                width: `${productivityScore}%`,
              }}
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-zinc-500">
            <div>
              Study
              <span className="ml-1 font-semibold text-zinc-800 dark:text-zinc-200">
                {weeklyStudyHours.toFixed(1)}h
              </span>
            </div>

            <div>
              Activities
              <span className="ml-1 font-semibold text-zinc-800 dark:text-zinc-200">
                {activityStats.completed}/{activityStats.total}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Study Goal */}

        <div className="card p-6">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Weekly Study Goal
              </p>

              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {weeklyStudyHours.toFixed(1)}
                </span>

                <span className="mb-1 text-sm text-zinc-400">
                  / {weeklyGoal} hrs
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">

              <Target
                size={20}
                className="text-amber-500"
              />

              <button
                onClick={() => setEditingGoal(true)}
                className="btn-ghost p-1.5"
                aria-label="Edit weekly study goal"
              >
                <Pencil size={14} />
              </button>

            </div>
          </div>

          {editingGoal ? (
            <div className="mt-5 flex gap-2">

              <input
                type="number"
                min="1"
                max="168"
                value={goalInput}
                onChange={(e) =>
                  setGoalInput(e.target.value)
                }
                className="input"
                placeholder="Hours per week"
              />

              <button
                onClick={saveWeeklyGoal}
                className="btn-primary px-3"
              >
                <Save size={15} />
              </button>

              <button
                onClick={() => {
                  setGoalInput(String(weeklyGoal));
                  setEditingGoal(false);
                }}
                className="btn-secondary px-3"
              >
                <X size={15} />
              </button>

            </div>
          ) : (
            <>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-700"
                  style={{
                    width: `${studyGoalPercent}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex justify-between text-xs text-zinc-500">
                <span>
                  {studyGoalPercent}% completed
                </span>

                <span>
                  {Math.max(
                    weeklyGoal - weeklyStudyHours,
                    0
                  ).toFixed(1)}{' '}
                  hrs remaining
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          WEEKLY SNAPSHOT
      ----------------------------------------------------- */}

      <div>

        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          This Week
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Study */}

          <div className="card p-5">

            <div className="flex items-center justify-between">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <BookOpen
                  size={18}
                  className="text-blue-500"
                />
              </div>

              <TrendingUp
                size={15}
                className="text-zinc-300"
              />

            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Study time
            </p>

            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {weeklyStudyHours.toFixed(1)} hrs
            </p>

          </div>

          {/* Spending */}

          <div className="card p-5">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <Wallet
                size={18}
                className="text-red-500"
              />
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Monthly spending
            </p>

            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(monthlyExpenses)}
            </p>

          </div>

          {/* Budget */}

          <div className="card p-5">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp
                size={18}
                className="text-amber-500"
              />
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Budget used
            </p>

            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {monthlyBudget > 0
                ? `${budgetPercent}%`
                : 'Not set'}
            </p>

          </div>

          {/* Streak */}

          <div className="card p-5">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame
                size={18}
                className="text-orange-500"
              />
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Study streak
            </p>

            <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {studyStreak} {studyStreak === 1 ? 'day' : 'days'}
            </p>

          </div>

        </div>
      </div>

      {/* ----------------------------------------------------
          ACTIVITY + CONSISTENCY
      ----------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Activity completion
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Completed activities this week
              </p>
            </div>

            <CheckCircle2
              size={20}
              className="text-sage-600 dark:text-sage-400"
            />

          </div>

          <div className="mt-5 flex items-end justify-between">

            <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {activityStats.percentage}%
            </span>

            <span className="text-xs text-zinc-500">
              {activityStats.completed} of{' '}
              {activityStats.total} completed
            </span>

          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-sage-600 transition-all duration-700"
              style={{
                width: `${activityStats.percentage}%`,
              }}
            />
          </div>

        </div>

        <div className="card p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Study consistency
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Days with at least one focus session
              </p>
            </div>

            <Clock3
              size={20}
              className="text-blue-500"
            />

          </div>

          <div className="mt-5 flex items-end justify-between">

            <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
              {consistencyPercent}%
            </span>

            <span className="text-xs text-zinc-500">
              {studyDays.size} of 7 days
            </span>

          </div>

          <div className="mt-3 flex gap-1.5">

            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <div
                key={day}
                className={`h-2 flex-1 rounded-full ${
                  day < studyDays.size
                    ? 'bg-blue-500'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
              />
            ))}

          </div>

        </div>

      </div>

      {/* ----------------------------------------------------
          SMART SPENDING INSIGHT
      ----------------------------------------------------- */}

      <div className="card p-5">

        <div className="flex items-start gap-4">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
            <TrendingUp
              size={20}
              className="text-indigo-500"
            />
          </div>

          <div>

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Spending Insight
            </h2>

            {spendingInsight.category ? (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">

                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {spendingInsight.category}
                </span>{' '}
                accounts for{' '}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatCurrency(
                    spendingInsight.amount
                  )}
                </span>{' '}
                this month, which is your largest
                expense category.

              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">
                Add some expenses to generate your first
                spending insight.
              </p>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentInsights;