import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  BarChart3,
  Brain,
  CalendarDays,
  Clock3,
  Flame,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
} from 'recharts';

import {
  productivityApi,
  financeApi,
} from '../services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const SUBJECT_COLORS = [
  '#548a62',
  '#dc8d20',
  '#74a780',
  '#e6a638',
  '#9dc4a5',
  '#c06f18',
  '#3f6f4c',
  '#a1a1aa',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const startOfDay = (value) => {
  const date = new Date(value);

  date.setHours(0, 0, 0, 0);

  return date;
};

const dateKey = (value) =>
  startOfDay(value)
    .toISOString()
    .slice(0, 10);

const getMonday = (value) => {
  const date = startOfDay(value);

  const day = date.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  date.setDate(
    date.getDate() + difference
  );

  return date;
};

const formatHours = (minutes) => {
  const hours =
    Number(minutes || 0) / 60;

  return `${hours.toFixed(1)}h`;
};

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

const StatCard = ({
  icon: Icon,
  label,
  value,
  sub,
  iconClass = 'text-sage-600',
  bgClass = 'bg-sage-600/10',
}) => (
  <div className="card p-5">
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgClass}`}
      >
        <Icon
          size={19}
          className={iconClass}
        />
      </div>

      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>

    <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
      {value}
    </p>

    {sub && (
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        {sub}
      </p>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

const ChartTooltip = ({
  active,
  payload,
  label,
}) => {
  if (
    !active ||
    !payload ||
    !payload.length
  ) {
    return null;
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
        {label}
      </p>

      {payload.map(
        (item, index) => (
          <p
            key={index}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {item.name}:{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">
              {item.dataKey ===
              'spending'
                ? formatCurrency(
                    item.value
                  )
                : item.value}
            </span>
          </p>
        )
      )}
    </div>
  );
};

// ===========================================================================
// PRODUCTIVITY ANALYTICS
// ===========================================================================

const ProductivityAnalytics = () => {
  const navigate = useNavigate();

  const [summary, setSummary] =
    useState(null);

  const [sessions, setSessions] =
    useState([]);

  const [activities, setActivities] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------

  useEffect(() => {
    const loadAnalytics =
      async () => {
        try {
          setLoading(true);
          setError('');

          const [
            summaryRes,
            sessionsRes,
            activitiesRes,
            transactionsRes,
          ] = await Promise.all([
            productivityApi.getSummary(),
            productivityApi.getFocusSessions(),
            productivityApi.getActivities(),
            financeApi.getTransactions(),
          ]);

          setSummary(
            summaryRes?.data || null
          );

          setSessions(
            sessionsRes?.data?.sessions ||
              []
          );

          setActivities(
            activitiesRes?.data?.activities ||
              []
          );

          setTransactions(
            transactionsRes?.data?.transactions ||
              []
          );
        } catch (err) {
          console.error(
            'Failed to load productivity analytics:',
            err
          );

          setError(
            err?.response?.data?.message ||
              'Unable to load productivity analytics.'
          );
        } finally {
          setLoading(false);
        }
      };

    loadAnalytics();
  }, []);

  // -------------------------------------------------------------------------
  // Last 7 days
  // -------------------------------------------------------------------------

  const dailyData = useMemo(() => {
    const today =
      startOfDay(new Date());

    const monday =
      getMonday(today);

    return DAYS.map(
      (label, index) => {
        const date =
          new Date(monday);

        date.setDate(
          monday.getDate() + index
        );

        const key =
          dateKey(date);

        const daySessions =
          sessions.filter(
            (session) => {
              if (
                !session.startTime ||
                !session.completed ||
                session.sessionType !==
                  'focus'
              ) {
                return false;
              }

              return (
                dateKey(
                  session.startTime
                ) === key
              );
            }
          );

        const focusMinutes =
          daySessions.reduce(
            (sum, session) =>
              sum +
              Number(
                session.duration || 0
              ),
            0
          );

        const dayActivities =
          activities.filter(
            (activity) =>
              activity.date &&
              dateKey(
                activity.date
              ) === key
          );

        const completedActivities =
          dayActivities.filter(
            (activity) =>
              activity.status ===
              'completed'
          ).length;

        const dayTransactions =
          transactions.filter(
            (transaction) => {
              if (!transaction.date) {
                return false;
              }

              return (
                dateKey(
                  transaction.date
                ) === key
              );
            }
          );

        const spending =
          dayTransactions
            .filter(
              (transaction) =>
                transaction.type ===
                'expense'
            )
            .reduce(
              (sum, transaction) =>
                sum +
                Number(
                  transaction.amount || 0
                ),
              0
            );

        const dayScore =
          Math.min(
            Math.round(
              (focusMinutes / 120) *
                70 +
                (completedActivities >
                0
                  ? 30
                  : 0)
            ),
            100
          );

        return {
          label,
          date: key,
          focusMinutes,
          focusHours: Number(
            (
              focusMinutes / 60
            ).toFixed(1)
          ),
          sessions:
            daySessions.length,
          activities:
            dayActivities.length,
          completedActivities,
          productivityScore:
            dayScore,
          spending,
        };
      }
    );
  }, [
    sessions,
    activities,
    transactions,
  ]);

  // -------------------------------------------------------------------------
  // Weekly study total
  // -------------------------------------------------------------------------

  const weeklyStudyMinutes =
    useMemo(
      () =>
        dailyData.reduce(
          (sum, day) =>
            sum +
            day.focusMinutes,
          0
        ),
      [dailyData]
    );

  const weeklyStudyHours =
    Number(
      (
        weeklyStudyMinutes / 60
      ).toFixed(1)
    );

  // -------------------------------------------------------------------------
  // Average study
  // -------------------------------------------------------------------------

  const averageDailyStudy =
    Number(
      (
        weeklyStudyMinutes / 7 / 60
      ).toFixed(1)
    );

  // -------------------------------------------------------------------------
  // Best study day
  // -------------------------------------------------------------------------

  const bestStudyDay =
    dailyData.length
      ? dailyData.reduce(
          (best, current) =>
            current.focusMinutes >
            best.focusMinutes
              ? current
              : best
        )
      : null;

  // -------------------------------------------------------------------------
  // Subject breakdown
  // -------------------------------------------------------------------------

  const subjectData =
    useMemo(() => {
      const map = {};

      sessions.forEach(
        (session) => {
          if (
            !session.completed ||
            session.sessionType !==
              'focus'
          ) {
            return;
          }

          const subject =
            session.subject ||
            'Other';

          if (!map[subject]) {
            map[subject] = 0;
          }

          map[subject] += Number(
            session.duration || 0
          );
        }
      );

      return Object.entries(map)
        .map(
          ([subject, minutes]) => ({
            subject,
            minutes,
            hours: Number(
              (
                minutes / 60
              ).toFixed(1)
            ),
          })
        )
        .sort(
          (a, b) =>
            b.minutes - a.minutes
        );
    }, [sessions]);

  // -------------------------------------------------------------------------
  // Total spending for displayed week
  // -------------------------------------------------------------------------

  const weeklySpending =
    useMemo(
      () =>
        dailyData.reduce(
          (sum, day) =>
            sum + day.spending,
          0
        ),
      [dailyData]
    );

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="card h-32 animate-pulse bg-zinc-50 dark:bg-zinc-900"
              />
            )
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card h-80 animate-pulse bg-zinc-50 dark:bg-zinc-900" />
          <div className="card h-80 animate-pulse bg-zinc-50 dark:bg-zinc-900" />
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error
  // -------------------------------------------------------------------------

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() =>
            navigate('/dashboard')
          }
          className="btn-secondary"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-red-600">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">

      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              navigate('/dashboard')
            }
            className="btn-ghost p-2"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Productivity Analytics
            </h1>

            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Understand your study habits, focus sessions and productivity.
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2 rounded-lg bg-sage-600/10 px-3 py-2 text-xs font-medium text-sage-600 dark:text-sage-400">
          <CalendarDays size={15} />
          Weekly overview
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Stats */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        <StatCard
          icon={Clock3}
          label="Weekly Study"
          value={`${weeklyStudyHours}h`}
          sub={`Goal: ${
            summary?.weeklyStudyGoal ||
            20
          }h`}
        />

        <StatCard
          icon={TrendingUp}
          label="Daily Average"
          value={`${averageDailyStudy}h`}
          sub="Across the last 7 days"
          iconClass="text-amber-600"
          bgClass="bg-amber-500/10"
        />

        <StatCard
          icon={Target}
          label="Productivity Score"
          value={`${
            summary?.productivityScore ||
            0
          }/100`}
          sub={`Focus: ${
            summary?.focusScore || 0
          }`}
          iconClass="text-indigo-600"
          bgClass="bg-indigo-500/10"
        />

        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${
            summary?.currentStreak || 0
          } days`}
          sub={`Longest: ${
            summary?.longestStreak || 0
          } days`}
          iconClass="text-purple-600"
          bgClass="bg-purple-500/10"
        />

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Study Time + Weekly Productivity */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Study Time */}

        <div className="card p-5">

          <div className="mb-5 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Clock3
                size={18}
                className="text-sage-600 dark:text-sage-400"
              />

              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Study Time
                </h2>

                <p className="text-xs text-zinc-500">
                  Focus hours by day
                </p>
              </div>

            </div>

            {bestStudyDay && (
              <span className="text-xs font-medium text-sage-600 dark:text-sage-400">
                Best: {bestStudyDay.label}
              </span>
            )}

          </div>

          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={dailyData}
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
                    fontSize: 11,
                    fill: '#71717a',
                  }}
                  tickFormatter={(value) =>
                    `${value}h`
                  }
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                />

                <Bar
                  dataKey="focusHours"
                  name="Study hours"
                  fill="#548a62"
                  radius={[
                    5,
                    5,
                    0,
                    0,
                  ]}
                  maxBarSize={42}
                />
              </BarChart>
            </ResponsiveContainer>

          </div>

        </div>

        {/* Weekly Productivity */}

        <div className="card p-5">

          <div className="mb-5 flex items-center gap-2">

            <TrendingUp
              size={18}
              className="text-amber-600 dark:text-amber-400"
            />

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Weekly Productivity
              </h2>

              <p className="text-xs text-zinc-500">
                Daily productivity trend
              </p>
            </div>

          </div>

          <div className="h-72">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={dailyData}
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
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fontSize: 11,
                    fill: '#71717a',
                  }}
                />

                <Tooltip
                  content={
                    <ChartTooltip />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="productivityScore"
                  name="Productivity"
                  stroke="#dc8d20"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Finance vs Study */}
      {/* ------------------------------------------------------------------ */}

      <div className="card p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-2">

            <BarChart3
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Finance vs Study
              </h2>

              <p className="text-xs text-zinc-500">
                Compare your daily study time with spending
              </p>
            </div>

          </div>

          <div className="text-xs text-zinc-500">
            Weekly spending:{' '}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {formatCurrency(
                weeklySpending
              )}
            </span>
          </div>

        </div>

        <div className="h-80">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart
              data={dailyData}
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
                yAxisId="hours"
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: '#71717a',
                }}
                tickFormatter={(value) =>
                  `${value}h`
                }
              />

              <YAxis
                yAxisId="money"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{
                  fontSize: 11,
                  fill: '#71717a',
                }}
                tickFormatter={(value) =>
                  `₹${value}`
                }
              />

              <Tooltip
                content={
                  <ChartTooltip />
                }
              />

              <Legend />

              <Bar
                yAxisId="money"
                dataKey="spending"
                name="Spending"
                fill="#e6a638"
                radius={[
                  4,
                  4,
                  0,
                  0,
                ]}
                maxBarSize={30}
              />

              <Line
                yAxisId="hours"
                type="monotone"
                dataKey="focusHours"
                name="Study hours"
                stroke="#548a62"
                strokeWidth={3}
                dot={{
                  r: 4,
                }}
              />

            </ComposedChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subject breakdown + weekly goal */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Subject breakdown */}

        <div className="card p-5">

          <div className="mb-4 flex items-center gap-2">

            <Brain
              size={18}
              className="text-sage-600 dark:text-sage-400"
            />

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Study by Subject
              </h2>

              <p className="text-xs text-zinc-500">
                Where your focus time goes
              </p>
            </div>

          </div>

          {subjectData.length === 0 ? (

            <div className="flex h-64 items-center justify-center text-sm text-zinc-400">
              No completed focus sessions yet.
            </div>

          ) : (

            <div className="h-64">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={subjectData}
                    dataKey="minutes"
                    nameKey="subject"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >

                    {subjectData.map(
                      (
                        entry,
                        index
                      ) => (
                        <Cell
                          key={
                            entry.subject
                          }
                          fill={
                            SUBJECT_COLORS[
                              index %
                                SUBJECT_COLORS.length
                            ]
                          }
                        />
                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => [
                      formatHours(
                        value
                      ),
                      name,
                    ]}
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>

            </div>

          )}

        </div>

        {/* Weekly Goal */}

        <div className="card p-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Target
                size={19}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Weekly Study Goal
              </h2>

              <p className="text-xs text-zinc-500">
                Your progress this week
              </p>
            </div>

          </div>

          <div className="mt-8 flex items-end justify-between">

            <div>
              <p className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {weeklyStudyHours}h
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                of{' '}
                {summary?.weeklyStudyGoal ||
                  20}{' '}
                hours
              </p>
            </div>

            <p className="text-lg font-semibold text-sage-600 dark:text-sage-400">
              {summary?.weeklyGoalPercentage ||
                0}
              %
            </p>

          </div>

          <div className="mt-4 h-4 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

            <div
              className="h-full rounded-full bg-sage-600 transition-all duration-1000"
              style={{
                width: `${Math.min(
                  summary?.weeklyGoalPercentage ||
                    0,
                  100
                )}%`,
              }}
            />

          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">

              <p className="text-xs text-zinc-500">
                Active days
              </p>

              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {summary?.weeklyActiveDays ||
                  0}
                /7
              </p>

            </div>

            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/60">

              <p className="text-xs text-zinc-500">
                Focus score
              </p>

              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {summary?.focusScore ||
                  0}
                /100
              </p>

            </div>

          </div>

          <div className="mt-4 rounded-xl bg-sage-600/10 p-4">

            <p className="text-xs leading-5 text-sage-700 dark:text-sage-300">

              {summary?.weeklyGoalPercentage >=
              100
                ? '🎉 Weekly study goal completed! Great work.'
                : summary?.weeklyGoalPercentage >=
                  80
                ? '🔥 You are almost at your weekly study goal.'
                : '📚 Keep studying consistently to reach your weekly goal.'}

            </p>

          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Daily breakdown */}
      {/* ------------------------------------------------------------------ */}

      <div className="card overflow-hidden">

        <div className="border-b border-zinc-100 p-5 dark:border-zinc-800">

          <div className="flex items-center gap-2">

            <CalendarDays
              size={18}
              className="text-zinc-600 dark:text-zinc-300"
            />

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Daily Breakdown
              </h2>

              <p className="text-xs text-zinc-500">
                Detailed activity for this week
              </p>
            </div>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead>
              <tr className="border-b border-zinc-100 text-left dark:border-zinc-800">

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Day
                </th>

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Study
                </th>

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Sessions
                </th>

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Activities
                </th>

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Spending
                </th>

                <th className="px-5 py-3 text-xs font-medium text-zinc-500">
                  Productivity
                </th>

              </tr>
            </thead>

            <tbody>

              {dailyData.map(
                (day) => (
                  <tr
                    key={day.date}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                  >

                    <td className="px-5 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {day.label}
                    </td>

                    <td className="px-5 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {day.focusHours}h
                    </td>

                    <td className="px-5 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {day.sessions}
                    </td>

                    <td className="px-5 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {day.completedActivities}/
                      {day.activities}
                    </td>

                    <td className="px-5 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {formatCurrency(
                        day.spending
                      )}
                    </td>

                    <td className="px-5 py-3">

                      <div className="flex items-center gap-2">

                        <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

                          <div
                            className="h-full rounded-full bg-sage-600"
                            style={{
                              width: `${day.productivityScore}%`,
                            }}
                          />

                        </div>

                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {
                            day.productivityScore
                          }
                        </span>

                      </div>

                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottom summary */}
      {/* ------------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl bg-sage-600/10 p-4">

          <div className="flex items-center gap-2">

            <Clock3
              size={16}
              className="text-sage-600 dark:text-sage-400"
            />

            <p className="text-xs font-medium text-zinc-500">
              Total focus sessions
            </p>

          </div>

          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {dailyData.reduce(
              (sum, day) =>
                sum + day.sessions,
              0
            )}
          </p>

        </div>

        <div className="rounded-xl bg-amber-500/10 p-4">

          <div className="flex items-center gap-2">

            <Wallet
              size={16}
              className="text-amber-600 dark:text-amber-400"
            />

            <p className="text-xs font-medium text-zinc-500">
              Weekly spending
            </p>

          </div>

          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatCurrency(
              weeklySpending
            )}
          </p>

        </div>

        <div className="rounded-xl bg-purple-500/10 p-4">

          <div className="flex items-center gap-2">

            <Flame
              size={16}
              className="text-purple-600 dark:text-purple-400"
            />

            <p className="text-xs font-medium text-zinc-500">
              Best study day
            </p>

          </div>

          <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {bestStudyDay?.label ||
              'No data'}
          </p>

        </div>

      </div>

    </div>
  );
};

export default ProductivityAnalytics;