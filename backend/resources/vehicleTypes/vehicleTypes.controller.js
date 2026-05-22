/**
 * backend/resources/vehicleTypes/vehicleTypes.controller.js
 * Controller logic for vehicle type endpoints.
 */

const { getVehicleTypes: fetchVehicleTypes } = require('./vehicleTypes.db');

function getVehicleTypes(req, res) {
  res.status(200).json({ vehicleTypes: fetchVehicleTypes() });
}

module.exports = { getVehicleTypes };
