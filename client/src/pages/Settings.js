import React, {
  useEffect,
  useState,
} from 'react';

import {
  Moon,
  Sun,
  CalendarDays,
  Target,
  ListChecks,
  Timer,
  Save,
  User,
} from 'lucide-react';

import {
  authApi,
  DEFAULT_POMODORO_SETTINGS,
  getPomodoroSettings,
  savePomodoroSettings,
} from '../services/api';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { user, updateUser } =
    useAuth();

  const toast = useToast();

  // ===========================================================================
  // DARK MODE
  // ===========================================================================

  const [darkMode, setDarkMode] =
    useState(
      document.documentElement.classList.contains(
        'dark'
      )
    );

  // ===========================================================================
  // USER SETTINGS
  // ===========================================================================

  const [name, setName] =
    useState(user?.name || '');

  const [weeklyGoal, setWeeklyGoal] =
    useState(
      user?.weeklyStudyGoal || 20
    );

  const [savingProfile, setSavingProfile] =
    useState(false);

  // ===========================================================================
  // POMODORO SETTINGS
  // ===========================================================================

  const [pomodoro, setPomodoro] =
    useState(
      getPomodoroSettings()
    );

  const [savingPomodoro, setSavingPomodoro] =
    useState(false);

  // ===========================================================================
  // LOAD USER VALUES
  // ===========================================================================

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(
      user.name || ''
    );

    setWeeklyGoal(
      user.weeklyStudyGoal || 20
    );
  }, [user]);

  // ===========================================================================
  // DARK MODE
  // ===========================================================================

  const toggleDarkMode = () => {
    const next =
      !darkMode;

    setDarkMode(next);

    if (next) {
      document.documentElement.classList.add(
        'dark'
      );

      localStorage.setItem(
        'xenovaDarkMode',
        'true'
      );
    } else {
      document.documentElement.classList.remove(
        'dark'
      );

      localStorage.setItem(
        'xenovaDarkMode',
        'false'
      );
    }
  };

  // ===========================================================================
  // PROFILE SAVE
  // ===========================================================================

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error(
        'Name cannot be empty'
      );

      return;
    }

    const goal =
      Number(weeklyGoal);

    if (
      !Number.isFinite(goal) ||
      goal < 1 ||
      goal > 168
    ) {
      toast.error(
        'Weekly goal must be between 1 and 168 hours'
      );

      return;
    }

    setSavingProfile(true);

    try {
      const { data } =
        await authApi.updateMe({
          name: name.trim(),
          weeklyStudyGoal: goal,
        });

      updateUser(
        data.user
      );

      toast.success(
        'Profile settings saved'
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not save profile settings'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ===========================================================================
  // POMODORO CHANGE
  // ===========================================================================

  const handlePomodoroChange = (
    field,
    value
  ) => {
    setPomodoro(
      (prev) => ({
        ...prev,
        [field]:
          value,
      })
    );
  };

  // ===========================================================================
  // SAVE POMODORO
  // ===========================================================================

  const savePomodoro = () => {
    const focus =
      Number(pomodoro.focus);

    const shortBreak =
      Number(
        pomodoro.shortBreak
      );

    const longBreak =
      Number(
        pomodoro.longBreak
      );

    if (
      !Number.isFinite(focus) ||
      focus < 1 ||
      focus > 180
    ) {
      toast.error(
        'Focus time must be between 1 and 180 minutes'
      );

      return;
    }

    if (
      !Number.isFinite(shortBreak) ||
      shortBreak < 1 ||
      shortBreak > 60
    ) {
      toast.error(
        'Short break must be between 1 and 60 minutes'
      );

      return;
    }

    if (
      !Number.isFinite(longBreak) ||
      longBreak < 1 ||
      longBreak > 120
    ) {
      toast.error(
        'Long break must be between 1 and 120 minutes'
      );

      return;
    }

    setSavingPomodoro(true);

    try {
      const saved =
        savePomodoroSettings({
          focus,
          shortBreak,
          longBreak,
        });

      setPomodoro(
        saved
      );

      toast.success(
        'Pomodoro settings saved'
      );
    } catch (error) {
      toast.error(
        'Could not save Pomodoro settings'
      );
    } finally {
      setSavingPomodoro(false);
    }
  };

  // ===========================================================================
  // RESET POMODORO
  // ===========================================================================

  const resetPomodoro = () => {
    setPomodoro({
      ...DEFAULT_POMODORO_SETTINGS,
    });

    savePomodoroSettings(
      DEFAULT_POMODORO_SETTINGS
    );

    toast.success(
      'Pomodoro settings reset'
    );
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="space-y-6">

      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Customize your Xenova experience
        </p>
      </div>

      {/* ================================================================== */}
      {/* APPEARANCE */}
      {/* ================================================================== */}

      <section className="card p-5">

        <div className="mb-4 flex items-center gap-2">

          {darkMode ? (
            <Moon
              size={18}
              className="text-sage-600"
            />
          ) : (
            <Sun
              size={18}
              className="text-amber-500"
            />
          )}

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Appearance
            </h2>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Choose how Xenova looks
            </p>
          </div>

        </div>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800"
        >

          <div className="flex items-center gap-3">

            {darkMode ? (
              <Moon
                size={17}
                className="text-sage-500"
              />
            ) : (
              <Sun
                size={17}
                className="text-amber-500"
              />
            )}

            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Dark Mode
              </p>

              <p className="text-xs text-zinc-500">
                {darkMode
                  ? 'Dark theme is enabled'
                  : 'Light theme is enabled'}
              </p>
            </div>

          </div>

          <div
            className={`relative h-6 w-11 rounded-full transition ${
              darkMode
                ? 'bg-sage-600'
                : 'bg-zinc-300'
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                darkMode
                  ? 'translate-x-6'
                  : 'translate-x-1'
              }`}
            />
          </div>

        </button>

      </section>

      {/* ================================================================== */}
      {/* PROFILE */}
      {/* ================================================================== */}

      <section className="card p-5">

        <div className="mb-5 flex items-center gap-2">

          <User
            size={18}
            className="text-sage-600 dark:text-sage-400"
          />

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Profile & Study Goal
            </h2>

            <p className="text-xs text-zinc-500">
              Update your basic information
            </p>
          </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div>
            <label className="label">
              Name
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              className="input"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="label">
              Email
            </label>

            <input
              value={user?.email || ''}
              disabled
              className="input cursor-not-allowed opacity-60"
            />
          </div>

        </div>

        <div className="mt-4 max-w-sm">

          <label className="label">
            Weekly Study Goal
          </label>

          <div className="relative">

            <Target
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="number"
              min="1"
              max="168"
              value={weeklyGoal}
              onChange={(e) =>
                setWeeklyGoal(
                  e.target.value
                )
              }
              className="input pl-9"
            />

          </div>

          <p className="mt-1 text-xs text-zinc-400">
            Enter your target study hours per week.
          </p>

        </div>

        <div className="mt-5">

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="btn-primary"
          >
            <Save size={16} />

            {savingProfile
              ? 'Saving...'
              : 'Save profile'}
          </button>

        </div>

      </section>

      {/* ================================================================== */}
      {/* POMODORO */}
      {/* ================================================================== */}

      <section className="card p-5">

        <div className="mb-5 flex items-center gap-2">

          <Timer
            size={18}
            className="text-amber-500"
          />

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Pomodoro Timer
            </h2>

            <p className="text-xs text-zinc-500">
              Customize your focus and break durations
            </p>
          </div>

        </div>

        <div className="grid gap-4 sm:grid-cols-3">

          {/* Focus */}

          <div>
            <label className="label">
              Focus time
            </label>

            <div className="relative">

              <input
                type="number"
                min="1"
                max="180"
                value={pomodoro.focus}
                onChange={(e) =>
                  handlePomodoroChange(
                    'focus',
                    e.target.value
                  )
                }
                className="input pr-16"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                minutes
              </span>

            </div>
          </div>

          {/* Short Break */}

          <div>
            <label className="label">
              Short break
            </label>

            <div className="relative">

              <input
                type="number"
                min="1"
                max="60"
                value={
                  pomodoro.shortBreak
                }
                onChange={(e) =>
                  handlePomodoroChange(
                    'shortBreak',
                    e.target.value
                  )
                }
                className="input pr-16"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                minutes
              </span>

            </div>
          </div>

          {/* Long Break */}

          <div>
            <label className="label">
              Long break
            </label>

            <div className="relative">

              <input
                type="number"
                min="1"
                max="120"
                value={
                  pomodoro.longBreak
                }
                onChange={(e) =>
                  handlePomodoroChange(
                    'longBreak',
                    e.target.value
                  )
                }
                className="input pr-16"
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                minutes
              </span>

            </div>
          </div>

        </div>

        <div className="mt-5 flex flex-wrap gap-2">

          <button
            onClick={savePomodoro}
            disabled={savingPomodoro}
            className="btn-primary"
          >
            <Save size={16} />

            {savingPomodoro
              ? 'Saving...'
              : 'Save Pomodoro settings'}
          </button>

          <button
            onClick={resetPomodoro}
            className="btn-secondary"
          >
            Reset to default
          </button>

        </div>

      </section>

      {/* ================================================================== */}
      {/* QUICK FEATURES */}
      {/* ================================================================== */}

      <section className="card p-5">

        <div className="mb-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Productivity
          </h2>

          <p className="text-xs text-zinc-500">
            Quick access to your planning tools
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">

            <CalendarDays
              size={18}
              className="mb-2 text-sage-600 dark:text-sage-400"
            />

            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Student Calendar
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Plan classes, deadlines and important events.
            </p>

          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">

            <Target
              size={18}
              className="mb-2 text-amber-500"
            />

            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Daily Goals
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Keep track of what you want to accomplish.
            </p>

          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">

            <ListChecks
              size={18}
              className="mb-2 text-sage-600 dark:text-sage-400"
            />

            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Today's Plan
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Organize your study sessions and tasks.
            </p>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Settings;

