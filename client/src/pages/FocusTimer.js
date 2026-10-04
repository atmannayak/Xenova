import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  BrainCircuit,
  Loader2,
  Trophy,
} from 'lucide-react';

import {
  productivityApi,
  getPomodoroSettings,
} from '../services/api';

import { useToast } from '../context/ToastContext';

// ---------------------------------------------------------------------------
// DEFAULT POMODORO SETTINGS
// ---------------------------------------------------------------------------

const DEFAULT_POMODORO_SETTINGS = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

// ---------------------------------------------------------------------------
// MODE LABELS
// ---------------------------------------------------------------------------

const MODE_LABELS = {
  focus: 'Focus session',
  short_break: 'Short break',
  long_break: 'Long break',
};

// ---------------------------------------------------------------------------
// SUBJECTS
// ---------------------------------------------------------------------------

const SUBJECTS = [
  'ADA',
  'DBMS',
  'AI/ML',
  'Computer Networks',
  'Operating Systems',
  'Software Engineering',
  'Mathematics',
  'Other',
];

// ---------------------------------------------------------------------------
// PROGRESS RING
// ---------------------------------------------------------------------------

const RADIUS = 110;

const CIRCUMFERENCE =
  2 * Math.PI * RADIUS;

// ---------------------------------------------------------------------------
// FORMAT TIME
// ---------------------------------------------------------------------------

const formatTime = (totalSeconds) => {
  const safeSeconds = Math.max(
    0,
    Number(totalSeconds) || 0
  );

  const minutes = Math.floor(
    safeSeconds / 60
  )
    .toString()
    .padStart(2, '0');

  const seconds = Math.floor(
    safeSeconds % 60
  )
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
};

// ---------------------------------------------------------------------------
// LOAD POMODORO SETTINGS
// ---------------------------------------------------------------------------

const readPomodoroSettings = () => {
  try {
    const saved = getPomodoroSettings();

    return {
      focus:
        Number(saved?.focus) ||
        DEFAULT_POMODORO_SETTINGS.focus,

      shortBreak:
        Number(saved?.shortBreak) ||
        DEFAULT_POMODORO_SETTINGS.shortBreak,

      longBreak:
        Number(saved?.longBreak) ||
        DEFAULT_POMODORO_SETTINGS.longBreak,
    };
  } catch (error) {
    console.error(
      'Could not load Pomodoro settings:',
      error
    );

    return {
      ...DEFAULT_POMODORO_SETTINGS,
    };
  }
};

// ---------------------------------------------------------------------------
// FOCUS TIMER
// ---------------------------------------------------------------------------

const FocusTimer = () => {
  const toast = useToast();

  // -------------------------------------------------------------------------
  // POMODORO SETTINGS
  // -------------------------------------------------------------------------

  const [pomodoro, setPomodoro] =
    useState(readPomodoroSettings);

  // -------------------------------------------------------------------------
  // TIMER DURATIONS
  // -------------------------------------------------------------------------

  const durations = useMemo(
    () => ({
      focus:
        pomodoro.focus * 60,

      short_break:
        pomodoro.shortBreak * 60,

      long_break:
        pomodoro.longBreak * 60,
    }),
    [
      pomodoro.focus,
      pomodoro.shortBreak,
      pomodoro.longBreak,
    ]
  );

  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------

  const [mode, setMode] =
    useState('focus');

  const [secondsLeft, setSecondsLeft] =
    useState(durations.focus);

  const [running, setRunning] =
    useState(false);

  const [sessions, setSessions] =
    useState([]);

  const [todaysMinutes, setTodaysMinutes] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [cyclesCompleted, setCyclesCompleted] =
    useState(0);

  const [subject, setSubject] =
    useState('Other');

  // -------------------------------------------------------------------------
  // REFS
  // -------------------------------------------------------------------------

  const startTimeRef =
    useRef(null);

  const intervalRef =
    useRef(null);

  const completionHandledRef =
    useRef(false);

  // -------------------------------------------------------------------------
  // LOAD SESSIONS
  // -------------------------------------------------------------------------

  const loadSessions = useCallback(
    async () => {
      try {
        const { data } =
          await productivityApi.getFocusSessions();

        const loadedSessions =
          Array.isArray(data?.sessions)
            ? data.sessions
            : [];

        setSessions(
          loadedSessions
        );

        const todayKey =
          new Date()
            .toISOString()
            .slice(0, 10);

        const minutes =
          loadedSessions
            .filter(
              (session) =>
                session.sessionType ===
                  'focus' &&
                session.completed &&
                session.startTime &&
                session.startTime.slice(
                  0,
                  10
                ) === todayKey
            )
            .reduce(
              (total, session) =>
                total +
                Number(
                  session.duration || 0
                ),
              0
            );

        setTodaysMinutes(
          minutes
        );
      } catch (error) {
        console.error(
          'Could not load focus history:',
          error
        );

        toast.error(
          error.response?.data?.message ||
            'Could not load your focus history'
        );
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // -------------------------------------------------------------------------
  // LISTEN FOR POMODORO SETTINGS CHANGES
  // -------------------------------------------------------------------------
  //
  // This allows Settings.jsx to update the timer immediately.
  // -------------------------------------------------------------------------

  useEffect(() => {
    const handlePomodoroUpdate = () => {
      const updated =
        readPomodoroSettings();

      setPomodoro(updated);
    };

    window.addEventListener(
      'pomodoroSettingsChanged',
      handlePomodoroUpdate
    );

    return () => {
      window.removeEventListener(
        'pomodoroSettingsChanged',
        handlePomodoroUpdate
      );
    };
  }, []);

  // -------------------------------------------------------------------------
  // UPDATE TIMER WHEN SETTINGS CHANGE
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (running) {
      return;
    }

    setSecondsLeft(
      durations[mode]
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pomodoro.focus,
    pomodoro.shortBreak,
    pomodoro.longBreak,
    mode,
    running,
  ]);

  // -------------------------------------------------------------------------
  // SAVE COMPLETED SESSION
  // -------------------------------------------------------------------------

  const saveSession = useCallback(
    async (
      completedMode,
      durationMinutes
    ) => {
      try {
        if (
          durationMinutes < 1
        ) {
          toast.error(
            'Session duration must be at least 1 minute.'
          );

          return {
            success: false,
            data: null,
          };
        }

        const startTime =
          startTimeRef.current ||
          new Date().toISOString();

        const endTime =
          new Date().toISOString();

        const { data } =
          await productivityApi.createFocusSession({
            duration:
              durationMinutes,

            subject:
              completedMode ===
              'focus'
                ? subject
                : 'Other',

            sessionType:
              completedMode,

            startTime,

            endTime,

            completed: true,
          });

        if (data?.session) {
          setSessions(
            (previous) => [
              data.session,
              ...previous,
            ]
          );
        }

        if (
          completedMode ===
          'focus'
        ) {
          setTodaysMinutes(
            (previous) =>
              previous +
              durationMinutes
          );
        }

        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error(
          'Failed to save focus session:',
          error
        );

        toast.error(
          error.response?.data?.message ||
            'Could not save your focus session'
        );

        return {
          success: false,
          data: null,
        };
      }
    },
    [subject, toast]
  );

  // -------------------------------------------------------------------------
  // HANDLE COMPLETION
  // -------------------------------------------------------------------------

  const handleModeComplete =
    useCallback(async () => {
      if (
        completionHandledRef.current
      ) {
        return;
      }

      completionHandledRef.current =
        true;

      const completedMode =
        mode;

      const completedSubject =
        subject;

      const durationMinutes =
        durations[completedMode] / 60;

      const result =
        await saveSession(
          completedMode,
          durationMinutes
        );

      if (!result.success) {
        setRunning(false);

        setSecondsLeft(
          durations[completedMode]
        );

        startTimeRef.current =
          null;

        completionHandledRef.current =
          false;

        return;
      }

      const data =
        result.data;

      // ---------------------------------------------------------------------
      // FOCUS COMPLETION
      // ---------------------------------------------------------------------

      if (
        completedMode ===
        'focus'
      ) {
        toast.success(
          `${completedSubject} focus session completed!`
        );

        const xpAwarded =
          Number(
            data?.xpAwarded || 0
          );

        if (
          xpAwarded > 0
        ) {
          setTimeout(() => {
            toast.success(
              `⭐ +${xpAwarded} XP earned!`
            );
          }, 300);
        }

        const currentLevel =
          Number(
            data?.level || 0
          );

        const totalXP =
          Number(
            data?.totalXP || 0
          );

        if (
          currentLevel > 0 &&
          xpAwarded > 0
        ) {
          const previousXP =
            Math.max(
              totalXP -
                xpAwarded,
              0
            );

          const previousLevel =
            Math.floor(
              previousXP / 500
            ) + 1;

          if (
            currentLevel >
            previousLevel
          ) {
            setTimeout(() => {
              toast.success(
                `🎉 Level Up! You reached Level ${currentLevel}!`
              );
            }, 800);
          }
        }
      } else {
        toast.success(
          `${MODE_LABELS[completedMode]} complete!`
        );
      }

      // ---------------------------------------------------------------------
      // NEXT MODE
      // ---------------------------------------------------------------------

      if (
        completedMode ===
        'focus'
      ) {
        const nextCycles =
          cyclesCompleted + 1;

        setCyclesCompleted(
          nextCycles
        );

        const nextMode =
          nextCycles % 4 === 0
            ? 'long_break'
            : 'short_break';

        setMode(
          nextMode
        );

        setSecondsLeft(
          durations[nextMode]
        );
      } else {
        setMode('focus');

        setSecondsLeft(
          durations.focus
        );
      }

      setRunning(false);

      startTimeRef.current =
        null;

      completionHandledRef.current =
        false;
    }, [
      mode,
      subject,
      cyclesCompleted,
      saveSession,
      toast,
      durations,
    ]);

  // -------------------------------------------------------------------------
  // TIMER INTERVAL
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!running) {
      clearInterval(
        intervalRef.current
      );

      return;
    }

    if (
      !startTimeRef.current
    ) {
      startTimeRef.current =
        new Date().toISOString();
    }

    intervalRef.current =
      setInterval(() => {
        setSecondsLeft(
          (previous) => {
            if (
              previous <= 1
            ) {
              clearInterval(
                intervalRef.current
              );

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        intervalRef.current
      );
    };
  }, [running]);

  // -------------------------------------------------------------------------
  // TIMER COMPLETION DETECTION
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (
      secondsLeft === 0 &&
      running
    ) {
      handleModeComplete();
    }
  }, [
    secondsLeft,
    running,
    handleModeComplete,
  ]);

  // -------------------------------------------------------------------------
  // START / PAUSE
  // -------------------------------------------------------------------------

  const toggleRunning = () => {
    if (
      !running &&
      !startTimeRef.current
    ) {
      startTimeRef.current =
        new Date().toISOString();

      completionHandledRef.current =
        false;
    }

    setRunning(
      (previous) =>
        !previous
    );
  };

  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------

  const resetTimer = () => {
    clearInterval(
      intervalRef.current
    );

    setRunning(false);

    setSecondsLeft(
      durations[mode]
    );

    startTimeRef.current =
      null;

    completionHandledRef.current =
      false;
  };

  // -------------------------------------------------------------------------
  // SWITCH MODE
  // -------------------------------------------------------------------------

  const switchMode = (
    nextMode
  ) => {
    clearInterval(
      intervalRef.current
    );

    setRunning(false);

    setMode(
      nextMode
    );

    setSecondsLeft(
      durations[nextMode]
    );

    startTimeRef.current =
      null;

    completionHandledRef.current =
      false;
  };

  // -------------------------------------------------------------------------
  // PROGRESS
  // -------------------------------------------------------------------------

  const progress =
    durations[mode] > 0
      ? 1 -
        secondsLeft /
          durations[mode]
      : 0;

  const dashOffset =
    CIRCUMFERENCE *
    (1 - progress);

  const ringColor =
    mode === 'focus'
      ? '#dc8d20'
      : '#548a62';

  // -------------------------------------------------------------------------
  // UI
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Focus & Study
        </h1>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          A calm Pomodoro timer to protect your deep work
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* TIMER */}

        <div className="card flex flex-col items-center p-8 lg:col-span-2">

          {/* MODES */}

          <div className="mb-6 flex gap-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">

            {[
              'focus',
              'short_break',
              'long_break',
            ].map(
              (timerMode) => (
                <button
                  key={
                    timerMode
                  }
                  onClick={() =>
                    switchMode(
                      timerMode
                    )
                  }
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode ===
                    timerMode
                      ? 'bg-white text-zinc-900 shadow-subtle dark:bg-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {
                    MODE_LABELS[
                      timerMode
                    ]
                  }
                </button>
              )
            )}

          </div>

          {/* CURRENT DURATION */}

          <p className="mb-4 text-xs text-zinc-400">
            {mode ===
              'focus' &&
              `${pomodoro.focus} minute focus`}

            {mode ===
              'short_break' &&
              `${pomodoro.shortBreak} minute short break`}

            {mode ===
              'long_break' &&
              `${pomodoro.longBreak} minute long break`}
          </p>

          {/* SUBJECT */}

          {mode ===
            'focus' && (
            <div className="mb-6 w-full max-w-sm">

              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Select subject
              </label>

              <select
                value={
                  subject
                }
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                disabled={
                  running
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {SUBJECTS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

            </div>
          )}

          {/* TIMER CIRCLE */}

          <div className="relative flex h-72 w-72 items-center justify-center">

            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 240 240"
            >

              <circle
                cx="120"
                cy="120"
                r={RADIUS}
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-zinc-100 dark:text-zinc-800"
              />

              <circle
                cx="120"
                cy="120"
                r={RADIUS}
                stroke={
                  ringColor
                }
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={
                  CIRCUMFERENCE
                }
                strokeDashoffset={
                  dashOffset
                }
                style={{
                  transition:
                    'stroke-dashoffset 1s linear',
                }}
              />

            </svg>

            <div className="absolute flex flex-col items-center">

              {mode ===
              'focus' ? (
                <BrainCircuit
                  size={20}
                  className="mb-2 text-amber-500"
                />
              ) : (
                <Coffee
                  size={20}
                  className="mb-2 text-sage-500"
                />
              )}

              <span className="font-mono text-5xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatTime(
                  secondsLeft
                )}
              </span>

              <span className="mt-1 text-xs uppercase tracking-wide text-zinc-400">
                {
                  MODE_LABELS[
                    mode
                  ]
                }
              </span>

              {mode ===
                'focus' && (
                <span className="mt-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                  {subject}
                </span>
              )}

            </div>

          </div>

          {/* CONTROLS */}

          <div className="mt-8 flex gap-3">

            <button
              onClick={
                toggleRunning
              }
              className="btn-primary px-6"
            >
              {running ? (
                <Pause
                  size={16}
                />
              ) : (
                <Play
                  size={16}
                />
              )}

              {running
                ? 'Pause'
                : 'Start'}
            </button>

            <button
              onClick={
                resetTimer
              }
              className="btn-secondary px-6"
            >
              <RotateCcw
                size={16}
              />

              Reset
            </button>

          </div>

          {/* TODAY'S TOTAL */}

          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">

            Today's total focus time:{' '}

            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {(
                todaysMinutes /
                60
              ).toFixed(1)}
              h
            </span>

          </p>

        </div>

        {/* SESSION HISTORY */}

        <div className="card p-5">

          <div className="mb-3 flex items-center gap-2">

            <Trophy
              size={16}
              className="text-amber-500"
            />

            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Session history
            </h2>

          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={20}
                className="animate-spin text-zinc-400"
              />
            </div>
          ) : sessions.length ===
            0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">
              No sessions yet. Start your first focus block above.
            </p>
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto">

              {sessions.map(
                (session) => (
                  <li
                    key={
                      session._id
                    }
                    className="rounded-lg border border-zinc-100 px-3 py-2 dark:border-zinc-800"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        {session.sessionType ===
                        'focus' ? (
                          <BrainCircuit
                            size={14}
                            className="text-amber-500"
                          />
                        ) : (
                          <Coffee
                            size={14}
                            className="text-sage-500"
                          />
                        )}

                        <div>

                          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                            {
                              MODE_LABELS[
                                session.sessionType
                              ]
                            }
                          </p>

                          <p className="text-[11px] text-zinc-500">
                            {session.startTime
                              ? new Date(
                                  session.startTime
                                ).toLocaleString(
                                  [],
                                  {
                                    month:
                                      'short',
                                    day:
                                      'numeric',
                                    hour:
                                      '2-digit',
                                    minute:
                                      '2-digit',
                                  }
                                )
                              : 'Unknown time'}
                          </p>

                        </div>

                      </div>

                      <span className="text-xs font-semibold text-zinc-500">
                        {Number(
                          session.duration ||
                            0
                        ).toFixed(0)}
                        m
                      </span>

                    </div>

                    {session.sessionType ===
                      'focus' && (
                      <div className="mt-2">

                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          {session.subject ||
                            'Other'}
                        </span>

                      </div>
                    )}

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

export default FocusTimer;