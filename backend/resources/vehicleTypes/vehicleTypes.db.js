/**
 * backend/resources/vehicleTypes/vehicleTypes.db.js
 * Data source helper for supported vehicle types.
 */

const VEHICLE_TYPES = ['Taxi', 'Bus', 'Gelegele', '7-Seater'];

function getVehicleTypes() {
  return [...VEHICLE_TYPES];
}

module.exports = { getVehicleTypes, VEHICLE_TYPES };
