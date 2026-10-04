import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Trophy,
  Lock,
  CheckCircle2,
  Sparkles,
  Target,
  Flame,
  Timer,
  Star,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

import { productivityApi } from '../services/api';

// ---------------------------------------------------------------------------
// Category configuration
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG = {
  focus: {
    label: 'Focus',
    icon: Timer,
    className:
      'bg-sage-600/10 text-sage-600 dark:text-sage-400',
  },

  streak: {
    label: 'Streak',
    icon: Flame,
    className:
      'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  },

  activity: {
    label: 'Activities',
    icon: Target,
    className:
      'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },

  study: {
    label: 'Study',
    icon: Star,
    className:
      'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },

  productivity: {
    label: 'Productivity',
    icon: Sparkles,
    className:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

// ---------------------------------------------------------------------------
// Requirement labels
// ---------------------------------------------------------------------------

const REQUIREMENT_LABELS = {
  focus_sessions: 'focus sessions',
  focus_minutes: 'focus minutes',
  completed_activities: 'completed activities',
  streak_days: 'day streak',
  productivity_score: 'productivity score',
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const formatRequirement = (achievement) => {
  const type =
    REQUIREMENT_LABELS[
      achievement.requirementType
    ] || achievement.requirementType;

  return `${achievement.requiredValue} ${type}`;
};

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  sub,
}) => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-600/10 text-sage-600 dark:text-sage-400">
        <Icon size={19} />
      </div>

      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {label}
        </p>

        <p className="mt-0.5 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {value}
        </p>

        {sub && (
          <p className="text-[11px] text-zinc-400">
            {sub}
          </p>
        )}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Achievement card
// ---------------------------------------------------------------------------

const AchievementCard = ({ achievement }) => {
  const category =
    CATEGORY_CONFIG[achievement.category] ||
    CATEGORY_CONFIG.productivity;

  const CategoryIcon = category.icon;

  const progress =
    Number(
      achievement.progressPercentage || 0
    );

  const unlocked =
    Boolean(achievement.unlocked);

  return (
    <div
      className={`card relative overflow-hidden p-5 transition-all duration-200 ${
        unlocked
          ? 'border-sage-200 dark:border-sage-900/50'
          : ''
      }`}
    >
      {/* Unlocked indicator */}

      {unlocked && (
        <div className="absolute right-4 top-4">
          <CheckCircle2
            size={19}
            className="text-sage-600 dark:text-sage-400"
          />
        </div>
      )}

      {/* Badge icon */}

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          unlocked
            ? 'bg-amber-500/10 text-amber-500'
            : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
        }`}
      >
        {unlocked ? (
          <Trophy size={27} />
        ) : (
          <Lock size={24} />
        )}
      </div>

      {/* Category */}

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${category.className}`}
        >
          <CategoryIcon size={11} />
          {category.label}
        </span>

        <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
          +{achievement.xpReward || 0} XP
        </span>
      </div>

      {/* Title */}

      <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {achievement.title}
      </h3>

      {/* Description */}

      <p className="mt-1 min-h-[40px] text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        {achievement.description}
      </p>

      {/* Progress */}

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            {unlocked
              ? 'Completed'
              : `${achievement.currentValue || 0} / ${achievement.requiredValue}`}
          </span>

          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              unlocked
                ? 'bg-sage-600'
                : 'bg-amber-500'
            }`}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      {/* Requirement */}

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-[11px] text-zinc-400">
          Requirement
        </span>

        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          {formatRequirement(achievement)}
        </span>
      </div>

      {/* Remaining / unlocked date */}

      {unlocked ? (
        <p className="mt-2 text-[11px] text-sage-600 dark:text-sage-400">
          Unlocked{' '}
          {achievement.unlockedAt
            ? new Date(
                achievement.unlockedAt
              ).toLocaleDateString('en-IN')
            : ''}
        </p>
      ) : (
        <p className="mt-2 text-[11px] text-zinc-400">
          {achievement.remaining > 0
            ? `${achievement.remaining} more ${
                REQUIREMENT_LABELS[
                  achievement.requirementType
                ] ||
                achievement.requirementType
              } needed`
            : 'Ready to unlock'}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Achievements page
// ---------------------------------------------------------------------------

const Achievements = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [error, setError] =
    useState('');

  // -------------------------------------------------------------------------
  // Load achievements
  // -------------------------------------------------------------------------

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError('');

      const response =
        await productivityApi.getAchievements();

      setData(response?.data || null);
    } catch (err) {
      console.error(
        'Failed to load achievements:',
        err
      );

      setError(
        err.response?.data?.message ||
          'Could not load achievements.'
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    loadAchievements();
  }, []);

  // -------------------------------------------------------------------------
  // Check achievements
  // -------------------------------------------------------------------------

  const handleCheckAchievements =
    async () => {
      try {
        setChecking(true);

        const response =
          await productivityApi.checkAchievements();

        const unlocked =
          response?.data?.unlocked || [];

        if (unlocked.length > 0) {
          alert(
            `Congratulations! You unlocked ${unlocked.length} new achievement${
              unlocked.length > 1
                ? 's'
                : ''
            } and earned ${
              response?.data?.xpAwarded || 0
            } XP!`
          );
        }

        await loadAchievements();
      } catch (err) {
        console.error(
          'Failed to check achievements:',
          err
        );

        alert(
          err.response?.data?.message ||
            'Could not check achievements.'
        );
      } finally {
        setChecking(false);
      }
    };

  // -------------------------------------------------------------------------
  // Achievement list
  // -------------------------------------------------------------------------

  const achievements =
    data?.achievements || [];

  const summary =
    data?.summary || {
      total: 0,
      unlocked: 0,
      locked: 0,
      completionPercentage: 0,
      totalPossibleXP: 0,
      earnedAchievementXP: 0,
    };

  const nextAchievement =
    data?.nextAchievement || null;

  // -------------------------------------------------------------------------
  // Group achievements by category
  // -------------------------------------------------------------------------

  const groupedAchievements =
    useMemo(() => {
      return achievements.reduce(
        (groups, achievement) => {
          const category =
            achievement.category ||
            'productivity';

          if (!groups[category]) {
            groups[category] = [];
          }

          groups[category].push(
            achievement
          );

          return groups;
        },
        {}
      );
    }, [achievements]);

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="card h-24 animate-pulse bg-zinc-50 dark:bg-zinc-900"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(
            (item) => (
              <div
                key={item}
                className="card h-72 animate-pulse bg-zinc-50 dark:bg-zinc-900"
              />
            )
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() =>
              navigate('/dashboard')
            }
            className="mb-3 flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft size={14} />
            Back to dashboard
          </button>

          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Achievements
          </h1>

          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Complete challenges, earn XP, and build your student legacy.
          </p>
        </div>

        <button
          onClick={handleCheckAchievements}
          disabled={checking}
          className="btn-primary"
        >
          <RefreshCw
            size={16}
            className={
              checking
                ? 'animate-spin'
                : ''
            }
          />

          {checking
            ? 'Checking...'
            : 'Check achievements'}
        </button>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Summary */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={Trophy}
          label="Achievements"
          value={summary.total}
          sub={`${summary.unlocked} unlocked`}
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Completion"
          value={`${summary.completionPercentage}%`}
          sub={`${summary.locked} remaining`}
        />

        <SummaryCard
          icon={Sparkles}
          label="Achievement XP"
          value={summary.earnedAchievementXP}
          sub={`of ${summary.totalPossibleXP} possible`}
        />

        <SummaryCard
          icon={Star}
          label="Badges unlocked"
          value={summary.unlocked}
          sub="Keep going!"
        />
      </div>

      {/* Overall progress */}

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Achievement progress
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Keep completing focus sessions, activities, and streaks.
            </p>
          </div>

          <span className="text-lg font-bold text-sage-600 dark:text-sage-400">
            {summary.completionPercentage}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-sage-600 transition-all duration-700"
            style={{
              width: `${summary.completionPercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Next achievement */}

      {nextAchievement && (
        <div className="card overflow-hidden border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Trophy size={27} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Next achievement
                </span>

                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  +{nextAchievement.xpReward || 0} XP
                </span>
              </div>

              <h2 className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {nextAchievement.title}
              </h2>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {nextAchievement.description}
              </p>

              <div className="mt-3">
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="text-zinc-500">
                    {nextAchievement.currentValue || 0}{' '}
                    /{' '}
                    {nextAchievement.requiredValue}
                  </span>

                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {nextAchievement.progressPercentage || 0}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/70 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-700"
                    style={{
                      width: `${
                        nextAchievement.progressPercentage ||
                        0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 text-center sm:text-right">
              <p className="text-xs text-zinc-500">
                Remaining
              </p>

              <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {nextAchievement.remaining}
              </p>

              <p className="text-[10px] text-zinc-400">
                {REQUIREMENT_LABELS[
                  nextAchievement.requirementType
                ] ||
                  nextAchievement.requirementType}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All achievements */}

      {Object.entries(
        groupedAchievements
      ).map(
        ([category, categoryAchievements]) => {
          const config =
            CATEGORY_CONFIG[category] ||
            CATEGORY_CONFIG.productivity;

          const CategoryIcon =
            config.icon;

          return (
            <section
              key={category}
              className="space-y-4"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.className}`}
                >
                  <CategoryIcon size={16} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-50">
                    {config.label} achievements
                  </h2>

                  <p className="text-xs text-zinc-500">
                    {categoryAchievements.filter(
                      (a) => a.unlocked
                    ).length}{' '}
                    of{' '}
                    {categoryAchievements.length}{' '}
                    unlocked
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {categoryAchievements.map(
                  (achievement) => (
                    <AchievementCard
                      key={
                        achievement._id
                      }
                      achievement={
                        achievement
                      }
                    />
                  )
                )}
              </div>
            </section>
          );
        }
      )}

      {/* No achievements */}

      {!achievements.length && (
        <div className="card p-10 text-center">
          <Trophy
            size={40}
            className="mx-auto text-zinc-300 dark:text-zinc-700"
          />

          <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            No achievements yet
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Achievement badges will appear here once they are configured.
          </p>
        </div>
      )}
    </div>
  );
};

export default Achievements;

