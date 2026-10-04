const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    // =========================================================================
    // BASIC USER INFORMATION
    // =========================================================================

    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [
        6,
        'Password must be at least 6 characters',
      ],
      select: false,
    },

    // =========================================================================
    // FINANCE
    // =========================================================================

    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },

    // =========================================================================
    // PRODUCTIVITY / STUDY GOAL
    // =========================================================================

    weeklyStudyGoal: {
      type: Number,
      default: 20,
      min: [
        1,
        'Weekly study goal must be at least 1 hour',
      ],
      max: [
        168,
        'Weekly study goal cannot exceed 168 hours',
      ],
    },

    // =========================================================================
    // POMODORO SETTINGS
    // =========================================================================
    //
    // Values are stored in MINUTES.
    //
    // Example:
    // pomodoroFocus = 25
    // pomodoroShortBreak = 5
    // pomodoroLongBreak = 15
    //
    // The frontend timer should multiply these values by 60
    // when converting them into seconds.
    // =========================================================================

    pomodoroFocus: {
      type: Number,
      default: 25,
      min: [
        1,
        'Focus duration must be at least 1 minute',
      ],
      max: [
        180,
        'Focus duration cannot exceed 180 minutes',
      ],
    },

    pomodoroShortBreak: {
      type: Number,
      default: 5,
      min: [
        1,
        'Short break must be at least 1 minute',
      ],
      max: [
        60,
        'Short break cannot exceed 60 minutes',
      ],
    },

    pomodoroLongBreak: {
      type: Number,
      default: 15,
      min: [
        1,
        'Long break must be at least 1 minute',
      ],
      max: [
        120,
        'Long break cannot exceed 120 minutes',
      ],
    },

    // =========================================================================
    // GAMIFICATION
    // =========================================================================

    totalXP: {
      type: Number,
      default: 0,
      min: [0, 'XP cannot be negative'],
    },

    level: {
      type: Number,
      default: 1,
      min: [1, 'Level must be at least 1'],
    },

    // =========================================================================
    // STREAK SYSTEM
    // =========================================================================

    currentStreak: {
      type: Number,
      default: 0,
      min: [
        0,
        'Current streak cannot be negative',
      ],
    },

    longestStreak: {
      type: Number,
      default: 0,
      min: [
        0,
        'Longest streak cannot be negative',
      ],
    },

    lastActiveDate: {
      type: Date,
      default: null,
    },

    // =========================================================================
    // ACHIEVEMENTS
    // =========================================================================

    achievements: [
      {
        achievement: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Achievement',
          required: true,
        },

        unlockedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// =============================================================================
// VIRTUAL: INITIALS
// =============================================================================

UserSchema.virtual('initials').get(function () {
  if (!this.name) {
    return '';
  }

  const parts = this.name
    .trim()
    .split(/\s+/);

  const first =
    parts[0]?.[0] || '';

  const last =
    parts.length > 1
      ? parts[parts.length - 1][0]
      : '';

  return (
    first + last
  ).toUpperCase();
});

// =============================================================================
// INCLUDE VIRTUALS IN JSON
// =============================================================================

UserSchema.set('toJSON', {
  virtuals: true,
});

UserSchema.set('toObject', {
  virtuals: true,
});

// =============================================================================
// HASH PASSWORD BEFORE SAVE
// =============================================================================

UserSchema.pre(
  'save',
  async function (next) {
    if (!this.isModified('password')) {
      return next();
    }

    const salt =
      await bcrypt.genSalt(10);

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );

    next();
  }
);

// =============================================================================
// COMPARE PASSWORD
// =============================================================================

UserSchema.methods.matchPassword =
  async function (enteredPassword) {
    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

// =============================================================================
// XP HELPERS
// =============================================================================

UserSchema.methods.getXPForNextLevel =
  function () {
    return this.level * 500;
  };

// =============================================================================
// ADD XP
// =============================================================================

UserSchema.methods.addXP =
  async function (amount) {
    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return this;
    }

    this.totalXP =
      Number(this.totalXP || 0) +
      numericAmount;

    // Every 500 XP = one level.
    //
    // Level 1: 0 - 499 XP
    // Level 2: 500 - 999 XP
    // Level 3: 1000 - 1499 XP
    // etc.

    const calculatedLevel =
      Math.floor(
        this.totalXP / 500
      ) + 1;

    this.level = Math.max(
      1,
      calculatedLevel
    );

    await this.save();

    return this;
  };

// =============================================================================
// DATE HELPERS
// =============================================================================

const getCalendarDateKey = (
  value
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');

  const day =
    String(
      date.getDate()
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// =============================================================================
// CALCULATE DIFFERENCE BETWEEN CALENDAR DAYS
// =============================================================================

const getCalendarDayDifference = (
  newerDate,
  olderDate
) => {
  const newer =
    new Date(newerDate);

  const older =
    new Date(olderDate);

  if (
    Number.isNaN(
      newer.getTime()
    ) ||
    Number.isNaN(
      older.getTime()
    )
  ) {
    return null;
  }

  newer.setHours(
    0,
    0,
    0,
    0
  );

  older.setHours(
    0,
    0,
    0,
    0
  );

  const difference =
    newer.getTime() -
    older.getTime();

  return Math.round(
    difference /
      (1000 * 60 * 60 * 24)
  );
};

// =============================================================================
// UPDATE PRODUCTIVITY STREAK
// =============================================================================

UserSchema.methods.updateStreak =
  async function (
    activityDate = new Date()
  ) {
    const currentDate =
      new Date(activityDate);

    // -------------------------------------------------------------------------
    // Invalid date protection
    // -------------------------------------------------------------------------

    if (
      Number.isNaN(
        currentDate.getTime()
      )
    ) {
      return this;
    }

    // -------------------------------------------------------------------------
    // Prevent future dates from creating streaks
    // -------------------------------------------------------------------------

    const today =
      new Date();

    today.setHours(
      23,
      59,
      59,
      999
    );

    if (
      currentDate > today
    ) {
      return this;
    }

    // -------------------------------------------------------------------------
    // Current calendar date
    // -------------------------------------------------------------------------

    const currentDateKey =
      getCalendarDateKey(
        currentDate
      );

    if (!currentDateKey) {
      return this;
    }

    // -------------------------------------------------------------------------
    // First productive day
    // -------------------------------------------------------------------------

    if (
      !this.lastActiveDate
    ) {
      this.currentStreak =
        1;

      this.longestStreak =
        Math.max(
          Number(
            this.longestStreak || 0
          ),
          1
        );

      this.lastActiveDate =
        currentDate;

      await this.save();

      return this;
    }

    // -------------------------------------------------------------------------
    // Previous productive date
    // -------------------------------------------------------------------------

    const previousDate =
      new Date(
        this.lastActiveDate
      );

    if (
      Number.isNaN(
        previousDate.getTime()
      )
    ) {
      this.currentStreak =
        1;

      this.longestStreak =
        Math.max(
          Number(
            this.longestStreak || 0
          ),
          1
        );

      this.lastActiveDate =
        currentDate;

      await this.save();

      return this;
    }

    const previousDateKey =
      getCalendarDateKey(
        previousDate
      );

    // -------------------------------------------------------------------------
    // Same calendar day
    // -------------------------------------------------------------------------

    if (
      currentDateKey ===
      previousDateKey
    ) {
      return this;
    }

    // -------------------------------------------------------------------------
    // Calculate day difference
    // -------------------------------------------------------------------------

    const differenceInDays =
      getCalendarDayDifference(
        currentDate,
        previousDate
      );

    // -------------------------------------------------------------------------
    // Consecutive day
    // -------------------------------------------------------------------------

    if (
      differenceInDays === 1
    ) {
      this.currentStreak =
        Number(
          this.currentStreak || 0
        ) + 1;
    }

    // -------------------------------------------------------------------------
    // Missed one or more days
    // -------------------------------------------------------------------------

    else {
      this.currentStreak =
        1;
    }

    // -------------------------------------------------------------------------
    // Update longest streak
    // -------------------------------------------------------------------------

    this.longestStreak =
      Math.max(
        Number(
          this.longestStreak || 0
        ),
        Number(
          this.currentStreak || 0
        )
      );

    // -------------------------------------------------------------------------
    // Store latest productive date
    // -------------------------------------------------------------------------

    this.lastActiveDate =
      currentDate;

    await this.save();

    return this;
  };

// =============================================================================
// EXPORT
// =============================================================================

module.exports =
  mongoose.model(
    'User',
    UserSchema
  );