/**
 * ============================================================
 * passo-server/data/fares.js
 * ============================================================
 * In-memory dataset of transport fares in The Gambia.
 *
 * Each fare record contains:
 *  - id          : unique number
 *  - from        : departure locality
 *  - to          : destination locality
 *  - vehicleType : mode of transport
 *  - price       : fare in Dalasi (GMD)
 * ============================================================
 */

// ── Seed fares ───────────────────────────────────────────────
let fares = [
  { id: 1,  from: 'Banjul',      to: 'Serekunda',   vehicleType: 'Bus',       price: 15  },
  { id: 2,  from: 'Banjul',      to: 'Serekunda',   vehicleType: 'Gelegele',  price: 12  },
  { id: 3,  from: 'Banjul',      to: 'Serekunda',   vehicleType: '7-Seater',  price: 18  },
  { id: 4,  from: 'Banjul',      to: 'Serekunda',   vehicleType: 'Taxi',      price: 100 },
  { id: 5,  from: 'Serekunda',   to: 'Brikama',     vehicleType: 'Bus',       price: 20  },
  { id: 6,  from: 'Serekunda',   to: 'Brikama',     vehicleType: 'Gelegele',  price: 15  },
  { id: 7,  from: 'Serekunda',   to: 'Brikama',     vehicleType: '7-Seater',  price: 22  },
  { id: 8,  from: 'Serekunda',   to: 'Brikama',     vehicleType: 'Taxi',      price: 150 },
  { id: 9,  from: 'Brikama',     to: 'Soma',        vehicleType: 'Bus',       price: 75  },
  { id: 10, from: 'Brikama',     to: 'Soma',        vehicleType: '7-Seater',  price: 90  },
  { id: 11, from: 'Brikama',     to: 'Soma',        vehicleType: 'Taxi',      price: 400 },
  { id: 12, from: 'Soma',        to: 'Farafenni',   vehicleType: 'Bus',       price: 40  },
  { id: 13, from: 'Soma',        to: 'Farafenni',   vehicleType: 'Gelegele',  price: 30  },
  { id: 14, from: 'Soma',        to: 'Farafenni',   vehicleType: '7-Seater',  price: 50  },
  { id: 15, from: 'Serekunda',   to: 'Lamin',       vehicleType: 'Gelegele',  price: 10  },
  { id: 16, from: 'Serekunda',   to: 'Lamin',       vehicleType: '7-Seater',  price: 13  },
  { id: 17, from: 'Serekunda',   to: 'Lamin',       vehicleType: 'Taxi',      price: 80  },
  { id: 18, from: 'Banjul',      to: 'Brikama',     vehicleType: 'Bus',       price: 30  },
  { id: 19, from: 'Banjul',      to: 'Brikama',     vehicleType: 'Taxi',      price: 200 },
  { id: 20, from: 'Lamin',       to: 'Brikama',     vehicleType: 'Gelegele',  price: 8   },
];

let nextId = 21; // next available ID for new records

// ── Allowed vehicle types ─────────────────────────────────────
// Exported so validation middleware can import from a single source
const VEHICLE_TYPES = ['Taxi', 'Bus', 'Gelegele', '7-Seater'];

// ── Data access helpers ───────────────────────────────────────

const getAll    = ()      => [...fares];
const getById   = (id)    => fares.find((f) => f.id === id);

const create = (data) => {
  const fare = { id: nextId++, ...data };
  fares.push(fare);
  return fare;
};

const update = (id, updates) => {
  const idx = fares.findIndex((f) => f.id === id);
  if (idx === -1) return null;
  fares[idx] = { ...fares[idx], ...updates };
  return fares[idx];
};

const remove = (id) => {
  const before = fares.length;
  fares = fares.filter((f) => f.id !== id);
  return fares.length < before;
};

module.exports = { getAll, getById, create, update, remove, VEHICLE_TYPES };
