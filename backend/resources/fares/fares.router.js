/**
 * backend/resources/fares/fares.router.js
 * Routes for fare CRUD and calculation endpoints.
 */

const express = require('express');
const router = express.Router();
const faresController = require('./fares.controller');
const { validateFareInput } = require('../../middlewares/validation');
const { verifyAdmin } = require('../../middlewares/auth');

router.get('/', faresController.getAllFares);
router.get('/calculate', faresController.calculateRoute);
router.get('/:id', faresController.getFareById);

// Protected routes requiring Ministry / GTU Admin authentication
router.post('/', verifyAdmin, (req, res, next) => {
  const errors = validateFareInput(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  return faresController.createFare(req, res, next);
});

router.put('/:id', verifyAdmin, (req, res, next) => {
  const errors = validateFareInput(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Failed',
      messages: errors,
      timestamp: new Date().toISOString(),
    });
  }

  return faresController.updateFare(req, res, next);
});

router.delete('/:id', verifyAdmin, faresController.deleteFare);

module.exports = router;
