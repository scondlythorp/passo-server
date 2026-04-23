/**
 * ============================================================
 * passo-server/routes/fares.js — Checkpoints 1d.4 & 1d.5
 * ============================================================
 * All fare-related endpoints:
 *
 *  Lookup helpers
 *   GET  /api/localities      – unique place names
 *   GET  /api/vehicle-types   – supported vehicle types
 *   GET  /api/stats           – aggregated fare statistics
 *
 *  CRUD
 *   GET    /api/fares          – all fares
 *   GET    /api/fares/:id      – single fare
 *   POST   /api/fares          – create fare
 *   PUT    /api/fares/:id      – update fare
 *   DELETE /api/fares/:id      – remove fare
 * ============================================================
 */

const express = require('express');
const router  = express.Router();

const db = require('../data/fares');
const { validateFareInput } = require('../middleware/validate');

// ═══════════════════════════════════════════════════════════
//  LOOKUP HELPERS (Checkpoint 1d.4)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/localities
 * Returns every unique locality that appears as a "from" or "to"
 * in the fares dataset, sorted alphabetically.
 */
router.get('/localities', (req, res) => {
  const fares = db.getAll();

  // Collect all place names into a Set to deduplicate automatically
  const locationSet = new Set();
  fares.forEach((f) => {
    locationSet.add(f.from);
    locationSet.add(f.to);
  });

  res.status(200).json({
    count: locationSet.size,
    localities: [...locationSet].sort(), // spread Set → Array, then sort
  });
});

/**
 * GET /api/vehicle-types
 * Returns the list of allowed vehicle types (from the data module).
 */
router.get('/vehicle-types', (req, res) => {
  res.status(200).json({
    vehicleTypes: db.VEHICLE_TYPES,
  });
});

/**
 * GET /api/stats
 * Computes and returns summary statistics across all fares:
 *  - totalFares        : how many fare records exist
 *  - averagePrice      : mean price rounded to 2 decimal places
 *  - mostExpensiveRoute: the single highest-priced fare record
 *  - cheapestVehicle   : the vehicle type with the lowest average price
 */
router.get('/stats', (req, res) => {
  const fares = db.getAll();

  // Guard: no fares yet
  if (fares.length === 0) {
    return res.status(200).json({ message: 'No fares in the system yet.' });
  }

  // ── Total & average ───────────────────────────────────────
  const totalFares   = fares.length;
  const totalPrice   = fares.reduce((sum, f) => sum + f.price, 0);
  const averagePrice = parseFloat((totalPrice / totalFares).toFixed(2));

  // ── Most expensive single route ───────────────────────────
  // reduce finds the fare object with the highest price
  const mostExpensiveRoute = fares.reduce(
    (max, f) => (f.price > max.price ? f : max),
    fares[0]
  );

  // ── Cheapest vehicle type ─────────────────────────────────
  // Build a map: { vehicleType → [prices] }, then compute per-type average
  const pricesByType = {};
  fares.forEach((f) => {
    if (!pricesByType[f.vehicleType]) pricesByType[f.vehicleType] = [];
    pricesByType[f.vehicleType].push(f.price);
  });

  // Convert to array of { type, avgPrice } objects
  const typeAverages = Object.entries(pricesByType).map(([type, prices]) => ({
    type,
    avgPrice: parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)),
  }));

  // Sort ascending and take the first (cheapest)
  const cheapestVehicle = typeAverages.sort((a, b) => a.avgPrice - b.avgPrice)[0];

  res.status(200).json({
    totalFares,
    averagePrice,
    mostExpensiveRoute,
    cheapestVehicle,
  });
});

// ═══════════════════════════════════════════════════════════
//  CRUD ENDPOINTS
// ═══════════════════════════════════════════════════════════

/** GET /api/fares — return all fare records */
router.get('/', (req, res) => {
  const fares = db.getAll();
  res.status(200).json({ count: fares.length, fares });
});

/** GET /api/fares/:id — return a single fare */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID must be a number.' });

  const fare = db.getById(id);
  if (!fare) return res.status(404).json({ error: `Fare ${id} not found.` });

  res.status(200).json(fare);
});

/**
 * POST /api/fares
 * Creates a new fare. All fields required. Validation rules applied.
 */
router.post('/', (req, res) => {
  const errors = validateFareInput(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  const { from, to, vehicleType, price } = req.body;
  const newFare = db.create({
    from: from.trim(),
    to: to.trim(),
    vehicleType,
    price: Number(price),
  });

  res.status(201).json(newFare);
});

/**
 * PUT /api/fares/:id
 * Partially updates an existing fare. Validation applied to supplied fields.
 */
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID must be a number.' });

  if (!db.getById(id)) {
    return res.status(404).json({ error: `Fare ${id} not found.` });
  }

  const errors = validateFareInput(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Build update object from only the supplied fields
  const { from, to, vehicleType, price } = req.body;
  const updates = {};
  if (from        !== undefined) updates.from        = from.trim();
  if (to          !== undefined) updates.to          = to.trim();
  if (vehicleType !== undefined) updates.vehicleType = vehicleType;
  if (price       !== undefined) updates.price       = Number(price);

  const updated = db.update(id, updates);
  res.status(200).json(updated);
});

/** DELETE /api/fares/:id */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID must be a number.' });

  const deleted = db.remove(id);
  if (!deleted) return res.status(404).json({ error: `Fare ${id} not found.` });

  res.status(200).json({ message: `Fare ${id} deleted successfully.` });
});

module.exports = router;
