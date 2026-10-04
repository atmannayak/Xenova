const mongoose = require('mongoose');

const FocusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    duration: {
      type: Number, // minutes
      required: true,
      min: 1,
    },

    // Subject studied during the focus session
    subject: {
      type: String,
      enum: [
        'ADA',
        'DBMS',
        'AI/ML',
        'Computer Networks',
        'Operating Systems',
        'Software Engineering',
        'Mathematics',
        'Other',
      ],
      default: 'Other',
    },

    sessionType: {
      type: String,
      enum: ['focus', 'short_break', 'long_break'],
      default: 'focus',
    },

    completed: {
      type: Boolean,
      default: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

FocusSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('FocusSession', FocusSessionSchema);