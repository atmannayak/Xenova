const FocusSession = require('../models/FocusSession');
const Activity = require('../models/Activity');
const User = require('../models/User');

const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// ============================================================================
// PRODUCTIVITY STATISTICS
// ============================================================================

const calculateProductivityStatistics = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    return {
      todaysFocusMinutes: 0,
      todaysCompletedSessions: 0,
      weeklyFocusHours: 0,
      weeklyStudyGoal: 20,
      weeklyGoalPercentage: 0,
      weeklyActiveDays: 0,
      activeDays: 0,
      focusScore: 0,
      activityCompletionScore: 0,
      consistencyScore: 0,
      productivityScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalXP: 0,
      level: 1,
      upcomingActivities: [],
    };
  }

  const [focusSessions, activities] = await Promise.all([
    FocusSession.find({
      user: userId,
      completed: true,
    }),

    Activity.find({
      user: userId,
    }),
  ]);

  // --------------------------------------------------------------------------
  // Dates
  // --------------------------------------------------------------------------

  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  // --------------------------------------------------------------------------
  // Focus sessions
  // --------------------------------------------------------------------------

  const completedFocusSessions = focusSessions.filter(
    (session) => session.sessionType === 'focus'
  );

  const todaysFocusSessions = completedFocusSessions.filter((session) => {
    if (!session.startTime) {
      return false;
    }

    const sessionDate = new Date(session.startTime);

    return (
      sessionDate >= today &&
      sessionDate <= todayEnd
    );
  });

  const todaysFocusMinutes = todaysFocusSessions.reduce(
    (total, session) =>
      total + Number(session.duration || 0),
    0
  );

  const todaysCompletedSessions =
    todaysFocusSessions.length;

  const focusSessionCount =
    completedFocusSessions.length;

  const focusMinutes =
    completedFocusSessions.reduce(
      (total, session) =>
        total + Number(session.duration || 0),
      0
    );

  // --------------------------------------------------------------------------
  // Weekly focus
  // --------------------------------------------------------------------------

  const weeklyFocusSessions =
    completedFocusSessions.filter((session) => {
      if (!session.startTime) {
        return false;
      }

      const sessionDate = new Date(session.startTime);

      return (
        sessionDate >= weekStart &&
        sessionDate <= todayEnd
      );
    });

  const weeklyFocusMinutes =
    weeklyFocusSessions.reduce(
      (total, session) =>
        total + Number(session.duration || 0),
      0
    );

  const weeklyFocusHours =
    weeklyFocusMinutes / 60;

  // --------------------------------------------------------------------------
  // Weekly study goal
  // --------------------------------------------------------------------------

  const weeklyStudyGoal =
    Number(user.weeklyStudyGoal || 20);

  const weeklyGoalPercentage =
    weeklyStudyGoal > 0
      ? Math.min(
          Math.round(
            (weeklyFocusHours / weeklyStudyGoal) *
              100
          ),
          100
        )
      : 0;

  const focusScore =
    weeklyGoalPercentage;

  // --------------------------------------------------------------------------
  // Activities
  // --------------------------------------------------------------------------

  const completedActivities =
    activities.filter(
      (activity) =>
        activity.status === 'completed'
    ).length;

  const weeklyActivities =
    activities.filter((activity) => {
      if (!activity.date) {
        return false;
      }

      const activityDate =
        new Date(activity.date);

      return (
        activityDate >= weekStart &&
        activityDate <= todayEnd
      );
    });

  const completedWeeklyActivities =
    weeklyActivities.filter(
      (activity) =>
        activity.status === 'completed'
    );

  const activityCompletionScore =
    weeklyActivities.length > 0
      ? Math.round(
          (completedWeeklyActivities.length /
            weeklyActivities.length) *
            100
        )
      : 0;

  // --------------------------------------------------------------------------
  // Active days
  // --------------------------------------------------------------------------

  const activeDaysSet = new Set();

  weeklyFocusSessions.forEach((session) => {
    if (!session.startTime) {
      return;
    }

    const date =
      new Date(session.startTime);

    date.setHours(0, 0, 0, 0);

    activeDaysSet.add(
      date.toISOString().slice(0, 10)
    );
  });

  weeklyActivities.forEach((activity) => {
    if (
      activity.status !== 'completed' ||
      !activity.date
    ) {
      return;
    }

    const date =
      new Date(activity.date);

    date.setHours(0, 0, 0, 0);

    activeDaysSet.add(
      date.toISOString().slice(0, 10)
    );
  });

  const weeklyActiveDays =
    activeDaysSet.size;

  const consistencyScore =
    Math.min(
      Math.round(
        (weeklyActiveDays / 7) * 100
      ),
      100
    );

  // --------------------------------------------------------------------------
  // Productivity score
  // --------------------------------------------------------------------------

  const productivityScore =
    Math.round(
      focusScore * 0.5 +
        consistencyScore * 0.3 +
        activityCompletionScore * 0.2
    );

  // --------------------------------------------------------------------------
  // Upcoming activities
  // --------------------------------------------------------------------------

  const upcomingActivities =
    activities
      .filter((activity) => {
        if (!activity.date) {
          return false;
        }

        return (
          new Date(activity.date) >=
          today
        );
      })
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(0, 5);

  // --------------------------------------------------------------------------
  // XP
  // --------------------------------------------------------------------------

  const totalXP =
    Number(user.xp || user.totalXP || 0);

  const level =
    Number(user.level || 1);

  // --------------------------------------------------------------------------
  // Streak
  // --------------------------------------------------------------------------

  const currentStreak =
    Number(user.currentStreak || 0);

  const longestStreak =
    Number(user.longestStreak || 0);

  return {
    todaysFocusMinutes,
    todaysCompletedSessions,

    focusSessionCount,
    focusMinutes,

    weeklyFocusHours,
    weeklyStudyGoal,
    weeklyGoalPercentage,

    weeklyActiveDays,
    activeDays: weeklyActiveDays,

    focusScore,
    activityCompletionScore,
    consistencyScore,
    productivityScore,

    completedActivities,

    currentStreak,
    longestStreak,

    totalXP,
    level,

    upcomingActivities,
  };
};

// ============================================================================
// GET PRODUCTIVITY SUMMARY
// ============================================================================

// @desc    Get productivity dashboard summary
// @route   GET /api/productivity/summary
// @access  Private

const getProductivitySummary = async (
  req,
  res,
  next
) => {
  try {
    const statistics =
      await calculateProductivityStatistics(
        req.user._id
      );

    res.status(200).json({
      ...statistics,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET FOCUS SESSIONS
// ============================================================================

// @desc    Get user's focus sessions
// @route   GET /api/productivity/focus-sessions
// @access  Private

const getFocusSessions = async (
  req,
  res,
  next
) => {
  try {
    const sessions =
      await FocusSession.find({
        user: req.user._id,
      }).sort({
        startTime: -1,
      });

    res.status(200).json({
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CREATE FOCUS SESSION
// ============================================================================

// @desc    Create focus session
// @route   POST /api/productivity/focus-sessions
// @access  Private

const createFocusSession = async (
  req,
  res,
  next
) => {
  try {
    const {
      duration,
      sessionType,
      startTime,
      endTime,
      completed,
    } = req.body;

    const session =
      await FocusSession.create({
        user: req.user._id,

        duration:
          Number(duration) || 0,

        sessionType:
          sessionType || 'focus',

        startTime:
          startTime
            ? new Date(startTime)
            : new Date(),

        endTime:
          endTime
            ? new Date(endTime)
            : new Date(),

        completed:
          completed !== undefined
            ? Boolean(completed)
            : true,
      });

    // ------------------------------------------------------------------------
    // Check achievements after completed session
    // ------------------------------------------------------------------------

    if (
      session.completed &&
      session.sessionType === 'focus'
    ) {
      await checkAchievements(
        req.user._id
      );
    }

    res.status(201).json({
      message:
        'Focus session created successfully',

      session,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET ACTIVITIES
// ============================================================================

// @desc    Get user's activities
// @route   GET /api/productivity/activities
// @access  Private

const getActivities = async (
  req,
  res,
  next
) => {
  try {
    const {
      status,
      activityType,
    } = req.query;

    const filter = {
      user: req.user._id,
    };

    if (status) {
      filter.status = status;
    }

    if (activityType) {
      filter.activityType =
        activityType;
    }

    const activities =
      await Activity.find(
        filter
      ).sort({
        date: -1,
      });

    res.status(200).json({
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CREATE ACTIVITY
// ============================================================================

// @desc    Create activity
// @route   POST /api/productivity/activities
// @access  Private

const createActivity = async (
  req,
  res,
  next
) => {
  try {
    const {
      title,
      description,
      activityType,
      date,
      status,
    } = req.body;

    const activityData = {
      user: req.user._id,

      title,

      description,

      activityType,

      date: date
        ? new Date(date)
        : new Date(),

      status:
        status || 'planned',
    };

    // ------------------------------------------------------------------------
    // Certificate upload
    // ------------------------------------------------------------------------

    if (req.file) {
      activityData.certificate =
        `/uploads/${req.file.filename}`;
    }

    const activity =
      await Activity.create(
        activityData
      );

    // ------------------------------------------------------------------------
    // Check achievements
    // ------------------------------------------------------------------------

    if (
      activity.status ===
      'completed'
    ) {
      await checkAchievements(
        req.user._id
      );
    }

    res.status(201).json({
      message:
        'Activity created successfully',

      activity,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// UPDATE ACTIVITY
// ============================================================================

// @desc    Update activity
// @route   PUT /api/productivity/activities/:id
// @access  Private

const updateActivity = async (
  req,
  res,
  next
) => {
  try {
    const activity =
      await Activity.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!activity) {
      return res.status(404).json({
        message:
          'Activity not found',
      });
    }

    const {
      title,
      description,
      activityType,
      date,
      status,
    } = req.body;

    if (
      title !== undefined
    ) {
      activity.title =
        title;
    }

    if (
      description !== undefined
    ) {
      activity.description =
        description;
    }

    if (
      activityType !== undefined
    ) {
      activity.activityType =
        activityType;
    }

    if (
      date !== undefined
    ) {
      activity.date =
        new Date(date);
    }

    if (
      status !== undefined
    ) {
      activity.status =
        status;
    }

    // ------------------------------------------------------------------------
    // Certificate upload
    // ------------------------------------------------------------------------

    if (req.file) {
      activity.certificate =
        `/uploads/${req.file.filename}`;
    }

    await activity.save();

    // ------------------------------------------------------------------------
    // Check achievements if completed
    // ------------------------------------------------------------------------

    if (
      activity.status ===
      'completed'
    ) {
      await checkAchievements(
        req.user._id
      );
    }

    res.status(200).json({
      message:
        'Activity updated successfully',

      activity,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// DELETE ACTIVITY
// ============================================================================

// @desc    Delete activity
// @route   DELETE /api/productivity/activities/:id
// @access  Private

const deleteActivity = async (
  req,
  res,
  next
) => {
  try {
    const activity =
      await Activity.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!activity) {
      return res.status(404).json({
        message:
          'Activity not found',
      });
    }

    res.status(200).json({
      message:
        'Activity deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// ACHIEVEMENT STATISTICS
// ============================================================================

const getAchievementStatistics =
  async (userId) => {
    const user =
      await User.findById(userId);

    if (!user) {
      return {
        focus_sessions: 0,
        focus_minutes: 0,
        completed_activities: 0,
        streak_days: 0,
        productivity_score: 0,
      };
    }

    const [
      focusSessions,
      activities,
    ] = await Promise.all([
      FocusSession.find({
        user: userId,
        completed: true,
      }),

      Activity.find({
        user: userId,
      }),
    ]);

    // ------------------------------------------------------------------------
    // Focus
    // ------------------------------------------------------------------------

    const completedFocusSessions =
      focusSessions.filter(
        (session) =>
          session.sessionType ===
          'focus'
      );

    const focusSessionCount =
      completedFocusSessions.length;

    const focusMinutes =
      completedFocusSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.duration || 0
          ),
        0
      );

    // ------------------------------------------------------------------------
    // Activities
    // ------------------------------------------------------------------------

    const completedActivities =
      activities.filter(
        (activity) =>
          activity.status ===
          'completed'
      ).length;

    // ------------------------------------------------------------------------
    // Streak
    // ------------------------------------------------------------------------

    const currentStreak =
      Number(
        user.currentStreak || 0
      );

    // ------------------------------------------------------------------------
    // Weekly productivity
    // ------------------------------------------------------------------------

    const weeklyStudyGoal =
      Number(
        user.weeklyStudyGoal || 20
      );

    const now =
      new Date();

    const today =
      new Date(now);

    today.setHours(
      0,
      0,
      0,
      0
    );

    const todayEnd =
      new Date(today);

    todayEnd.setHours(
      23,
      59,
      59,
      999
    );

    const weekStart =
      new Date(today);

    weekStart.setDate(
      weekStart.getDate() - 6
    );

    // ------------------------------------------------------------------------
    // Weekly focus
    // ------------------------------------------------------------------------

    const weeklyFocusSessions =
      completedFocusSessions.filter(
        (session) => {
          if (
            !session.startTime
          ) {
            return false;
          }

          const sessionDate =
            new Date(
              session.startTime
            );

          return (
            sessionDate >=
              weekStart &&
            sessionDate <=
              todayEnd
          );
        }
      );

    const weeklyFocusMinutes =
      weeklyFocusSessions.reduce(
        (total, session) =>
          total +
          Number(
            session.duration || 0
          ),
        0
      );

    const weeklyFocusHours =
      weeklyFocusMinutes / 60;

    const focusScore =
      weeklyStudyGoal > 0
        ? Math.min(
            Math.round(
              (
                weeklyFocusHours /
                weeklyStudyGoal
              ) *
                100
            ),
            100
          )
        : 0;

    // ------------------------------------------------------------------------
    // Weekly activities
    // ------------------------------------------------------------------------

    const weeklyActivities =
      activities.filter(
        (activity) => {
          if (!activity.date) {
            return false;
          }

          const activityDate =
            new Date(
              activity.date
            );

          return (
            activityDate >=
              weekStart &&
            activityDate <=
              todayEnd
          );
        }
      );

    const completedWeeklyActivities =
      weeklyActivities.filter(
        (activity) =>
          activity.status ===
          'completed'
      );

    const activityCompletionScore =
      weeklyActivities.length > 0
        ? Math.round(
            (
              completedWeeklyActivities.length /
              weeklyActivities.length
            ) *
              100
          )
        : 0;

    // ------------------------------------------------------------------------
    // Active days
    // ------------------------------------------------------------------------

    const activeDays =
      new Set();

    weeklyFocusSessions.forEach(
      (session) => {
        if (
          !session.startTime
        ) {
          return;
        }

        const date =
          new Date(
            session.startTime
          );

        date.setHours(
          0,
          0,
          0,
          0
        );

        activeDays.add(
          date
            .toISOString()
            .slice(0, 10)
        );
      }
    );

    weeklyActivities.forEach(
      (activity) => {
        if (
          activity.status !==
            'completed' ||
          !activity.date
        ) {
          return;
        }

        const date =
          new Date(
            activity.date
          );

        date.setHours(
          0,
          0,
          0,
          0
        );

        activeDays.add(
          date
            .toISOString()
            .slice(0, 10)
        );
      }
    );

    const weeklyActiveDays =
      activeDays.size;

    const consistencyScore =
      Math.min(
        Math.round(
          (
            weeklyActiveDays /
            7
          ) *
            100
        ),
        100
      );

    // ------------------------------------------------------------------------
    // Overall score
    // ------------------------------------------------------------------------

    const productivityScore =
      Math.round(
        focusScore * 0.5 +
          consistencyScore *
            0.3 +
          activityCompletionScore *
            0.2
      );

    return {
      focus_sessions:
        focusSessionCount,

      focus_minutes:
        focusMinutes,

      completed_activities:
        completedActivities,

      streak_days:
        currentStreak,

      productivity_score:
        productivityScore,
    };
  };

// ============================================================================
// GET ALL ACHIEVEMENTS WITH PROGRESS
// ============================================================================

// @desc    Get all achievements with progress
// @route   GET /api/productivity/achievements
// @access  Private

const getAchievements = async (
  req,
  res,
  next
) => {
  try {
    const achievements =
      await Achievement.find({
        active: true,
      }).sort({
        category: 1,
        requirement: 1,
      });

    const statistics =
      await getAchievementStatistics(
        req.user._id
      );

    const userAchievements =
      await UserAchievement.find({
        user: req.user._id,
      }).select(
        'achievement unlockedAt'
      );

    const unlockedMap =
      new Map();

    userAchievements.forEach(
      (item) => {
        unlockedMap.set(
          item.achievement.toString(),
          item.unlockedAt
        );
      }
    );

    const achievementProgress =
      achievements.map(
        (achievement) => {
          const requiredValue =
            Number(
              achievement.requirement
            );

          const currentValue =
            Number(
              statistics[
                achievement
                  .requirementType
              ] || 0
            );

          const unlockedAt =
            unlockedMap.get(
              achievement._id.toString()
            ) || null;

          const unlocked =
            Boolean(unlockedAt);

          const progress =
            Math.min(
              currentValue,
              requiredValue
            );

          const progressPercentage =
            requiredValue > 0
              ? Math.min(
                  Math.round(
                    (
                      currentValue /
                      requiredValue
                    ) *
                      100
                  ),
                  100
                )
              : 0;

          const remaining =
            Math.max(
              requiredValue -
                currentValue,
              0
            );

          return {
            ...achievement.toObject(),

            currentValue,

            requiredValue,

            progress,

            progressPercentage,

            remaining,

            unlocked,

            unlockedAt,

            xpReward:
              Number(
                achievement.xpReward ||
                  0
              ),
          };
        }
      );

    // ------------------------------------------------------------------------
    // Next achievement
    // ------------------------------------------------------------------------

    const lockedAchievements =
      achievementProgress
        .filter(
          (achievement) =>
            !achievement.unlocked
        )
        .sort(
          (a, b) => {
            const aPercentage =
              a.progressPercentage;

            const bPercentage =
              b.progressPercentage;

            if (
              aPercentage !==
              bPercentage
            ) {
              return (
                bPercentage -
                aPercentage
              );
            }

            return (
              a.remaining -
              b.remaining
            );
          }
        );

    const nextAchievement =
      lockedAchievements.length > 0
        ? lockedAchievements[0]
        : null;

    // ------------------------------------------------------------------------
    // Recently unlocked
    // ------------------------------------------------------------------------

    const recentlyUnlocked =
      achievementProgress
        .filter(
          (achievement) =>
            achievement.unlocked
        )
        .sort(
          (a, b) =>
            new Date(
              b.unlockedAt
            ) -
            new Date(
              a.unlockedAt
            )
        )
        .slice(0, 5);

    // ------------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------------

    const totalAchievements =
      achievementProgress.length;

    const unlockedCount =
      achievementProgress.filter(
        (achievement) =>
          achievement.unlocked
      ).length;

    const lockedCount =
      totalAchievements -
      unlockedCount;

    const totalPossibleXP =
      achievementProgress.reduce(
        (total, achievement) =>
          total +
          Number(
            achievement.xpReward || 0
          ),
        0
      );

    const earnedAchievementXP =
      achievementProgress
        .filter(
          (achievement) =>
            achievement.unlocked
        )
        .reduce(
          (total, achievement) =>
            total +
            Number(
              achievement.xpReward ||
                0
            ),
          0
        );

    res.status(200).json({
      achievements:
        achievementProgress,

      nextAchievement,

      recentlyUnlocked,

      summary: {
        total:
          totalAchievements,

        unlocked:
          unlockedCount,

        locked:
          lockedCount,

        completionPercentage:
          totalAchievements > 0
            ? Math.round(
                (
                  unlockedCount /
                  totalAchievements
                ) *
                  100
              )
            : 0,

        totalPossibleXP,

        earnedAchievementXP,
      },

      statistics,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GET MY UNLOCKED ACHIEVEMENTS
// ============================================================================

// @desc    Get user's unlocked achievements
// @route   GET /api/productivity/achievements/my
// @access  Private

const getMyAchievements = async (
  req,
  res,
  next
) => {
  try {
    const userAchievements =
      await UserAchievement.find({
        user: req.user._id,
      })
        .populate('achievement')
        .sort({
          unlockedAt: -1,
        });

    res.status(200).json({
      achievements:
        userAchievements,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// CHECK AND UNLOCK ACHIEVEMENTS
// ============================================================================

const checkAchievements = async (
  userId
) => {
  try {
    const user =
      await User.findById(userId);

    if (!user) {
      return {
        unlocked: [],
        xpAwarded: 0,
      };
    }

    const achievements =
      await Achievement.find({
        active: true,
      });

    if (
      achievements.length === 0
    ) {
      return {
        unlocked: [],
        xpAwarded: 0,
      };
    }

    const statistics =
      await getAchievementStatistics(
        userId
      );

    const existingUnlocks =
      await UserAchievement.find({
        user: userId,
      }).select(
        'achievement'
      );

    const unlockedIds =
      new Set(
        existingUnlocks.map(
          (item) =>
            item.achievement.toString()
        )
      );

    const newlyUnlocked = [];

    let totalXpAwarded = 0;

    for (
      const achievement of
        achievements
    ) {
      if (
        unlockedIds.has(
          achievement._id.toString()
        )
      ) {
        continue;
      }

      const currentValue =
        Number(
          statistics[
            achievement
              .requirementType
          ] || 0
        );

      const requiredValue =
        Number(
          achievement.requirement
        );

      if (
        currentValue >=
        requiredValue
      ) {
        try {
          const unlocked =
            await UserAchievement.create(
              {
                user: userId,

                achievement:
                  achievement._id,
              }
            );

          const xpReward =
            Number(
              achievement.xpReward ||
                0
            );

          if (
            xpReward > 0 &&
            typeof user.addXP ===
              'function'
          ) {
            await user.addXP(
              xpReward
            );

            totalXpAwarded +=
              xpReward;
          }

          newlyUnlocked.push({
            ...achievement.toObject(),

            unlockedAt:
              unlocked.unlockedAt,

            xpAwarded:
              xpReward,
          });
        } catch (error) {
          // Ignore duplicate achievement unlocks
          if (
            error.code !== 11000
          ) {
            throw error;
          }
        }
      }
    }

    return {
      unlocked:
        newlyUnlocked,

      xpAwarded:
        totalXpAwarded,
    };
  } catch (error) {
    console.error(
      'Achievement check failed:',
      error
    );

    // Achievement processing should
    // never break the main operation.
    return {
      unlocked: [],
      xpAwarded: 0,
    };
  }
};

// ============================================================================
// MANUALLY CHECK ACHIEVEMENTS
// ============================================================================

// @desc    Check user's achievements
// @route   POST /api/productivity/achievements/check
// @access  Private

const checkMyAchievements = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await checkAchievements(
        req.user._id
      );

    res.status(200).json({
      message:
        'Achievements checked successfully',

      unlocked:
        result.unlocked,

      xpAwarded:
        result.xpAwarded,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getFocusSessions,
  createFocusSession,

  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,

  getProductivitySummary,

  getAchievements,
  getMyAchievements,
  checkAchievements,
  checkMyAchievements,
};