const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================================================
// GENERATE JWT
// =============================================================================

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'xenovasecretkey123',
    {
      expiresIn: '30d',
    }
  );
};

// =============================================================================
// SEND TOKEN COOKIE
// =============================================================================

const sendTokenCookie = (res, token) => {
  const isProduction =
    process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

// =============================================================================
// USER RESPONSE
// =============================================================================

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  initials: user.initials,

  monthlyBudget:
    Number(user.monthlyBudget || 0),

  weeklyStudyGoal:
    Number(user.weeklyStudyGoal || 20),

  totalXP:
    Number(user.totalXP || 0),

  level:
    Number(user.level || 1),

  currentStreak:
    Number(user.currentStreak || 0),

  longestStreak:
    Number(user.longestStreak || 0),
});

// =============================================================================
// REGISTER
// =============================================================================

// POST /api/auth/register
// Public

const registerUser = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          'Name, email and password are required',
      });
    }

    if (
      confirmPassword !== undefined &&
      password !== confirmPassword
    ) {
      return res.status(400).json({
        message:
          'Passwords do not match',
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          'An account with this email already exists',
      });
    }

    const user =
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
      });

    const token =
      generateToken(user._id);

    sendTokenCookie(
      res,
      token
    );

    return res.status(201).json({
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// LOGIN
// =============================================================================

// POST /api/auth/login
// Public

const loginUser = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res.status(400).json({
        message:
          'Email and password are required',
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select('+password');

    if (
      !user ||
      !(await user.matchPassword(password))
    ) {
      return res.status(401).json({
        message:
          'Invalid email or password',
      });
    }

    const token =
      generateToken(user._id);

    sendTokenCookie(
      res,
      token
    );

    return res.status(200).json({
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// GET CURRENT USER
// =============================================================================

// GET /api/auth/me
// Private

const getMe = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    return res.status(200).json({
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// UPDATE CURRENT USER
// =============================================================================

// PUT /api/auth/me
// Private

const updateMe = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        message:
          'User not found',
      });
    }

    const {
      name,
      weeklyStudyGoal,
      monthlyBudget,
    } = req.body;

    // -------------------------------------------------------------------------
    // NAME
    // -------------------------------------------------------------------------

    if (
      name !== undefined
    ) {
      const trimmedName =
        String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          message:
            'Name cannot be empty',
        });
      }

      if (
        trimmedName.length > 60
      ) {
        return res.status(400).json({
          message:
            'Name cannot exceed 60 characters',
        });
      }

      user.name =
        trimmedName;
    }

    // -------------------------------------------------------------------------
    // WEEKLY STUDY GOAL
    // -------------------------------------------------------------------------

    if (
      weeklyStudyGoal !== undefined
    ) {
      const goal =
        Number(
          weeklyStudyGoal
        );

      if (
        !Number.isFinite(goal) ||
        goal < 1 ||
        goal > 168
      ) {
        return res.status(400).json({
          message:
            'Weekly study goal must be between 1 and 168 hours',
        });
      }

      user.weeklyStudyGoal =
        goal;
    }

    // -------------------------------------------------------------------------
    // MONTHLY BUDGET
    // -------------------------------------------------------------------------

    if (
      monthlyBudget !== undefined
    ) {
      const budget =
        Number(
          monthlyBudget
        );

      if (
        !Number.isFinite(budget) ||
        budget < 0
      ) {
        return res.status(400).json({
          message:
            'Monthly budget cannot be negative',
        });
      }

      user.monthlyBudget =
        budget;
    }

    await user.save();

    return res.status(200).json({
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// LOGOUT
// =============================================================================

// POST /api/auth/logout
// Private

const logoutUser = async (
  req,
  res,
  next
) => {
  try {
    const isProduction =
      process.env.NODE_ENV ===
      'production';

    res.cookie(
      'token',
      '',
      {
        httpOnly: true,
        secure: isProduction,
        sameSite:
          isProduction
            ? 'none'
            : 'lax',
        expires:
          new Date(0),
      }
    );

    return res.status(200).json({
      message:
        'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// =============================================================================
// EXPORT
// =============================================================================

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  logoutUser,
};