const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema(
  {
    // -----------------------------------------------------------------------
    // Achievement information
    // -----------------------------------------------------------------------

    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      default: 'trophy',
      trim: true,
    },

    category: {
      type: String,
      enum: [
        'focus',
        'streak',
        'activity',
        'study',
        'productivity',
      ],
      required: true,
    },

    // -----------------------------------------------------------------------
    // Requirement
    // -----------------------------------------------------------------------

    requirement: {
      type: Number,
      required: true,
      min: 1,
    },

    requirementType: {
      type: String,
      enum: [
        'focus_sessions',
        'focus_minutes',
        'completed_activities',
        'streak_days',
        'productivity_score',
      ],
      required: true,
    },

    // -----------------------------------------------------------------------
    // Reward
    // -----------------------------------------------------------------------

    xpReward: {
      type: Number,
      default: 0,
      min: 0,
    },

    // -----------------------------------------------------------------------
    // Status
    // -----------------------------------------------------------------------

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    'Achievement',
    AchievementSchema
  );