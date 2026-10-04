const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const router =
  express.Router();

// =============================================================================
// PRODUCTIVITY CONTROLLER
// =============================================================================

const {
  getFocusSessions,
  createFocusSession,

  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,

  updateWeeklyGoal,

  getProductivitySummary,
} = require('../controllers/productivityController');

// =============================================================================
// ACHIEVEMENT CONTROLLER
// =============================================================================

const {
  getAchievements,
  getMyAchievements,
  checkMyAchievements,
} = require('../controllers/achievementController');

// =============================================================================
// AUTHENTICATION
// =============================================================================

const {
  protect,
} = require('../middleware/authMiddleware');

// =============================================================================
// MULTER CONFIGURATION
// =============================================================================

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        path.join(
          __dirname,
          '..',
          'uploads'
        )
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const uniqueSuffix =
        crypto
          .randomBytes(8)
          .toString('hex');

      const ext =
        path.extname(
          file.originalname
        );

      cb(
        null,
        `certificate-${Date.now()}-${uniqueSuffix}${ext}`
      );
    },
  });

// =============================================================================
// FILE FILTER
// =============================================================================

const fileFilter = (
  req,
  file,
  cb
) => {
  if (
    ALLOWED_MIME_TYPES.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Only PDF, PNG, JPG and WEBP files are allowed'
      ),
      false
    );
  }
};

// =============================================================================
// MULTER INSTANCE
// =============================================================================

const upload =
  multer({
    storage,
    fileFilter,

    limits: {
      fileSize:
        5 * 1024 * 1024,
    },
  });

// =============================================================================
// ALL PRODUCTIVITY ROUTES REQUIRE LOGIN
// =============================================================================

router.use(protect);

// =============================================================================
// PRODUCTIVITY SUMMARY
// =============================================================================

// GET /api/productivity/summary

router.get(
  '/summary',
  getProductivitySummary
);

// =============================================================================
// WEEKLY STUDY GOAL
// =============================================================================

// PUT /api/productivity/weekly-goal

router.put(
  '/weekly-goal',
  updateWeeklyGoal
);

// =============================================================================
// FOCUS SESSIONS
// =============================================================================

// GET  /api/productivity/focus-sessions
// POST /api/productivity/focus-sessions

router
  .route(
    '/focus-sessions'
  )
  .get(
    getFocusSessions
  )
  .post(
    createFocusSession
  );

// =============================================================================
// ACTIVITIES
// =============================================================================

// GET  /api/productivity/activities
// POST /api/productivity/activities

router
  .route(
    '/activities'
  )
  .get(
    getActivities
  )
  .post(
    upload.single(
      'certificate'
    ),
    createActivity
  );

// =============================================================================
// INDIVIDUAL ACTIVITY
// =============================================================================

// PUT    /api/productivity/activities/:id
// DELETE /api/productivity/activities/:id

router
  .route(
    '/activities/:id'
  )
  .put(
    upload.single(
      'certificate'
    ),
    updateActivity
  )
  .delete(
    deleteActivity
  );

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

// GET /api/productivity/achievements

router.get(
  '/achievements',
  getAchievements
);

// GET /api/productivity/achievements/my

router.get(
  '/achievements/my',
  getMyAchievements
);

// POST /api/productivity/achievements/check

router.post(
  '/achievements/check',
  checkMyAchievements
);

// =============================================================================
// EXPORT
// =============================================================================

module.exports = router;