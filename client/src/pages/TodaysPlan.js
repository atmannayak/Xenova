import React, { useEffect, useMemo, useState } from 'react';

import {
  Plus,
  Check,
  Trash2,
  Pencil,
  X,
  ListChecks,
  Clock,
  BookOpen,
} from 'lucide-react';

import { useToast } from '../context/ToastContext';

const STORAGE_KEY = 'xenovaTodaysPlan';

const TodaysPlan = () => {
  const toast = useToast();

  const [tasks, setTasks] = useState([]);

  const [taskText, setTaskText] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingPriority, setEditingPriority] = useState('Medium');

  const today = new Date();

  const dateKey = today.toISOString().slice(0, 10);

  const formattedDate = today.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // ============================================================
  // LOAD TODAY'S PLAN
  // ============================================================

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        setTasks([]);
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setTasks([]);
        return;
      }

      // Keep only today's tasks.
      const todaysTasks = parsed.filter(
        (task) => task.date === dateKey
      );

      setTasks(todaysTasks);
    } catch (error) {
      console.error('Could not load today plan:', error);
      setTasks([]);
    }
  }, [dateKey]);

  // ============================================================
  // SAVE TASKS
  // ============================================================

  const saveTasks = (updatedTasks) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedTasks)
      );

      setTasks(updatedTasks);
    } catch (error) {
      console.error('Could not save today plan:', error);

      toast.error('Could not save today’s plan');
    }
  };

  // ============================================================
  // ADD TASK
  // ============================================================

  const addTask = (event) => {
    event.preventDefault();

    const cleanText = taskText.trim();

    if (!cleanText) {
      toast.error('Please enter a task');
      return;
    }

    const newTask = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

      date: dateKey,

      text: cleanText,

      time: taskTime,

      priority: taskPriority,

      completed: false,

      createdAt: new Date().toISOString(),
    };

    saveTasks([
      ...tasks,
      newTask,
    ]);

    setTaskText('');
    setTaskTime('');
    setTaskPriority('Medium');

    toast.success('Task added to today’s plan');
  };

  // ============================================================
  // TOGGLE TASK
  // ============================================================

  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
          }
        : task
    );

    saveTasks(updatedTasks);
  };

  // ============================================================
  // DELETE TASK
  // ============================================================

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(
      (task) => task.id !== id
    );

    saveTasks(updatedTasks);

    toast.success('Task removed');
  };

  // ============================================================
  // START EDITING
  // ============================================================

  const startEditing = (task) => {
    setEditingId(task.id);
    setEditingText(task.text);
    setEditingTime(task.time || '');
    setEditingPriority(task.priority || 'Medium');
  };

  // ============================================================
  // CANCEL EDITING
  // ============================================================

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
    setEditingTime('');
    setEditingPriority('Medium');
  };

  // ============================================================
  // SAVE EDIT
  // ============================================================

  const saveEdit = (id) => {
    const cleanText = editingText.trim();

    if (!cleanText) {
      toast.error('Task cannot be empty');
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            text: cleanText,
            time: editingTime,
            priority: editingPriority,
          }
        : task
    );

    saveTasks(updatedTasks);

    cancelEditing();

    toast.success('Task updated');
  };

  // ============================================================
  // CLEAR COMPLETED
  // ============================================================

  const clearCompleted = () => {
    const updatedTasks = tasks.filter(
      (task) => !task.completed
    );

    saveTasks(updatedTasks);

    toast.success('Completed tasks cleared');
  };

  // ============================================================
  // PROGRESS
  // ============================================================

  const completedCount = useMemo(
    () =>
      tasks.filter(
        (task) => task.completed
      ).length,
    [tasks]
  );

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedCount / tasks.length) * 100
        );

  // ============================================================
  // PRIORITY STYLE
  // ============================================================

  const priorityClass = (priority) => {
    if (priority === 'High') {
      return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400';
    }

    if (priority === 'Low') {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
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

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-600/10 text-sage-600 dark:text-sage-400">
            <ListChecks size={20} />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Today&apos;s Plan
            </h1>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Organize the tasks you want to complete today.
            </p>
          </div>

        </div>

        <p className="mt-3 text-xs text-zinc-400">
          {formattedDate}
        </p>
      </div>

      {/* PROGRESS */}

      <section className="card p-5">

        <div className="mb-3 flex items-center justify-between">

          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Today&apos;s progress
            </p>

            <p className="text-xs text-zinc-500">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </div>

          <span className="text-sm font-semibold text-sage-600 dark:text-sage-400">
            {progress}%
          </span>

        </div>

        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">

          <div
            className="h-full rounded-full bg-sage-600 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </section>

      {/* ADD TASK */}

      <section className="card p-5">

        <div className="mb-4 flex items-center gap-2">

          <Plus
            size={18}
            className="text-sage-600 dark:text-sage-400"
          />

          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Add a task
            </h2>

            <p className="text-xs text-zinc-500">
              Add something you want to finish today.
            </p>
          </div>

        </div>

        <form
          onSubmit={addTask}
          className="grid gap-3 lg:grid-cols-[1fr_150px_130px_auto]"
        >

          <input
            value={taskText}
            onChange={(event) =>
              setTaskText(event.target.value)
            }
            className="input"
            placeholder="e.g. Complete DBMS assignment"
          />

          <div className="relative">

            <Clock
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="time"
              value={taskTime}
              onChange={(event) =>
                setTaskTime(event.target.value)
              }
              className="input pl-9"
            />

          </div>

          <select
            value={taskPriority}
            onChange={(event) =>
              setTaskPriority(event.target.value)
            }
            className="input"
          >
            <option value="High">
              High priority
            </option>

            <option value="Medium">
              Medium priority
            </option>

            <option value="Low">
              Low priority
            </option>
          </select>

          <button
            type="submit"
            className="btn-primary"
          >
            <Plus size={16} />
            Add task
          </button>

        </form>

      </section>

      {/* TASK LIST */}

      <section className="card p-5">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">

            <BookOpen
              size={18}
              className="text-amber-500"
            />

            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Today&apos;s tasks
              </h2>

              <p className="text-xs text-zinc-500">
                Complete each task as you go.
              </p>
            </div>

          </div>

          {completedCount > 0 && (
            <button
              type="button"
              onClick={clearCompleted}
              className="text-xs font-medium text-zinc-500 hover:text-red-500"
            >
              Clear completed
            </button>
          )}

        </div>

        {tasks.length === 0 ? (

          <div className="rounded-lg border border-dashed border-zinc-200 px-5 py-10 text-center dark:border-zinc-800">

            <ListChecks
              size={28}
              className="mx-auto mb-3 text-zinc-300 dark:text-zinc-600"
            />

            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              No tasks planned for today
            </p>

            <p className="mt-1 text-xs text-zinc-400">
              Add your first task above and start planning your day.
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {tasks.map((task) => (

              <div
                key={task.id}
                className={`rounded-lg border p-3 transition ${
                  task.completed
                    ? 'border-zinc-100 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >

                {editingId === task.id ? (

                  <div className="space-y-3">

                    <input
                      value={editingText}
                      onChange={(event) =>
                        setEditingText(event.target.value)
                      }
                      className="input"
                    />

                    <div className="flex flex-wrap gap-2">

                      <input
                        type="time"
                        value={editingTime}
                        onChange={(event) =>
                          setEditingTime(event.target.value)
                        }
                        className="input w-auto"
                      />

                      <select
                        value={editingPriority}
                        onChange={(event) =>
                          setEditingPriority(event.target.value)
                        }
                        className="input w-auto"
                      >
                        <option value="High">
                          High
                        </option>

                        <option value="Medium">
                          Medium
                        </option>

                        <option value="Low">
                          Low
                        </option>
                      </select>

                      <button
                        type="button"
                        onClick={() =>
                          saveEdit(task.id)
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

                  <div className="flex items-start gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        toggleTask(task.id)
                      }
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                        task.completed
                          ? 'border-sage-600 bg-sage-600 text-white'
                          : 'border-zinc-300 text-transparent hover:border-sage-500 dark:border-zinc-600'
                      }`}
                    >
                      <Check size={14} />
                    </button>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-sm font-medium ${
                          task.completed
                            ? 'text-zinc-400 line-through'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {task.text}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">

                        {task.time && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                            <Clock size={12} />
                            {task.time}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-1">

                      <button
                        type="button"
                        onClick={() =>
                          startEditing(task)
                        }
                        className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Edit task"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        className="rounded-md p-2 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title="Delete task"
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

export default TodaysPlan;
