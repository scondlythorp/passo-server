/**
 * backend/middlewares/validation.js
 * Validation rules for fare requests.
 */

const { VEHICLE_TYPES } = require('../resources/vehicleTypes/vehicleTypes.db');

function validateFareInput(body, requireAll = true) {
  const errors = [];
  const { from, to, vehicleType, price } = body;

  if (requireAll && from === undefined) {
    errors.push('"from" is required.');
  } else if (from !== undefined && (typeof from !== 'string' || from.trim() === '')) {
    errors.push('"from" must be a non-empty string.');
  }

  if (requireAll && to === undefined) {
    errors.push('"to" is required.');
  } else if (to !== undefined && (typeof to !== 'string' || to.trim() === '')) {
    errors.push('"to" must be a non-empty string.');
  }

  if (from && to && from.trim().toLowerCase() === to.trim().toLowerCase()) {
    errors.push('"from" and "to" cannot be the same locality.');
  }

  if (requireAll && vehicleType === undefined) {
    errors.push('"vehicleType" is required.');
  } else if (vehicleType !== undefined && !VEHICLE_TYPES.includes(vehicleType)) {
    errors.push(`"vehicleType" must be one of: ${VEHICLE_TYPES.join(', ')}.`);
  }

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
