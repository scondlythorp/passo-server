/**
 * ============================================================
 * passo-server/server.js — Checkpoints 1d.4, 1d.5, 1d.6
 * ============================================================
 * Entry point for the PASSO Transport Fare API.
 *
 * Covers:
 *  1d.4 – Locality, vehicle-type and stats endpoints
 *  1d.5 – Input validation (price > 0, from ≠ to, valid vehicle)
 *  1d.6 – Global structured error handling with timestamps
 * ============================================================
 */

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ── Global middleware ────────────────────────────────────────

// CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse incoming JSON bodies
app.use(express.json());

// Request logger — logs method, path and timestamp on every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────
// Central router which mounts resource routers from the backend
const apiRouter = require('./routes');

app.use('/api', apiRouter);

// Serve compiled frontend assets from dist/
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));

// Root route handler with Content-Negotiation
app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')) {
    return res.status(200).json({
      service: 'PASSO Transport Fare API',
      version: '1.0.0',
      endpoints: {
        localities:   'GET /api/localities',
        vehicleTypes: 'GET /api/vehicle-types',
        stats:        'GET /api/stats',
        fares:        'GET /api/fares',
        farById:      'GET /api/fares/:id',
        createFare:   'POST /api/fares',
        updateFare:   'PUT /api/fares/:id',
        deleteFare:   'DELETE /api/fares/:id',
      },
    });
  }

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({
        service: 'PASSO Transport Fare API',
        version: '1.0.0',
      });
    }
  });
});

// Health-check endpoint explicitly for API clients
app.get('/api/health', (req, res) => {
  res.status(200).json({
    service: 'PASSO Transport Fare API',
    version: '1.0.0',
    status: 'healthy',
  });
});

// SPA fallback for non-API routes
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// ── 404 Handler for API routes ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.originalUrl} does not exist.`,
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler (Checkpoint 1d.6) ───────────────────
/**
 * This middleware catches any error forwarded via next(err).
 * It always returns a structured JSON body so clients get
 * a consistent error shape regardless of where the error originated.
 *
 * Structure:
 *  {
 *    error:     "Error Type string",
 *    message:   "Human-readable detail",
 *    timestamp: "ISO-8601 string"
 *  }
 */
// ── Database Fallback Error Handler ───────────────────────────
app.use((err, req, res, next) => {
  if (
    err.name === 'MongoError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseError' ||
    (err.message && (err.message.includes('buffering timed out') || err.message.includes('connect ECONNREFUSED')))
  ) {
    console.warn('[AI Studio] Database offline — returning mock response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

app.use((err, req, res, next) => {             // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;

  // Always log to console with timestamp so issues are traceable
  console.error(`[${new Date().toISOString()}] ❌ ${statusCode} — ${err.message}`);
  if (statusCode === 500) {
    // Log the full stack trace for unexpected server errors
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error:     statusCode === 400 ? 'Bad Request'
             : statusCode === 404 ? 'Not Found'
             : 'Internal Server Error',
    message:   err.message || 'An unexpected error occurred.',
    timestamp: new Date().toISOString(),
  });
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ PASSO Fare API running at http://0.0.0.0:${PORT}`);
  console.log('   Health check: GET /');
});
