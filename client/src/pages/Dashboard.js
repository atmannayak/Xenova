import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Wallet,
  Timer,
  Flame,
  Plus,
  Play,
  Trophy,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Sparkles,
  Settings,
  Award,
  Lock,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuth } from '../context/AuthContext';

import {
  financeApi,
  productivityApi,
} from '../services/api';

// ---------------------------------------------------------------------------
// Category colors
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = {
  Food: '#548a62',
  Transport: '#dc8d20',
  Books: '#74a780',
  Entertainment: '#e6a638',
  Shopping: '#9dc4a5',
  Health: '#c06f18',
  Education: '#3f6f4c',
  Other: '#a1a1aa',
};

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent = 'sage',
  sub,
}) => (
  <div className="card p-4">
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          accent === 'sage'
            ? 'bg-sage-600/10 text-sage-600 dark:text-sage-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}
      >
        <Icon size={18} />
      </div>

      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>

    <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {value}
    </p>

    {sub && (
      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
        {sub}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const SkeletonCard = () => (
  <div className="card p-4">
    <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />

    <div className="mt-3 h-6 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />

    <div className="mt-2 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
  </div>
);

// ===========================================================================
// DASHBOARD
// ===========================================================================

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [finance, setFinance] = useState(null);

  const [productivity, setProductivity] =
    useState(null);

  const [transactions, setTransactions] =
    useState([]);

  const [achievements, setAchievements] =
    useState([]);

  const [loadingAchievements, setLoadingAchievements] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [goalInput, setGoalInput] =
    useState('20');

  const [savingGoal, setSavingGoal] =
    useState(false);

  const [showGoalInput, setShowGoalInput] =
    useState(false);

  // -------------------------------------------------------------------------
  // Load dashboard
  // -------------------------------------------------------------------------

  const loadDashboard = async () => {
    setLoading(true);
    setLoadingAchievements(true);

    try {
      // ---------------------------------------------------------------------
      // Load APIs separately so one failing endpoint does not destroy the
      // complete dashboard.
      // ---------------------------------------------------------------------

      const results =
        await Promise.allSettled([
          financeApi.getSummary(),
          productivityApi.getSummary(),
          financeApi.getTransactions(),
          productivityApi.getMyAchievements(),
        ]);

      // ---------------------------------------------------------------------
      // Finance summary
      // ---------------------------------------------------------------------

      const financeResult = results[0];

      if (
        financeResult.status === 'fulfilled'
      ) {
        setFinance(
          financeResult.value?.data || null
        );
      } else {
        console.error(
          'Finance summary failed:',
          financeResult.reason
        );

        setFinance(null);
      }

      // ---------------------------------------------------------------------
      // Productivity summary
      // ---------------------------------------------------------------------

      const productivityResult =
        results[1];

      if (
        productivityResult.status ===
        'fulfilled'
      ) {
        const productivityData =
          productivityResult.value?.data ||
          null;

        setProductivity(
          productivityData
        );

        setGoalInput(
          String(
            productivityData?.weeklyStudyGoal ||
              20
          )
        );
      } else {
        console.error(
          'Productivity summary failed:',
          productivityResult.reason
        );

        setProductivity(null);
      }

      // ---------------------------------------------------------------------
      // Transactions
      // ---------------------------------------------------------------------

      const transactionsResult =
        results[2];

      if (
        transactionsResult.status ===
        'fulfilled'
      ) {
        const transactionData =
          transactionsResult.value?.data;

        const transactionList =
          Array.isArray(
            transactionData?.transactions
          )
            ? transactionData.transactions
            : Array.isArray(
                transactionData
              )
            ? transactionData
            : [];

        setTransactions(
          transactionList.slice(0, 5)
        );
      } else {
        console.error(
          'Transactions failed:',
          transactionsResult.reason
        );

        setTransactions([]);
      }

      // ---------------------------------------------------------------------
      // Achievements
      // ---------------------------------------------------------------------

      const achievementsResult =
        results[3];

      if (
        achievementsResult.status ===
        'fulfilled'
      ) {
        const achievementData =
          achievementsResult.value?.data;

        if (
          Array.isArray(
            achievementData
          )
        ) {
          setAchievements(
            achievementData
          );
        } else if (
          Array.isArray(
            achievementData?.achievements
          )
        ) {
          setAchievements(
            achievementData.achievements
          );
        } else if (
          Array.isArray(
            achievementData?.userAchievements
          )
        ) {
          setAchievements(
            achievementData.userAchievements
          );
        } else {
          setAchievements([]);
        }
      } else {
        console.error(
          'Achievements failed:',
          achievementsResult.reason
        );

        setAchievements([]);
      }
    } catch (error) {
      console.error(
        'Failed to load dashboard:',
        error
      );
    } finally {
      setLoading(false);
      setLoadingAchievements(false);
    }
  };

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    loadDashboard();
  }, []);

  // -------------------------------------------------------------------------
  // Save weekly study goal
  // -------------------------------------------------------------------------

  const saveStudyGoal = async (e) => {
    e.preventDefault();

    const goal = Number(goalInput);

    if (
      !Number.isFinite(goal) ||
      goal < 1 ||
      goal > 168
    ) {
      alert(
        'Please enter a study goal between 1 and 168 hours.'
      );

      return;
    }

    setSavingGoal(true);

    try {
      await productivityApi.updateWeeklyGoal(
        goal
      );

      await loadDashboard();

      setShowGoalInput(false);
    } catch (error) {
      console.error(
        'Failed to update study goal:',
        error
      );

      alert(
        error?.response?.data?.message ||
          'Could not update study goal.'
      );
    } finally {
      setSavingGoal(false);
    }
  };

  // -------------------------------------------------------------------------
  // Date
  // -------------------------------------------------------------------------

  const today =
    new Date().toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }
    );

  // -------------------------------------------------------------------------
  // Productivity values
  // -------------------------------------------------------------------------

  const todaysFocusMinutes =
    Number(
      productivity?.todaysFocusMinutes || 0
    );

  const focusHours = (
    todaysFocusMinutes / 60
  ).toFixed(1);

  const todaysCompletedSessions =
    Number(
      productivity?.todaysCompletedSessions ||
        0
    );

  const todaysCompletedActivities =
    Number(
      productivity?.todaysCompletedActivities ||
        0
    );

  const weeklyHours =
    Number(
      productivity?.weeklyFocusHours || 0
    );

  const weeklyGoal =
    Number(
      productivity?.weeklyStudyGoal || 20
    );

  const weeklyGoalPercentage =
    Math.min(
      Math.max(
        Number(
          productivity?.weeklyGoalPercentage ||
            0
        ),
        0
      ),
      100
    );

  const productivityScore =
    Math.min(
      Math.max(
        Number(
          productivity?.productivityScore || 0
        ),
        0
      ),
      100
    );

  // -------------------------------------------------------------------------
  // Weekly active days
  // -------------------------------------------------------------------------

  const weeklyActiveDays =
    Number(
      productivity?.weeklyActiveDays ??
        0
    );

  // -------------------------------------------------------------------------
  // XP
  // -------------------------------------------------------------------------

  const totalXP =
    Number(
      productivity?.totalXP || 0
    );

  const currentLevel =
    Math.max(
      Number(
        productivity?.level || 1
      ),
      1
    );

  const xpForNextLevel =
    currentLevel * 500;

  const xpAtCurrentLevel =
    (currentLevel - 1) * 500;

  const currentLevelXP =
    Math.max(
      totalXP -
        xpAtCurrentLevel,
      0
    );

  const xpNeededForLevel =
    xpForNextLevel -
    xpAtCurrentLevel;

  const xpProgress =
    xpNeededForLevel > 0
      ? Math.min(
          Math.round(
            (
              currentLevelXP /
              xpNeededForLevel
            ) * 100
          ),
          100
        )
      : 0;

  const xpRemaining =
    Math.max(
      xpForNextLevel -
        totalXP,
      0
    );

  // -------------------------------------------------------------------------
  // Streak
  // -------------------------------------------------------------------------

  const currentStreak =
    Number(
      productivity?.currentStreak ??
        productivity?.streak ??
        0
    );

  const longestStreak =
    Number(
      productivity?.longestStreak || 0
    );

  // -------------------------------------------------------------------------
  // Spending
  // -------------------------------------------------------------------------

  const spendingCategories =
    Array.isArray(
      finance?.spendingByCategory
    )
      ? finance.spendingByCategory
      : [];

  const pieData =
    spendingCategories.length > 0
      ? spendingCategories
      : [
          {
            category:
              'No spending yet',
            total: 1,
          },
        ];

  const largestCategory =
    spendingCategories.length > 0
      ? spendingCategories.reduce(
          (largest, current) =>
            Number(
              current?.total || 0
            ) >
            Number(
              largest?.total || 0
            )
              ? current
              : largest
        )
      : null;

  const spendingInsight =
    largestCategory
      ? `${largestCategory.category} accounts for ${formatCurrency(
          largestCategory.total
        )} this month, which is your largest expense category.`
      : 'Add some expenses to see your personalized spending insight.';

  // -------------------------------------------------------------------------
  // Budget
  // -------------------------------------------------------------------------

  const monthlyBudget =
    Number(
      finance?.monthlyBudget || 0
    );

  const monthExpenses =
    Number(
      finance?.monthExpenses || 0
    );

  const monthIncome =
    Number(
      finance?.monthIncome || 0
    );

  const monthBalance =
    monthIncome -
    monthExpenses;

  const budgetPercentage =
    monthlyBudget > 0
      ? Math.round(
          (
            monthExpenses /
            monthlyBudget
          ) * 100
        )
      : 0;

  // -------------------------------------------------------------------------
  // Score message
  // -------------------------------------------------------------------------

  const scoreMessage =
    productivityScore >= 80
      ? 'Excellent progress. Keep your routine going.'
      : productivityScore >= 60
      ? 'Good progress. A little more consistency can improve your score.'
      : productivityScore >= 40
      ? 'You are building momentum. Focus on consistency this week.'
      : 'Start with a small daily focus session and build from there.';

  // -------------------------------------------------------------------------
  // Upcoming activities
  // -------------------------------------------------------------------------

  const upcomingActivities =
    Array.isArray(
      productivity?.upcomingActivities
    )
      ? productivity.upcomingActivities
      : [];

  // -------------------------------------------------------------------------
  // Achievement helpers
  // -------------------------------------------------------------------------

  const getAchievementData = (
    item,
    index
  ) => {
    const achievement =
      item?.achievement || item;

    return {
      id:
        item?._id ||
        achievement?._id ||
        `achievement-${index}`,

      name:
        achievement?.name ||
        achievement?.title ||
        'Achievement',

      description:
        achievement?.description ||
        'Achievement unlocked',

      icon:
        achievement?.icon ||
        '🏆',

      xpReward:
        Number(
          achievement?.xpReward ??
            achievement?.xp ??
            0
        ),

      unlockedAt:
        item?.unlockedAt ||
        achievement?.unlockedAt ||
        null,
    };
  };

  const normalizedAchievements =
    achievements.map(
      getAchievementData
    );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Good to see you,{' '}
            {user?.name?.split(' ')[0] ||
              'Student'}
          </h1>

          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {today}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={() =>
              navigate('/finance')
            }
            className="btn-secondary"
          >
            <Plus size={16} />
            Add transaction
          </button>

          <button
            onClick={() =>
              navigate('/focus')
            }
            className="btn-secondary"
          >
            <Play size={16} />
            Start focus session
          </button>

          <button
            onClick={() =>
              navigate('/activities')
            }
            className="btn-primary"
          >
            <Trophy size={16} />
            Add activity
          </button>

        </div>
      </div>

      {/* ================================================================ */}
      {/* STAT CARDS */}
      {/* ================================================================ */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Month's Balance"
              value={formatCurrency(
                monthBalance
              )}
              sub={`${formatCurrency(
                monthExpenses
              )} spent this month`}
            />

            <StatCard
              icon={Timer}
              label="Daily Focus Hours"
              value={`${focusHours}h`}
              accent="amber"
              sub={`${todaysCompletedSessions} sessions today`}
            />

            <StatCard
              icon={Flame}
              label="Current Streak"
              value={`${currentStreak} days`}
              accent="amber"
              sub={`Longest: ${longestStreak} days`}
            />

            <StatCard
              icon={Brain}
              label="Productivity Score"
              value={`${productivityScore}/100`}
              sub="Focus + activities + consistency"
            />
          </>
        )}

      </div>

      {/* ================================================================ */}
      {/* XP / GAMIFICATION */}
      {/* ================================================================ */}

      <div className="card overflow-hidden p-5">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Trophy
                size={24}
                className="text-amber-500"
              />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Level {currentLevel}
                </h2>

                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  {totalXP} XP
                </span>

              </div>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Complete focus sessions and activities to earn XP.
              </p>

            </div>

          </div>

          <div className="text-left sm:text-right">

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Next level
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {xpRemaining} XP remaining
            </p>

          </div>

        </div>

        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between text-xs">

            <span className="text-zinc-500 dark:text-zinc-400">
              Level {currentLevel} progress
            </span>

            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {xpProgress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out"
              style={{
                width: `${xpProgress}%`,
              }}
            />

          </div>

          <div className="mt-2 flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">

            <span>
              {currentLevelXP} XP
            </span>

            <span>
              {xpNeededForLevel} XP to level up
            </span>

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* ACHIEVEMENTS / BADGES */}
      {/* ================================================================ */}

      <div className="card p-5">

        <div className="mb-5 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Award
                size={20}
                className="text-amber-500"
              />
            </div>

            <div>

              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Achievements & Badges
              </h2>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Your unlocked achievements
              </p>

            </div>

          </div>

          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {normalizedAchievements.length}{' '}
            unlocked
          </span>

        </div>

        {loadingAchievements ? (

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
                >
                  <div className="mx-auto h-14 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />

                  <div className="mx-auto mt-3 h-4 w-24 rounded bg-zinc-100 dark:bg-zinc-800" />

                  <div className="mx-auto mt-2 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              )
            )}

          </div>

        ) : normalizedAchievements.length === 0 ? (

          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">

              <Lock
                size={24}
                className="text-zinc-400"
              />

            </div>

            <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No badges unlocked yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-zinc-500">
              Complete focus sessions and activities to unlock your first achievement.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {normalizedAchievements.map(
              (achievement) => (

                <div
                  key={achievement.id}
                  className="group rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 text-center transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-amber-900/50 dark:hover:bg-amber-950/20"
                >

                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl shadow-sm">

                    <span>
                      {achievement.icon}
                    </span>

                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Trophy size={11} />
                    </span>

                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {achievement.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {achievement.description}
                  </p>

                  {achievement.xpReward > 0 && (
                    <div className="mt-3 inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      +{achievement.xpReward} XP
                    </div>
                  )}

                  {achievement.unlockedAt && (
                    <p className="mt-2 text-[10px] text-zinc-400">
                      Unlocked{' '}
                      {new Date(
                        achievement.unlockedAt
                      ).toLocaleDateString(
                        'en-IN'
                      )}
                    </p>
                  )}

                </div>

              )
            )}

          </div>

        )}

        {normalizedAchievements.length > 0 && (
          <div className="mt-5 text-center">

            <button
              onClick={() =>
                navigate(
                  '/achievements'
                )
              }
              className="text-xs font-medium text-sage-600 hover:underline dark:text-sage-400"
            >
              View all achievements
            </button>

          </div>
        )}

      </div>

      {/* ================================================================ */}
      {/* PRODUCTIVITY + WEEKLY GOAL */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Productivity Score */}

        <div className="card p-5 lg:col-span-1">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Productivity Score
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Your weekly productivity overview
              </p>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-600/10 text-lg font-bold text-sage-600 dark:text-sage-400">
              {productivityScore}
            </div>

          </div>

          <div className="mt-5">

            <div className="mb-2 flex justify-between text-xs text-zinc-500">

              <span>
                Overall score
              </span>

              <span>
                {productivityScore}/100
              </span>

            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

              <div
                className="h-full rounded-full bg-sage-600 transition-all duration-500"
                style={{
                  width: `${productivityScore}%`,
                }}
              />

            </div>

          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {scoreMessage}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">

            <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-800/60">

              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {Number(
                  productivity?.focusScore || 0
                )}
              </p>

              <p className="text-[10px] text-zinc-500">
                Focus
              </p>

            </div>

            <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-800/60">

              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {Number(
                  productivity?.activityCompletionScore ||
                    0
                )}
              </p>

              <p className="text-[10px] text-zinc-500">
                Activities
              </p>

            </div>

            <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-800/60">

              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {Number(
                  productivity?.consistencyScore ||
                    0
                )}
              </p>

              <p className="text-[10px] text-zinc-500">
                Consistency
              </p>

            </div>

          </div>

        </div>

        {/* Weekly Study Goal */}

        <div className="card p-5 lg:col-span-2">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Target size={18} />
              </div>

              <div>

                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Weekly Study Goal
                </h2>

                <p className="text-xs text-zinc-500">
                  Build a consistent study routine
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowGoalInput(
                  !showGoalInput
                )
              }
              className="btn-ghost p-2"
              title="Change weekly goal"
            >
              <Settings size={15} />
            </button>

          </div>

          {showGoalInput && (
            <form
              onSubmit={saveStudyGoal}
              className="mt-4 flex gap-2"
            >

              <input
                type="number"
                min="1"
                max="168"
                step="0.5"
                value={goalInput}
                onChange={(e) =>
                  setGoalInput(
                    e.target.value
                  )
                }
                className="input"
                placeholder="Weekly goal in hours"
              />

              <button
                type="submit"
                disabled={savingGoal}
                className="btn-primary whitespace-nowrap"
              >
                {savingGoal
                  ? 'Saving...'
                  : 'Save Goal'}
              </button>

            </form>
          )}

          <div className="mt-6 flex items-end justify-between">

            <div>

              <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {weeklyHours}h
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                of {weeklyGoal} hours
              </p>

            </div>

            <p className="text-sm font-semibold text-sage-600 dark:text-sage-400">
              {weeklyGoalPercentage}%
            </p>

          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

            <div
              className="h-full rounded-full bg-sage-600 transition-all duration-500"
              style={{
                width: `${weeklyGoalPercentage}%`,
              }}
            />

          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">

              <p className="text-xs text-zinc-500">
                Study time
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {weeklyHours} hours
              </p>

            </div>

            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">

              <p className="text-xs text-zinc-500">
                Goal
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {weeklyGoal} hours
              </p>

            </div>

            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">

              <p className="text-xs text-zinc-500">
                Active days
              </p>

              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {weeklyActiveDays}/7
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* THIS WEEK */}
      {/* ================================================================ */}

      <div className="card p-5">

        <div className="mb-4 flex items-center gap-2">

          <Sparkles
            size={18}
            className="text-amber-500"
          />

          <div>

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              This Week
            </h2>

            <p className="text-xs text-zinc-500">
              Your study and finance snapshot
            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-xl bg-sage-600/10 p-4">

            <div className="flex items-center gap-2">

              <Timer
                size={17}
                className="text-sage-600 dark:text-sage-400"
              />

              <p className="text-xs font-medium text-zinc-500">
                Study
              </p>

            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {weeklyHours} hrs
            </p>

          </div>

          <div className="rounded-xl bg-amber-500/10 p-4">

            <div className="flex items-center gap-2">

              <Wallet
                size={17}
                className="text-amber-600 dark:text-amber-400"
              />

              <p className="text-xs font-medium text-zinc-500">
                Spending
              </p>

            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {formatCurrency(
                monthExpenses
              )}
            </p>

          </div>

          <div className="rounded-xl bg-indigo-500/10 p-4">

            <div className="flex items-center gap-2">

              <TrendingDown
                size={17}
                className="text-indigo-600 dark:text-indigo-400"
              />

              <p className="text-xs font-medium text-zinc-500">
                Budget used
              </p>

            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {monthlyBudget > 0
                ? `${budgetPercentage}%`
                : 'No budget'}
            </p>

          </div>

          <div className="rounded-xl bg-purple-500/10 p-4">

            <div className="flex items-center gap-2">

              <Flame
                size={17}
                className="text-purple-600 dark:text-purple-400"
              />

              <p className="text-xs font-medium text-zinc-500">
                Study streak
              </p>

            </div>

            <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {currentStreak} days
            </p>

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* FINANCE CHARTS */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Weekly spending */}

        <div className="card p-5 lg:col-span-2">

          <div className="mb-4 flex items-center justify-between">

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Weekly spending
            </h2>

            <div className="flex items-center gap-4 text-xs text-zinc-500">

              <span className="flex items-center gap-1">

                <TrendingUp
                  size={13}
                  className="text-sage-600"
                />

                Income{' '}

                {formatCurrency(
                  monthIncome
                )}

              </span>

              <span className="flex items-center gap-1">

                <TrendingDown
                  size={13}
                  className="text-amber-600"
                />

                Expenses{' '}

                {formatCurrency(
                  monthExpenses
                )}

              </span>

            </div>

          </div>

          <div className="h-64">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={
                  Array.isArray(
                    finance?.dailyTrend
                  )
                    ? finance.dailyTrend
                    : []
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#3f3f4620"
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#71717a',
                  }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#71717a',
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                  contentStyle={{
                    background:
                      '#18181b',
                    border:
                      '1px solid #27272a',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#fafafa',
                  }}
                />

                <Bar
                  dataKey="amount"
                  fill="#e6a638"
                  radius={[
                    4,
                    4,
                    0,
                    0,
                  ]}
                  maxBarSize={32}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* Category breakdown */}

        <div className="card p-5">

          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Spending by category
          </h2>

          <div className="h-48">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={pieData}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >

                  {pieData.map(
                    (entry, index) => (
                      <Cell
                        key={`${entry.category}-${index}`}
                        fill={
                          CATEGORY_COLORS[
                            entry.category
                          ] ||
                          '#a1a1aa'
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

              </PieChart>

            </ResponsiveContainer>

          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">

            {spendingCategories.map(
              (entry) => (

                <span
                  key={entry.category}
                  className="flex items-center gap-1.5 text-xs text-zinc-500"
                >

                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        CATEGORY_COLORS[
                          entry.category
                        ] ||
                        '#a1a1aa',
                    }}
                  />

                  {entry.category}

                </span>

              )
            )}

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* SPENDING INSIGHT */}
      {/* ================================================================ */}

      <div className="card border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/10">

        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">

            <Sparkles size={18} />

          </div>

          <div>

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Spending Insight
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {spendingInsight}
            </p>

          </div>

        </div>

      </div>

      {/* ================================================================ */}
      {/* RECENT TRANSACTIONS + UPCOMING ACTIVITIES */}
      {/* ================================================================ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Recent transactions */}

        <div className="card p-5">

          <div className="mb-3 flex items-center justify-between">

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Recent transactions
            </h2>

            <button
              onClick={() =>
                navigate('/finance')
              }
              className="text-xs font-medium text-sage-600 hover:underline dark:text-sage-400"
            >
              View all
            </button>

          </div>

          {transactions.length === 0 ? (

            <p className="py-6 text-center text-sm text-zinc-400">
              No transactions yet. Add your first one.
            </p>

          ) : (

            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">

              {transactions.map(
                (transaction) => (

                  <li
                    key={
                      transaction._id
                    }
                    className="flex items-center justify-between py-2.5"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {transaction.title}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {transaction.category}{' '}
                        ·{' '}
                        {transaction.date
                          ? new Date(
                              transaction.date
                            ).toLocaleDateString(
                              'en-IN'
                            )
                          : 'No date'}
                      </p>

                    </div>

                    <span
                      className={`text-sm font-semibold ${
                        transaction.type ===
                        'income'
                          ? 'text-sage-600 dark:text-sage-400'
                          : 'text-zinc-500'
                      }`}
                    >

                      {transaction.type ===
                      'income'
                        ? '+'
                        : '-'}

                      {formatCurrency(
                        transaction.amount
                      )}

                    </span>

                  </li>

                )
              )}

            </ul>

          )}

        </div>

        {/* Upcoming activities */}

        <div className="card p-5">

          <div className="mb-3 flex items-center justify-between">

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Upcoming activities
            </h2>

            <button
              onClick={() =>
                navigate('/activities')
              }
              className="text-xs font-medium text-sage-600 hover:underline dark:text-sage-400"
            >
              View all
            </button>

          </div>

          {!upcomingActivities.length ? (

            <p className="py-6 text-center text-sm text-zinc-400">
              Nothing scheduled. Plan your next activity.
            </p>

          ) : (

            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">

              {upcomingActivities.map(
                (activity) => (

                  <li
                    key={
                      activity._id
                    }
                    className="flex items-center justify-between py-2.5"
                  >

                    <div className="min-w-0">

                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {activity.title}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {activity.activityType}
                      </p>

                    </div>

                    <span className="text-xs text-zinc-500">
                      {activity.date
                        ? new Date(
                            activity.date
                          ).toLocaleDateString(
                            'en-IN'
                          )
                        : 'No date'}
                    </span>

                  </li>

                )
              )}

            </ul>

          )}

        </div>

      </div>

    </div>
  );
};

export default Dashboard;

