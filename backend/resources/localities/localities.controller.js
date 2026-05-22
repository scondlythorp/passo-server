/**
 * backend/resources/localities/localities.controller.js
 * Controller logic for locality endpoints.
 */

const { getLocalities: fetchLocalities } = require('./localities.db');

function getLocalities(req, res, next) {
  try {
    const localities = fetchLocalities();

    res.status(200).json({
      count: localities.length,
      localities,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLocalities };
