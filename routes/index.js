const express = require('express');
const router = express.Router();

const faresRouter = require('../backend/resources/fares/fares.router');
const localitiesRouter = require('../backend/resources/localities/localities.router');
const vehicleTypesRouter = require('../backend/resources/vehicleTypes/vehicleTypes.router');
const terminalsRouter = require('../backend/resources/terminals/terminals.router');
const revisionsRouter = require('../backend/resources/revisions/revisions.router');
const reportsRouter = require('../backend/resources/reports/reports.router');
const authRouter = require('../backend/resources/auth/auth.router');
const ussdRouter = require('../backend/resources/ussd/ussd.router');
const { getStats } = require('../backend/resources/fares/fares.controller');

router.use('/fares', faresRouter);
router.use('/localities', localitiesRouter);
router.use('/vehicle-types', vehicleTypesRouter);
router.use('/terminals', terminalsRouter);
router.use('/revisions', revisionsRouter);
router.use('/reports', reportsRouter);
router.use('/auth', authRouter);
router.use('/ussd', ussdRouter);
router.get('/stats', getStats);

module.exports = router;
