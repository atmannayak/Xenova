const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');

const {
  notFound,
  errorHandler,
} = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const financeRoutes = require('./routes/financeRoutes');
const productivityRoutes = require('./routes/productivityRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

connectDB();

const app = express();

// ---------------------------------------------------------------------------
// Core middleware
// ---------------------------------------------------------------------------

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      'http://localhost:3000',

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

// ---------------------------------------------------------------------------
// Serve uploaded certificates/files statically
// ---------------------------------------------------------------------------

app.use(
  '/uploads',
  express.static(
    path.join(__dirname, 'uploads')
  )
);

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/finance',
  financeRoutes
);

app.use(
  '/api/productivity',
  productivityRoutes
);

// ---------------------------------------------------------------------------
// Achievement routes
// ---------------------------------------------------------------------------

app.use(
  '/api/productivity/achievements',
  achievementRoutes
);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get(
  '/api/health',
  (req, res) => {
    res.status(200).json({
      status: 'ok',
      message:
        'Xenova API is running',
    });
  }
);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use(notFound);

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT =
  process.env.PORT || 5001;

app.listen(
  PORT,
  () => {
    console.log(
      `Xenova server running in ${
        process.env.NODE_ENV ||
        'development'
      } mode on port ${PORT}`
    );
  }
);

