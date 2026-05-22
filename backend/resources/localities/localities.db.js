/**
 * backend/resources/localities/localities.db.js
 * Data source helper for locality lookup.
 */

const faresDb = require('../fares/fares.db');

function getLocalities() {
  const fares = faresDb.getAll();
  const locationSet = new Set();

  fares.forEach((fare) => {
    locationSet.add(fare.from);
    locationSet.add(fare.to);
  });

  return [...locationSet].sort();
}

module.exports = { getLocalities };
