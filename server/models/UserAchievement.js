const mongoose = require('mongoose');

const UserAchievementSchema =
  new mongoose.Schema(
    {
      // ---------------------------------------------------------------------
      // User who unlocked the achievement
      // ---------------------------------------------------------------------

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },

      // ---------------------------------------------------------------------
      // Achievement that was unlocked
      // ---------------------------------------------------------------------

      achievement: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement',
        required: true,
      },

      // ---------------------------------------------------------------------
      // Date when the achievement was unlocked
      // ---------------------------------------------------------------------

      unlockedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

// ---------------------------------------------------------------------------
// Prevent the same achievement from being unlocked twice by the same user
// ---------------------------------------------------------------------------

UserAchievementSchema.index(
  {
    user: 1,
    achievement: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    'UserAchievement',
    UserAchievementSchema
  );

