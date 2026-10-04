import axios from 'axios';

// =============================================================================
// API BASE URL
// =============================================================================

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  'http://localhost:5001/api';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const api = axios.create({
  baseURL: API_BASE_URL,

  withCredentials: true,

  headers: {
    'Content-Type':
      'application/json',
  },
});

// =============================================================================
// AUTH API
// =============================================================================

export const authApi = {
  register: (data) =>
    api.post(
      '/auth/register',
      data
    ),

  login: (data) =>
    api.post(
      '/auth/login',
      data
    ),

  logout: () =>
    api.post(
      '/auth/logout'
    ),

  getMe: () =>
    api.get(
      '/auth/me'
    ),

  updateMe: (data) =>
    api.put(
      '/auth/me',
      data
    ),
};

// =============================================================================
// FINANCE API
// =============================================================================

export const financeApi = {
  getTransactions: (
    params
  ) =>
    api.get(
      '/finance/transactions',
      {
        params,
      }
    ),

  createTransaction: (
    data
  ) =>
    api.post(
      '/finance/transactions',
      data
    ),

  updateTransaction: (
    id,
    data
  ) =>
    api.put(
      `/finance/transactions/${id}`,
      data
    ),

  deleteTransaction: (
    id
  ) =>
    api.delete(
      `/finance/transactions/${id}`
    ),

  getSummary: () =>
    api.get(
      '/finance/summary'
    ),

  updateBudget: (
    data
  ) =>
    api.put(
      '/finance/budget',
      data
    ),
};

// =============================================================================
// PRODUCTIVITY API
// =============================================================================

export const productivityApi = {
  // ---------------------------------------------------------------------------
  // FOCUS SESSIONS
  // ---------------------------------------------------------------------------

  getFocusSessions: () =>
    api.get(
      '/productivity/focus-sessions'
    ),

  createFocusSession: (
    data
  ) =>
    api.post(
      '/productivity/focus-sessions',
      data
    ),

  // ---------------------------------------------------------------------------
  // ACTIVITIES
  // ---------------------------------------------------------------------------

  getActivities: (
    params
  ) =>
    api.get(
      '/productivity/activities',
      {
        params,
      }
    ),

  createActivity: (
    formData
  ) =>
    api.post(
      '/productivity/activities',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    ),

  updateActivity: (
    id,
    formData
  ) =>
    api.put(
      `/productivity/activities/${id}`,
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    ),

  deleteActivity: (
    id
  ) =>
    api.delete(
      `/productivity/activities/${id}`
    ),

  // ---------------------------------------------------------------------------
  // PRODUCTIVITY SUMMARY
  // ---------------------------------------------------------------------------

  getSummary: () =>
    api.get(
      '/productivity/summary'
    ),

  // ---------------------------------------------------------------------------
  // WEEKLY STUDY GOAL
  // ---------------------------------------------------------------------------

  updateWeeklyGoal: (
    data
  ) =>
    api.put(
      '/productivity/weekly-goal',
      data
    ),

  // ---------------------------------------------------------------------------
  // ACHIEVEMENTS
  // ---------------------------------------------------------------------------

  getAchievements: () =>
    api.get(
      '/productivity/achievements'
    ),

  getMyAchievements: () =>
    api.get(
      '/productivity/achievements/my'
    ),

  checkAchievements: () =>
    api.post(
      '/productivity/achievements/check'
    ),
};

// =============================================================================
// PLANNING API
// =============================================================================

export const planningApi = {
  // ---------------------------------------------------------------------------
  // DAILY GOALS
  // ---------------------------------------------------------------------------

  getDailyGoals: () =>
    api.get(
      '/planning/daily-goals'
    ),

  createDailyGoal: (
    data
  ) =>
    api.post(
      '/planning/daily-goals',
      data
    ),

  updateDailyGoal: (
    id,
    data
  ) =>
    api.put(
      `/planning/daily-goals/${id}`,
      data
    ),

  deleteDailyGoal: (
    id
  ) =>
    api.delete(
      `/planning/daily-goals/${id}`
    ),

  resetDailyGoals: () =>
    api.post(
      '/planning/daily-goals/reset'
    ),

  // ---------------------------------------------------------------------------
  // TODAY'S PLAN
  // ---------------------------------------------------------------------------

  getTodaysPlan: (
    date
  ) =>
    api.get(
      '/planning/todays-plan',
      {
        params: {
          date,
        },
      }
    ),

  createTodaysPlan: (
    data
  ) =>
    api.post(
      '/planning/todays-plan',
      data
    ),

  updateTodaysPlan: (
    id,
    data
  ) =>
    api.put(
      `/planning/todays-plan/${id}`,
      data
    ),

  deleteTodaysPlan: (
    id
  ) =>
    api.delete(
      `/planning/todays-plan/${id}`
    ),
};

// =============================================================================
// FILE URL
// =============================================================================

export const getFileUrl = (
  relativePath
) => {
  if (!relativePath) {
    return null;
  }

  const origin =
    API_BASE_URL.replace(
      /\/api\/?$/,
      ''
    );

  return `${origin}${relativePath}`;
};

// =============================================================================
// POMODORO SETTINGS
// =============================================================================

export const DEFAULT_POMODORO_SETTINGS = {
  focus: 60,
  shortBreak: 5,
  longBreak: 15,
};

export const getPomodoroSettings = () => {
  try {
    const saved =
      localStorage.getItem(
        'xenovaPomodoroSettings'
      );

    if (!saved) {
      return {
        ...DEFAULT_POMODORO_SETTINGS,
      };
    }

    const parsed =
      JSON.parse(saved);

    return {
      focus:
        Number(parsed.focus) ||
        DEFAULT_POMODORO_SETTINGS.focus,

      shortBreak:
        Number(parsed.shortBreak) ||
        DEFAULT_POMODORO_SETTINGS.shortBreak,

      longBreak:
        Number(parsed.longBreak) ||
        DEFAULT_POMODORO_SETTINGS.longBreak,
    };
  } catch (error) {
    return {
      ...DEFAULT_POMODORO_SETTINGS,
    };
  }
};

export const savePomodoroSettings = (
  settings
) => {
  const cleaned = {
    focus:
      Number(settings.focus),

    shortBreak:
      Number(settings.shortBreak),

    longBreak:
      Number(settings.longBreak),
  };

  localStorage.setItem(
    'xenovaPomodoroSettings',
    JSON.stringify(cleaned)
  );

  window.dispatchEvent(
    new CustomEvent(
      'xenova:pomodoro-settings-changed',
      {
        detail: cleaned,
      }
    )
  );

  return cleaned;
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default api;