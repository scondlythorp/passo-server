/**
 * ============================================================
 * passo-server/index.js — Checkpoints 1d.4, 1d.5, 1d.6
 * ============================================================
 * Entry point for the PASSO Transport Fare API.
 *
 * Covers:
 *  1d.4 – Locality, vehicle-type and stats endpoints
 *  1d.5 – Input validation (price > 0, from ≠ to, valid vehicle)
 *  1d.6 – Global structured error handling with timestamps
 * ============================================================
 */

const express = require('express');

const app  = express();
const PORT = 4003;

// ── Global middleware ────────────────────────────────────────

// Parse incoming JSON bodies
app.use(express.json());

// Request logger — logs method, path and timestamp on every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ───────────────────────────────────────────────────

const faresRouter = require('./routes/fares');

// Locality and vehicle-type lookups — mounted BEFORE /api/fares
// so Express matches them before the /:id param route
app.use('/api/localities',    faresRouter);   // re-uses router's /localities sub-path
app.use('/api/vehicle-types', faresRouter);   // re-uses router's /vehicle-types sub-path
app.use('/api/stats',         faresRouter);   // re-uses router's /stats sub-path

// Main fares CRUD
app.use('/api/fares', faresRouter);

// Root health-check
app.get('/', (req, res) => {
  res.status(200).json({
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
});

// ── 404 Handler ──────────────────────────────────────────────
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
app.listen(PORT, () => {
  console.log(`✅ PASSO Fare API running at http://localhost:${PORT}`);
  console.log('   Health check: GET /');
});
