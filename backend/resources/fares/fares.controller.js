/**
 * backend/resources/fares/fares.controller.js
 * Controller logic for fares endpoints.
 */

const db = require('./fares.db');

function getAllFares(req, res, next) {
  try {
    const fares = db.getAll();
    res.status(200).json({ count: fares.length, fares });
  } catch (err) {
    next(err);
  }
}

function getFareById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number.' });
    }

    const fare = db.getById(id);
    if (!fare) {
      return res.status(404).json({ error: `Fare ${id} not found.` });
    }

    res.status(200).json(fare);
  } catch (err) {
    next(err);
  }
}

function createFare(req, res, next) {
  try {
    const { from, to, vehicleType, price } = req.body;
    const newFare = db.create({
      from: from.trim(),
      to: to.trim(),
      vehicleType,
      price: Number(price),
    });

    res.status(201).json(newFare);
  } catch (err) {
    next(err);
  }
}

function updateFare(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number.' });
    }

    const existing = db.getById(id);
    if (!existing) {
      return res.status(404).json({ error: `Fare ${id} not found.` });
    }

    const { from, to, vehicleType, price } = req.body;
    const updates = {};
    if (from !== undefined) updates.from = from.trim();
    if (to !== undefined) updates.to = to.trim();
    if (vehicleType !== undefined) updates.vehicleType = vehicleType;
    if (price !== undefined) updates.price = Number(price);

    const updated = db.update(id, updates);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

function deleteFare(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'ID must be a number.' });
    }

    const deleted = db.remove(id);
    if (!deleted) {
      return res.status(404).json({ error: `Fare ${id} not found.` });
    }

    res.status(200).json({ message: `Fare ${id} deleted successfully.` });
  } catch (err) {
    next(err);
  }
}

function getStats(req, res, next) {
  try {
    const fares = db.getAll();
    if (fares.length === 0) {
      return res.status(200).json({ message: 'No fares in the system yet.' });
    }

    const totalFares = fares.length;
    const totalPrice = fares.reduce((sum, f) => sum + f.price, 0);
    const averagePrice = parseFloat((totalPrice / totalFares).toFixed(2));

    const mostExpensiveRoute = fares.reduce(
      (max, f) => (f.price > max.price ? f : max),
      fares[0]
    );

    const pricesByType = {};
    fares.forEach((f) => {
      if (!pricesByType[f.vehicleType]) pricesByType[f.vehicleType] = [];
      pricesByType[f.vehicleType].push(f.price);
    });

    const typeAverages = Object.entries(pricesByType).map(([type, prices]) => ({
      type,
      avgPrice: parseFloat((prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2)),
    }));

    const cheapestVehicle = typeAverages.sort((a, b) => a.avgPrice - b.avgPrice)[0];

    res.status(200).json({
      totalFares,
      averagePrice,
      mostExpensiveRoute,
      cheapestVehicle,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllFares,
  getFareById,
  createFare,
  updateFare,
  deleteFare,
  getStats,
};
