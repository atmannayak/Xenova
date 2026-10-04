import React, { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Check,
  Trash2,
  Pencil,
  X,
  Target,
  Flame,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'xenovaDailyGoals';

const DailyGoals = () => {
  const toast = useToast();

  const [goals, setGoals] = useState([]);

  const [goalText, setGoalText] = useState('');
  const [goalCategory, setGoalCategory] = useState('Study');

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingCategory, setEditingCategory] =
    useState('Study');

  const todayKey = new Date()
    .toISOString()
    .slice(0, 10);

  // ============================================================
  // LOAD GOALS
  // ============================================================

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setGoals([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setGoals([]);
        return;
      }

      setGoals(parsed);
    } catch (error) {
      console.error('Could not load daily goals:', error);
      setGoals([]);
    }
  }, []);

  // ============================================================
  // SAVE GOALS
  // ============================================================

  const saveGoals = (updatedGoals) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedGoals)
      );

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Could not save daily goals:', error);

      toast.error('Could not save daily goals');
    }
  };

  // ============================================================
  // ADD GOAL
  // ============================================================

  const addGoal = (event) => {
    event.preventDefault();

    const cleanText = goalText.trim();

    if (!cleanText) {
      toast.error('Please enter a daily goal');
      return;
    }

    const newGoal = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

      text: cleanText,

      category: goalCategory,

      completedToday: false,

      lastCompletedDate: null,

      streak: 0,

      createdAt: new Date().toISOString(),
    };

    saveGoals([
      ...goals,
      newGoal,
    ]);

    setGoalText('');
    setGoalCategory('Study');

    toast.success('Daily goal added');
  };

  // ============================================================
  // TOGGLE GOAL
  // ============================================================

  const toggleGoal = (id) => {
    const updatedGoals = goals.map((goal) => {
      if (goal.id !== id) {
        return goal;
      }

      // Uncheck today's goal
      if (goal.completedToday) {
        return {
          ...goal,
          completedToday: false,
        };
      }

      // Complete today's goal
      return {
        ...goal,
        completedToday: true,
        lastCompletedDate: todayKey,
        streak: Number(goal.streak || 0) + 1,
      };
    });

    saveGoals(updatedGoals);
  };

  // ============================================================
  // DELETE GOAL
  // ============================================================

  const deleteGoal = (id) => {
    const updatedGoals = goals.filter(
      (goal) => goal.id !== id
    );

    saveGoals(updatedGoals);

    toast.success('Daily goal removed');
  };

  // ============================================================
  // EDIT
  // ============================================================

  const startEditing = (goal) => {
    setEditingId(goal.id);
    setEditingText(goal.text);
    setEditingCategory(goal.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    setEditingCategory('Study');
  };

  const saveEdit = (id) => {
    const cleanText = editingText.trim();

    if (!cleanText) {
      toast.error('Goal cannot be empty');
      return;
    }

    const updatedGoals = goals.map((goal) =>
      goal.id === id
        ? {
            ...goal,
            text: cleanText,
            category: editingCategory,
          }
        : goal
    );

    saveGoals(updatedGoals);

    cancelEditing();

    toast.success('Daily goal updated');
  };

  // ============================================================
  // RESET TODAY
  // ============================================================

  const resetToday = () => {
    const updatedGoals = goals.map((goal) => ({
      ...goal,
      completedToday: false,
    }));

    saveGoals(updatedGoals);

    toast.success('Today’s goals reset');
  };

  // ============================================================
  // PROGRESS
  // ============================================================

  const completedCount = useMemo(
    () =>
      goals.filter(
        (goal) => goal.completedToday
      ).length,
    [goals]
  );

  const progress =
    goals.length === 0
      ? 0
      : Math.round(
          (completedCount / goals.length) * 100
        );

  // ============================================================
  // CATEGORY STYLE
  // ============================================================

  const categoryClass = (category) => {
    if (category === 'Health') {
      return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400';
    }

    if (category === 'Personal') {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
    }

    if (category === 'Fitness') {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
    }

    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <div className="flex items-center gap-2">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Target size={20} />
          </div>

          <div>

            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Daily Goals
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Build consistent habits and stay on track.
            </p>

          </div>

        </div>

      </div>

      {/* PROGRESS */}

      <section className="card p-5">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Today&apos;s goal progress
            </p>

            <p className="text-xs text-zinc-500">
              {completedCount} of {goals.length} goals completed
            </p>

          </div>

          <span className="text-sm font-semibold text-amber-500">
            {progress}%
          </span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </section>

      {/* ADD GOAL */}

      <section className="card p-5">

        <div className="mb-4 flex items-center gap-2">

          <Plus
            size={18}
            className="text-amber-500"
          />

          <div>

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Add a daily goal
            </h2>

            <p className="text-xs text-zinc-500">
              Add a habit or goal you want to maintain regularly.
            </p>

          </div>

        </div>

        <form
          onSubmit={addGoal}
          className="grid gap-3 sm:grid-cols-[1fr_170px_auto]"
        >

          <input
            value={goalText}
            onChange={(event) =>
              setGoalText(event.target.value)
            }
            className="input"
            placeholder="e.g. Study for 2 hours"
          />

          <select
            value={goalCategory}
            onChange={(event) =>
              setGoalCategory(event.target.value)
            }
            className="input"
          >
            <option value="Study">
              Study
            </option>

            <option value="Health">
              Health
            </option>

            <option value="Fitness">
              Fitness
            </option>

            <option value="Personal">
              Personal
            </option>
          </select>

          <button
            type="submit"
            className="btn-primary"
          >
            <Plus size={16} />
            Add goal
          </button>

        </form>

      </section>

      {/* GOAL LIST */}

      <section className="card p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">

            <Flame
              size={18}
              className="text-orange-500"
            />

            <div>

              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Your daily goals
              </h2>

              <p className="text-xs text-zinc-500">
                These goals stay here every day.
              </p>

            </div>

          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={resetToday}
              className="text-xs font-medium text-zinc-500 hover:text-amber-500"
            >
              Reset today
            </button>
          )}

        </div>

        {goals.length === 0 ? (

          <div className="rounded-lg border border-dashed border-zinc-200 px-5 py-10 text-center dark:border-zinc-800">

            <Target
              size={28}
              className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600"
            />

            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No daily goals yet
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Add a goal above to start building your routine.
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {goals.map((goal) => (

              <div
                key={goal.id}
                className={`rounded-lg border p-3 transition ${
                  goal.completedToday
                    ? 'border-amber-200 bg-amber-50/40 dark:border-amber-950/50 dark:bg-amber-950/10'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >

                {editingId === goal.id ? (

                  <div className="space-y-3">

                    <input
                      value={editingText}
                      onChange={(event) =>
                        setEditingText(event.target.value)
                      }
                      className="input"
                    />

                    <div className="flex flex-wrap gap-2">

                      <select
                        value={editingCategory}
                        onChange={(event) =>
                          setEditingCategory(event.target.value)
                        }
                        className="input w-auto"
                      >
                        <option value="Study">
                          Study
                        </option>

                        <option value="Health">
                          Health
                        </option>

                        <option value="Fitness">
                          Fitness
                        </option>

                        <option value="Personal">
                          Personal
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          saveEdit(goal.id)
                        }
                        className="btn-primary"
                      >
                        <Check size={15} />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="btn-secondary"
                      >
                        <X size={15} />
                        Cancel
                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="flex items-center gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        toggleGoal(goal.id)
                      }
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                        goal.completedToday
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-zinc-300 text-transparent hover:border-amber-500 dark:border-zinc-600'
                      }`}
                    >
                      <Check size={14} />
                    </button>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-sm font-medium ${
                          goal.completedToday
                            ? 'text-zinc-400 line-through'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {goal.text}
                      </p>

                      <div className="mt-1 flex items-center gap-2">

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryClass(
                            goal.category
                          )}`}
                        >
                          {goal.category}
                        </span>

                        {goal.streak > 0 && (
                          <span className="flex items-center gap-1 text-[11px] text-orange-500">
                            <Flame size={12} />
                            {goal.streak} day streak
                          </span>
                        )}

                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(goal)
                        }
                        className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Edit goal"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteGoal(goal.id)
                        }
                        className="rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title="Delete goal"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>

                  </div>

                )}

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
};

export default DailyGoals;

