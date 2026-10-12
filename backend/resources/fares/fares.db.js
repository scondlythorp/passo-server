/**
 * backend/resources/fares/fares.db.js
 * Persistent storage engine for official Gambian transport fares.
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../../data/fares.json');

const VEHICLE_TYPES = ['Taxi', 'Bus', 'Gelegele', '7-Seater'];

let fares = [];
let nextId = 21;

function loadFares() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      fares = JSON.parse(raw);
      const maxId = fares.reduce((max, f) => (f.id > max ? f.id : max), 0);
      nextId = maxId + 1;
    } else {
      saveFares();
    }
  } catch (err) {
    console.error('Error reading fares data file, using memory fallback:', err);
  }
}

function saveFares() {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(fares, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save fares to file:', err);
  }
}

// Initial load
loadFares();

function getAll() {
  return [...fares];
}

function getById(id) {
  return fares.find((f) => f.id === id);
}

function create(data) {
  const fare = {
    id: nextId++,
    revisionRef: data.revisionRef || 'MOTWI-2026-A',
    effectiveDate: data.effectiveDate || new Date().toISOString().split('T')[0],
    stage: data.stage || 'Direct',
    ...data,
  };
  fares.push(fare);
  saveFares();
  return fare;
}

function update(id, updates) {
  const idx = fares.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  fares[idx] = { ...fares[idx], ...updates, updatedAt: new Date().toISOString() };
  saveFares();
  return fares[idx];
}

function remove(id) {
  const before = fares.length;
  fares = fares.filter((f) => f.id !== id);
  const deleted = fares.length < before;
  if (deleted) saveFares();
  return deleted;
}

/**
 * Bidirectional search & multi-stage corridor router
 * Computes direct and transfer options between any two localities.
 */
function calculateRoute(from, to, vehicleType = 'All') {
  if (!from || !to) return { direct: [], multiStage: [] };
  const cleanFrom = from.trim().toLowerCase();
  const cleanTo = to.trim().toLowerCase();

  // 1. Direct or reverse match
  const direct = fares.filter((f) => {
    const isDirect = f.from.toLowerCase() === cleanFrom && f.to.toLowerCase() === cleanTo;
    const isReverse = f.from.toLowerCase() === cleanTo && f.to.toLowerCase() === cleanFrom;
    const vehicleMatches = vehicleType === 'All' || f.vehicleType === vehicleType;
    return (isDirect || isReverse) && vehicleMatches;
  }).map((f) => ({
    ...f,
    isBidirectional: f.from.toLowerCase() !== cleanFrom,
  }));

  // 2. Intermediate Multi-Stage Route (Transfer Route) if no direct or as alternative options
  const multiStage = [];
  // Potential transfer hubs
  const hubs = ['Serekunda', 'Brikama', 'Lamin', 'Soma'];

  for (const hub of hubs) {
    if (hub.toLowerCase() === cleanFrom || hub.toLowerCase() === cleanTo) continue;

    // Leg 1: from -> hub
    const leg1Options = fares.filter((f) => {
      const match = (f.from.toLowerCase() === cleanFrom && f.to.toLowerCase() === hub.toLowerCase()) ||
                    (f.from.toLowerCase() === hub.toLowerCase() && f.to.toLowerCase() === cleanFrom);
      return match && (vehicleType === 'All' || f.vehicleType === vehicleType);
    });

    // Leg 2: hub -> to
    const leg2Options = fares.filter((f) => {
      const match = (f.from.toLowerCase() === hub.toLowerCase() && f.to.toLowerCase() === cleanTo) ||
                    (f.from.toLowerCase() === cleanTo && f.to.toLowerCase() === hub.toLowerCase());
      return match && (vehicleType === 'All' || f.vehicleType === vehicleType);
    });

    if (leg1Options.length > 0 && leg2Options.length > 0) {
      for (const leg1 of leg1Options) {
        for (const leg2 of leg2Options) {
          multiStage.push({
            transferHub: hub,
            vehicleType: leg1.vehicleType === leg2.vehicleType ? leg1.vehicleType : `${leg1.vehicleType} + ${leg2.vehicleType}`,
            totalPrice: leg1.price + leg2.price,
            legs: [
              { from: from, to: hub, price: leg1.price, vehicleType: leg1.vehicleType },
              { from: hub, to: to, price: leg2.price, vehicleType: leg2.vehicleType },
            ],
            notes: `Change vehicle at ${hub} Car Park`,
          });
        }
      }
    }
  }

  // Deduplicate and sort multi-stage options
  multiStage.sort((a, b) => a.totalPrice - b.totalPrice);

  return { direct, multiStage: multiStage.slice(0, 5) };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  calculateRoute,
  VEHICLE_TYPES,
};
