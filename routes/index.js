const express = require('express');
const router = express.Router();

const faresRouter = require('../backend/resources/fares/fares.router');
const localitiesRouter = require('../backend/resources/localities/localities.router');
const vehicleTypesRouter = require('../backend/resources/vehicleTypes/vehicleTypes.router');
const { getStats } = require('../backend/resources/fares/fares.controller');

router.use('/fares', faresRouter);
router.use('/localities', localitiesRouter);
router.use('/vehicle-types', vehicleTypesRouter);
router.get('/stats', getStats);

module.exports = router;
