const express = require('express');

const {
  getAchievements,
  getMyAchievements,
  checkMyAchievements,
} = require('../controllers/achievementController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ---------------------------------------------------------------------------
// Get all available achievements
// ---------------------------------------------------------------------------
// GET /api/productivity/achievements

router.get(
  '/',
  protect,
  getAchievements
);

// ---------------------------------------------------------------------------
// Get achievements unlocked by current user
// ---------------------------------------------------------------------------
// GET /api/productivity/achievements/my

router.get(
  '/my',
  protect,
  getMyAchievements
);

// ---------------------------------------------------------------------------
// Manually check achievements
// ---------------------------------------------------------------------------
// POST /api/productivity/achievements/check

router.post(
  '/check',
  protect,
  checkMyAchievements
);

module.exports = router;

