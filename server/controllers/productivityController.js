const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const User = require('../models/User');
const FocusSession = require('../models/FocusSession');
const Activity = require('../models/Activity');

// IMPORTANT:
// productivityController.js and achievementController.js
// are in the same controllers folder.
const {
  checkAchievements,
} = require('./achievementController');

// =============================================================================
// HELPERS
// =============================================================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

// =============================================================================
// CERTIFICATE FILE PATH
// =============================================================================

const getCertificatePath = (file) => {
  if (!file) {
    return null;
  }

  return `/uploads/${file.filename}`;
};

// =============================================================================
// START OF WEEK
// Monday = first day of week
// =============================================================================

const getStartOfWeek = (date = new Date()) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const difference = day === 0 ? 6 : day - 1;

  result.setDate(result.getDate() - difference);

  return result;
};

// =============================================================================
// END OF WEEK
// =============================================================================

const getEndOfWeek = (date = new Date()) => {
  const result = getStartOfWeek(date);

  result.setDate(result.getDate() + 6);

  result.setHours(23, 59, 59, 999);

  return result;
};

// =============================================================================
// MINUTES TO HOURS
// =============================================================================

const minutesToHours = (minutes) => {
  return Number((Number(minutes || 0) / 60).toFixed(1));
};

// =============================================================================
// FOCUS SESSIONS
// =============================================================================

// GET /api/productivity/focus-sessions

const getFocusSessions = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const sessions = await FocusSession.find({
    user: userId,
  })
    .sort({
      createdAt: -1,
    })
    .lean();

  res.status(200).json(sessions);
});

// =============================================================================
// CREATE FOCUS SESSION
// =============================================================================

// POST /api/productivity/focus-sessions

const createFocusSession = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const {
    duration,
    durationMinutes,
    minutes,
    subject,
    completed,
    type,
    sessionType,
    date,
  } = req.body;

  const sessionMinutes = Number(
    durationMinutes ??
      duration ??
      minutes ??
      0
  );

  if (
    !Number.isFinite(sessionMinutes) ||
    sessionMinutes <= 0
  ) {
    res.status(400);
    throw new Error(
      'Please provide a valid session duration.'
    );
  }

  const isCompleted =
    completed === undefined
      ? true
      : completed === true ||
        completed === 'true';

  let sessionDate = new Date();

  if (date) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error(
        'Please provide a valid session date.'
      );
    }

    sessionDate = parsedDate;
  }

  const session = await FocusSession.create({
    user: userId,

    duration: sessionMinutes,

    durationMinutes: sessionMinutes,

    subject:
      typeof subject === 'string'
        ? subject.trim()
        : '',

    type:
      type ||
      sessionType ||
      'focus',

    completed: isCompleted,

    date: sessionDate,
  });

  // ---------------------------------------------------------------------------
  // Reward completed focus session
  // ---------------------------------------------------------------------------

  if (isCompleted) {
    const user = await User.findById(userId);

    if (user) {
      // 25 XP for completed focus session
      await user.addXP(25);

      // Update daily streak
      await user.updateStreak(
        session.date || new Date()
      );

      // Check achievements
      try {
        await checkAchievements(userId);
      } catch (achievementError) {
        console.error(
          'Achievement check failed:',
          achievementError
        );
      }
    }
  }

  res.status(201).json({
    message:
      'Focus session created successfully.',

    session,
  });
});

// =============================================================================
// ACTIVITIES
// =============================================================================

// GET /api/productivity/activities

const getActivities = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const {
    status,
    activityType,
    search,
  } = req.query;

  const query = {
    user: userId,
  };

  // ---------------------------------------------------------------------------
  // Status filter
  // ---------------------------------------------------------------------------

  if (
    status &&
    status !== 'all'
  ) {
    query.status = status;
  }

  // ---------------------------------------------------------------------------
  // Activity type filter
  // ---------------------------------------------------------------------------

  if (
    activityType &&
    activityType !== 'all'
  ) {
    query.activityType = activityType;
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  if (
    search &&
    search.trim()
  ) {
    query.$or = [
      {
        title: {
          $regex: search.trim(),
          $options: 'i',
        },
      },
      {
        description: {
          $regex: search.trim(),
          $options: 'i',
        },
      },
    ];
  }

  const activities = await Activity.find(query)
    .sort({
      date: 1,
      createdAt: -1,
    })
    .lean();

  res.status(200).json(activities);
});

// =============================================================================
// CREATE ACTIVITY
// =============================================================================

// POST /api/productivity/activities

const createActivity = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const {
    title,
    description,
    activityType,
    type,
    date,
    status,
    completed,
  } = req.body;

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  if (
    !title ||
    typeof title !== 'string' ||
    !title.trim()
  ) {
    res.status(400);
    throw new Error(
      'Activity title is required.'
    );
  }

  const activityStatus =
    status ||
    (
      completed === true ||
      completed === 'true'
        ? 'completed'
        : 'pending'
    );

  let activityDate = new Date();

  if (date) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error(
        'Please provide a valid activity date.'
      );
    }

    activityDate = parsedDate;
  }

  const certificatePath =
    getCertificatePath(req.file);

  // ---------------------------------------------------------------------------
  // Create activity
  // ---------------------------------------------------------------------------

  const activity = await Activity.create({
    user: userId,

    title: title.trim(),

    description:
      typeof description === 'string'
        ? description.trim()
        : '',

    activityType:
      activityType ||
      type ||
      'Other',

    date: activityDate,

    status: activityStatus,

    completed:
      activityStatus === 'completed',

    certificatePath,
  });

  // ---------------------------------------------------------------------------
  // Reward completed activity
  // ---------------------------------------------------------------------------

  if (
    activityStatus === 'completed'
  ) {
    const user = await User.findById(userId);

    if (user) {
      // 50 XP for completed activity
      await user.addXP(50);

      // Update streak
      await user.updateStreak(
        activity.date || new Date()
      );

      // Check achievements
      try {
        await checkAchievements(userId);
      } catch (achievementError) {
        console.error(
          'Achievement check failed:',
          achievementError
        );
      }
    }
  }

  res.status(201).json({
    message:
      'Activity created successfully.',

    activity,
  });
});

// =============================================================================
// UPDATE ACTIVITY
// =============================================================================

// PUT /api/productivity/activities/:id

const updateActivity = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const { id } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    res.status(400);
    throw new Error(
      'Invalid activity ID.'
    );
  }

  const activity =
    await Activity.findOne({
      _id: id,
      user: userId,
    });

  if (!activity) {
    res.status(404);
    throw new Error(
      'Activity not found.'
    );
  }

  const wasCompleted =
    activity.status === 'completed' ||
    activity.completed === true;

  // ---------------------------------------------------------------------------
  // Update title
  // ---------------------------------------------------------------------------

  if (
    req.body.title !== undefined
  ) {
    if (
      !req.body.title ||
      typeof req.body.title !== 'string' ||
      !req.body.title.trim()
    ) {
      res.status(400);
      throw new Error(
        'Activity title cannot be empty.'
      );
    }

    activity.title =
      req.body.title.trim();
  }

  // ---------------------------------------------------------------------------
  // Update description
  // ---------------------------------------------------------------------------

  if (
    req.body.description !== undefined
  ) {
    activity.description =
      typeof req.body.description === 'string'
        ? req.body.description.trim()
        : '';
  }

  // ---------------------------------------------------------------------------
  // Update activity type
  // ---------------------------------------------------------------------------

  if (
    req.body.activityType !== undefined
  ) {
    activity.activityType =
      req.body.activityType;
  } else if (
    req.body.type !== undefined
  ) {
    activity.activityType =
      req.body.type;
  }

  // ---------------------------------------------------------------------------
  // Update date
  // ---------------------------------------------------------------------------

  if (
    req.body.date !== undefined
  ) {
    const parsedDate =
      new Date(req.body.date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      res.status(400);
      throw new Error(
        'Please provide a valid activity date.'
      );
    }

    activity.date = parsedDate;
  }

  // ---------------------------------------------------------------------------
  // Determine completion status
  // ---------------------------------------------------------------------------

  let newStatus =
    activity.status;

  if (
    req.body.status !== undefined
  ) {
    newStatus =
      req.body.status;
  }

  if (
    req.body.completed !== undefined
  ) {
    const completed =
      req.body.completed === true ||
      req.body.completed === 'true';

    newStatus =
      completed
        ? 'completed'
        : 'pending';
  }

  activity.status =
    newStatus;

  activity.completed =
    newStatus === 'completed';

  // ---------------------------------------------------------------------------
  // Certificate
  // ---------------------------------------------------------------------------

  if (req.file) {
    activity.certificatePath =
      getCertificatePath(req.file);
  }

  await activity.save();

  const isCompleted =
    activity.status === 'completed' ||
    activity.completed === true;

  // ---------------------------------------------------------------------------
  // Reward only when changing from incomplete to completed
  // ---------------------------------------------------------------------------

  if (
    !wasCompleted &&
    isCompleted
  ) {
    const user =
      await User.findById(userId);

    if (user) {
      await user.addXP(50);

      await user.updateStreak(
        activity.date || new Date()
      );

      try {
        await checkAchievements(userId);
      } catch (achievementError) {
        console.error(
          'Achievement check failed:',
          achievementError
        );
      }
    }
  }

  res.status(200).json({
    message:
      'Activity updated successfully.',

    activity,
  });
});

// =============================================================================
// DELETE ACTIVITY
// =============================================================================

// DELETE /api/productivity/activities/:id

const deleteActivity = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401);
    throw new Error('User authentication required.');
  }

  const { id } = req.params;

  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    res.status(400);
    throw new Error(
      'Invalid activity ID.'
    );
  }

  const activity =
    await Activity.findOne({
      _id: id,
      user: userId,
    });

  if (!activity) {
    res.status(404);
    throw new Error(
      'Activity not found.'
    );
  }

  await Activity.deleteOne({
    _id: id,
    user: userId,
  });

  res.status(200).json({
    message:
      'Activity deleted successfully.',
  });
});

// =============================================================================
// UPDATE WEEKLY STUDY GOAL
// =============================================================================

// PUT /api/productivity/weekly-goal

const updateWeeklyGoal =
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401);
      throw new Error(
        'User authentication required.'
      );
    }

    const goal = Number(
      req.body.weeklyStudyGoal ??
      req.body.goal
    );

    if (
      !Number.isFinite(goal) ||
      goal < 1 ||
      goal > 168
    ) {
      res.status(400);
      throw new Error(
        'Weekly study goal must be between 1 and 168 hours.'
      );
    }

    const user =
      await User.findById(userId);

    if (!user) {
      res.status(404);
      throw new Error(
        'User not found.'
      );
    }

    user.weeklyStudyGoal =
      goal;

    await user.save();

    res.status(200).json({
      message:
        'Weekly study goal updated successfully.',

      weeklyStudyGoal:
        user.weeklyStudyGoal,
    });
  });

// =============================================================================
// PRODUCTIVITY SUMMARY
// =============================================================================

// GET /api/productivity/summary

const getProductivitySummary =
  asyncHandler(async (req, res) => {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401);
      throw new Error(
        'User authentication required.'
      );
    }

    const user =
      await User.findById(userId).lean();

    if (!user) {
      res.status(404);
      throw new Error(
        'User not found.'
      );
    }

    const now = new Date();

    const startOfWeek =
      getStartOfWeek(now);

    const endOfWeek =
      getEndOfWeek(now);

    // -------------------------------------------------------------------------
    // TODAY
    // -------------------------------------------------------------------------

    const startOfToday =
      new Date(now);

    startOfToday.setHours(
      0,
      0,
      0,
      0
    );

    const endOfToday =
      new Date(now);

    endOfToday.setHours(
      23,
      59,
      59,
      999
    );

    // -------------------------------------------------------------------------
    // WEEKLY FOCUS SESSIONS
    // -------------------------------------------------------------------------

    const weeklySessions =
      await FocusSession.find({
        user: userId,

        date: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },

        completed: true,
      }).lean();

    // -------------------------------------------------------------------------
    // TODAY'S SESSIONS
    // -------------------------------------------------------------------------

    const todaysSessions =
      weeklySessions.filter(
        (session) => {
          const sessionDate =
            new Date(
              session.date ||
              session.createdAt
            );

          return (
            sessionDate >=
              startOfToday &&
            sessionDate <=
              endOfToday
          );
        }
      );

    // -------------------------------------------------------------------------
    // WEEKLY FOCUS MINUTES
    // -------------------------------------------------------------------------

    const weeklyFocusMinutes =
      weeklySessions.reduce(
        (total, session) => {
          return (
            total +
            Number(
              session.durationMinutes ??
              session.duration ??
              session.minutes ??
              0
            )
          );
        },
        0
      );

    // -------------------------------------------------------------------------
    // TODAY'S FOCUS MINUTES
    // -------------------------------------------------------------------------

    const todaysFocusMinutes =
      todaysSessions.reduce(
        (total, session) => {
          return (
            total +
            Number(
              session.durationMinutes ??
              session.duration ??
              session.minutes ??
              0
            )
          );
        },
        0
      );

    // -------------------------------------------------------------------------
    // WEEKLY ACTIVITIES
    // -------------------------------------------------------------------------

    const weeklyActivities =
      await Activity.find({
        user: userId,

        date: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      }).lean();

    // -------------------------------------------------------------------------
    // COMPLETED ACTIVITIES
    // -------------------------------------------------------------------------

    const completedActivities =
      weeklyActivities.filter(
        (activity) =>
          activity.status ===
            'completed' ||
          activity.completed === true
      );

    // -------------------------------------------------------------------------
    // UPCOMING ACTIVITIES
    // -------------------------------------------------------------------------

    const upcomingActivities =
      await Activity.find({
        user: userId,

        date: {
          $gte: now,
        },

        status: {
          $ne: 'completed',
        },
      })
        .sort({
          date: 1,
        })
        .limit(5)
        .lean();

    // -------------------------------------------------------------------------
    // WEEKLY ACTIVE DAYS
    // -------------------------------------------------------------------------

    const activeDateKeys =
      new Set();

    weeklySessions.forEach(
      (session) => {
        const date =
          new Date(
            session.date ||
            session.createdAt
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          activeDateKeys.add(
            date
              .toISOString()
              .slice(0, 10)
          );
        }
      }
    );

    completedActivities.forEach(
      (activity) => {
        const date =
          new Date(
            activity.date ||
            activity.createdAt
          );

        if (
          !Number.isNaN(
            date.getTime()
          )
        ) {
          activeDateKeys.add(
            date
              .toISOString()
              .slice(0, 10)
          );
        }
      }
    );

    const weeklyActiveDays =
      activeDateKeys.size;

    // -------------------------------------------------------------------------
    // WEEKLY GOAL
    // -------------------------------------------------------------------------

    const weeklyStudyGoal =
      Number(
        user.weeklyStudyGoal || 20
      );

    const weeklyFocusHours =
      minutesToHours(
        weeklyFocusMinutes
      );

    const weeklyGoalPercentage =
      weeklyStudyGoal > 0
        ? Math.min(
            Math.round(
              (
                weeklyFocusHours /
                weeklyStudyGoal
              ) * 100
            ),
            100
          )
        : 0;

    // -------------------------------------------------------------------------
    // TODAY'S COMPLETED SESSIONS
    // -------------------------------------------------------------------------

    const todaysCompletedSessions =
      todaysSessions.length;

    // -------------------------------------------------------------------------
    // TODAY'S COMPLETED ACTIVITIES
    // -------------------------------------------------------------------------

    const todaysCompletedActivities =
      completedActivities.filter(
        (activity) => {
          const date =
            new Date(
              activity.date ||
              activity.createdAt
            );

          return (
            date >= startOfToday &&
            date <= endOfToday
          );
        }
      ).length;

    // -------------------------------------------------------------------------
    // PRODUCTIVITY SCORE
    // -------------------------------------------------------------------------

    // Focus = maximum 40
    const focusScore =
      Math.min(
        Math.round(
          (
            weeklyFocusHours /
            Math.max(
              weeklyStudyGoal,
              1
            )
          ) * 40
        ),
        40
      );

    // Activities = maximum 30
    const activityScore =
      Math.min(
        completedActivities.length * 5,
        30
      );

    // Consistency = maximum 30
    const consistencyScore =
      Math.min(
        Math.round(
          (
            weeklyActiveDays /
            7
          ) * 30
        ),
        30
      );

    const productivityScore =
      Math.min(
        focusScore +
          activityScore +
          consistencyScore,
        100
      );

    // -------------------------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------------------------

    res.status(200).json({
      weeklyFocusMinutes,

      weeklyFocusHours,

      todaysFocusMinutes,

      todaysCompletedSessions,

      todaysCompletedActivities,

      weeklyActiveDays,

      weeklyStudyGoal,

      weeklyGoalPercentage,

      completedActivities:
        completedActivities.length,

      totalActivities:
        weeklyActivities.length,

      productivityScore,

      focusScore,

      activityCompletionScore:
        activityScore,

      consistencyScore,

      totalXP:
        Number(
          user.totalXP || 0
        ),

      level:
        Number(
          user.level || 1
        ),

      currentStreak:
        Number(
          user.currentStreak || 0
        ),

      longestStreak:
        Number(
          user.longestStreak || 0
        ),

      upcomingActivities,
    });
  });

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  getFocusSessions,
  createFocusSession,

  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,

  updateWeeklyGoal,

  getProductivitySummary,
};

