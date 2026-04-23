/**
 * ============================================================
 * passo-server/middleware/validate.js — Checkpoint 1d.5
 * ============================================================
 * Validation rules for fare records.
 *
 * Rules enforced:
 *  1. price must be a positive number
 *  2. "from" and "to" cannot be the same locality
 *  3. vehicleType must be one of the allowed types
 * ============================================================
 */

const { VEHICLE_TYPES } = require('../data/fares');

/**
 * validateFareInput(body, requireAll)
 *
 * @param {object}  body        - req.body
 * @param {boolean} requireAll  - true for POST, false for PUT
 * @returns {string[]}          - array of error messages
 */
function validateFareInput(body, requireAll = true) {
  const errors = [];
  const { from, to, vehicleType, price } = body;

  // ── from ──────────────────────────────────────────────────
  if (requireAll && from === undefined) {
    errors.push('"from" is required.');
  } else if (from !== undefined && (typeof from !== 'string' || from.trim() === '')) {
    errors.push('"from" must be a non-empty string.');
  }

  // ── to ────────────────────────────────────────────────────
  if (requireAll && to === undefined) {
    errors.push('"to" is required.');
  } else if (to !== undefined && (typeof to !== 'string' || to.trim() === '')) {
    errors.push('"to" must be a non-empty string.');
  }

  // ── "from" and "to" cannot be the same ───────────────────
  // Only checked when both are provided (could be partial PUT)
  if (from && to && from.trim().toLowerCase() === to.trim().toLowerCase()) {
    errors.push('"from" and "to" cannot be the same locality.');
  }

  // ── vehicleType ───────────────────────────────────────────
  if (requireAll && vehicleType === undefined) {
    errors.push('"vehicleType" is required.');
  } else if (vehicleType !== undefined && !VEHICLE_TYPES.includes(vehicleType)) {
    errors.push(`"vehicleType" must be one of: ${VEHICLE_TYPES.join(', ')}.`);
  }

  // ── price ─────────────────────────────────────────────────
  if (requireAll && price === undefined) {
    errors.push('"price" is required.');
  } else if (price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      errors.push('"price" must be a positive number.');
    }
  }

  return errors;
}

module.exports = { validateFareInput };
