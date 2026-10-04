const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const mongoose = require('mongoose');
const Achievement = require('./models/Achievement');

const achievements = [
  {
    key: 'first_focus',
    title: 'First Focus',
    description: 'Complete your first focus session.',
    icon: 'target',
    category: 'focus',
    requirement: 1,
    requirementType: 'focus_sessions',
    xpReward: 25,
    active: true,
  },

  {
    key: 'focus_beginner',
    title: 'Focus Beginner',
    description: 'Complete 5 focus sessions.',
    icon: 'brain',
    category: 'focus',
    requirement: 5,
    requirementType: 'focus_sessions',
    xpReward: 50,
    active: true,
  },

  {
    key: 'focus_master',
    title: 'Focus Master',
    description: 'Complete 10 focus sessions.',
    icon: 'zap',
    category: 'focus',
    requirement: 10,
    requirementType: 'focus_sessions',
    xpReward: 100,
    active: true,
  },

  {
    key: 'deep_focus',
    title: 'Deep Focus',
    description: 'Complete 60 minutes of focused study.',
    icon: 'clock',
    category: 'study',
    requirement: 60,
    requirementType: 'focus_minutes',
    xpReward: 100,
    active: true,
  },

  {
    key: 'study_warrior',
    title: 'Study Warrior',
    description: 'Complete 300 minutes of focused study.',
    icon: 'book-open',
    category: 'study',
    requirement: 300,
    requirementType: 'focus_minutes',
    xpReward: 150,
    active: true,
  },

  {
    key: 'activity_starter',
    title: 'Activity Starter',
    description: 'Complete your first activity.',
    icon: 'check-circle',
    category: 'activity',
    requirement: 1,
    requirementType: 'completed_activities',
    xpReward: 50,
    active: true,
  },

  {
    key: 'activity_champion',
    title: 'Activity Champion',
    description: 'Complete 5 activities.',
    icon: 'award',
    category: 'activity',
    requirement: 5,
    requirementType: 'completed_activities',
    xpReward: 100,
    active: true,
  },

  {
    key: 'consistent_learner',
    title: 'Consistent Learner',
    description: 'Maintain a 7-day productivity streak.',
    icon: 'flame',
    category: 'streak',
    requirement: 7,
    requirementType: 'streak_days',
    xpReward: 100,
    active: true,
  },

  {
    key: 'productivity_expert',
    title: 'Productivity Expert',
    description: 'Reach a productivity score of 80.',
    icon: 'trending-up',
    category: 'productivity',
    requirement: 80,
    requirementType: 'productivity_score',
    xpReward: 200,
    active: true,
  },
];

const seedAchievements = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    for (const achievement of achievements) {
      await Achievement.findOneAndUpdate(
        { key: achievement.key },
        achievement,
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log(
      `Successfully seeded ${achievements.length} achievements.`
    );

    await mongoose.disconnect();

    console.log('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    console.error(
      'Achievement seeding failed:',
      error
    );

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedAchievements();

