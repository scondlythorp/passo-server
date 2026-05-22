/**
 * backend/resources/vehicleTypes/vehicleTypes.router.js
 * Routes for vehicle type lookup.
 */

const express = require('express');
const router = express.Router();
const { getVehicleTypes } = require('./vehicleTypes.controller');

router.get('/', getVehicleTypes);

module.exports = router;
