/**
 * backend/resources/fares/fares.router.js
 * Routes for fare CRUD endpoints.
 */

const express = require('express');
const router = express.Router();
const faresController = require('./fares.controller');
const { validateFareInput } = require('../../middlewares/validation');

router.get('/', faresController.getAllFares);
router.get('/:id', faresController.getFareById);
router.post('/', (req, res) => {
  const errors = validateFareInput(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  return faresController.createFare(req, res);
});

router.put('/:id', (req, res) => {
  const errors = validateFareInput(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  return faresController.updateFare(req, res);
});

router.delete('/:id', faresController.deleteFare);

module.exports = router;
