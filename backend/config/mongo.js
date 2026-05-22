/**
 * backend/config/mongo.js
 * MongoDB connection helper.
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'passo-server';

const client = new MongoClient(MONGODB_URI);
let db = null;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db(MONGODB_DB);
  await seedFares();
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connect() before using the database.');
  }
  return db;
}

async function seedFares() {
  const collection = db.collection('fares');
  const count = await collection.countDocuments();
  if (count > 0) return;

  const fares = [
    { id: 1, from: 'Banjul', to: 'Serekunda', vehicleType: 'Bus', price: 15 },
    { id: 2, from: 'Banjul', to: 'Serekunda', vehicleType: 'Gelegele', price: 12 },
    { id: 3, from: 'Banjul', to: 'Serekunda', vehicleType: '7-Seater', price: 18 },
    { id: 4, from: 'Banjul', to: 'Serekunda', vehicleType: 'Taxi', price: 100 },
    { id: 5, from: 'Serekunda', to: 'Brikama', vehicleType: 'Bus', price: 20 },
    { id: 6, from: 'Serekunda', to: 'Brikama', vehicleType: 'Gelegele', price: 15 },
    { id: 7, from: 'Serekunda', to: 'Brikama', vehicleType: '7-Seater', price: 22 },
    { id: 8, from: 'Serekunda', to: 'Brikama', vehicleType: 'Taxi', price: 150 },
    { id: 9, from: 'Brikama', to: 'Soma', vehicleType: 'Bus', price: 75 },
    { id: 10, from: 'Brikama', to: 'Soma', vehicleType: '7-Seater', price: 90 },
    { id: 11, from: 'Brikama', to: 'Soma', vehicleType: 'Taxi', price: 400 },
    { id: 12, from: 'Soma', to: 'Farafenni', vehicleType: 'Bus', price: 40 },
    { id: 13, from: 'Soma', to: 'Farafenni', vehicleType: 'Gelegele', price: 30 },
    { id: 14, from: 'Soma', to: 'Farafenni', vehicleType: '7-Seater', price: 50 },
    { id: 15, from: 'Serekunda', to: 'Lamin', vehicleType: 'Gelegele', price: 10 },
    { id: 16, from: 'Serekunda', to: 'Lamin', vehicleType: '7-Seater', price: 13 },
    { id: 17, from: 'Serekunda', to: 'Lamin', vehicleType: 'Taxi', price: 80 },
    { id: 18, from: 'Banjul', to: 'Brikama', vehicleType: 'Bus', price: 30 },
    { id: 19, from: 'Banjul', to: 'Brikama', vehicleType: 'Taxi', price: 200 },
    { id: 20, from: 'Lamin', to: 'Brikama', vehicleType: 'Gelegele', price: 8 },
  ];

  await collection.insertMany(fares);
  await db.collection('counters').updateOne(
    { _id: 'fares' },
    { $set: { seq: fares.length } },
    { upsert: true }
  );
}

module.exports = { connect, getDb };
