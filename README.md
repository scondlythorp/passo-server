# PASSO Transport Fare API

A RESTful API for managing transport fares in The Gambia. Provides endpoints for querying localities, vehicle types, fare statistics, and full CRUD operations on fare records.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Lookup Endpoints](#lookup-endpoints)
  - [Fare CRUD](#fare-crud)
- [Data Model](#data-model)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Technology Stack](#technology-stack)

---

## Overview

This API is part of the PASSO (Passenger and Student Organization) transport fare system. It provides a simple in-memory data store for transport fares between various localities in The Gambia, supporting multiple vehicle types.

**Base URL:** `http://localhost:4003`

---

## Project Structure

```
passo-server/
├── index.js              # Express app entry point
├── package.json          # Project dependencies
├── README.md             # This file
├── data/
│   └── fares.js          # In-memory fare data & helpers
├── middleware/
│   └── validate.js       # Input validation logic
└── routes/
    └── fares.js          # API route handlers
```

---

## Installation

1. Navigate to the project directory:
   ```bash
   cd passo-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## Running the Server

Start the server on port 4003:

```bash
node index.js
```

The server will log requests to the console with timestamps.

---

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Returns service info and available endpoints |

**Example Response:**
```json
{
  "service": "PASSO Transport Fare API",
  "version": "1.0.0",
  "endpoints": {
    "localities": "GET /api/localities",
    "vehicleTypes": "GET /api/vehicle-types",
    "stats": "GET /api/stats",
    "fares": "GET /api/fares",
    "farById": "GET /api/fares/:id",
    "createFare": "POST /api/fares",
    "updateFare": "PUT /api/fares/:id",
    "deleteFare": "DELETE /api/fares/:id"
  }
}
```

---

### Lookup Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/localities` | Get all unique localities (from/to) |
| GET | `/api/vehicle-types` | Get all supported vehicle types |
| GET | `/api/stats` | Get fare statistics |

#### GET /api/localities
Returns all unique place names appearing as departure or destination points.

**Example Response:**
```json
{
  "count": 7,
  "localities": ["Banjul", "Brikama", "Farafenni", "Lamin", "Serekunda", "Soma"]
}
```

#### GET /api/vehicle-types
Returns the list of allowed vehicle types.

**Example Response:**
```json
{
  "vehicleTypes": ["Taxi", "Bus", "Gelegele", "7-Seater"]
}
```

#### GET /api/stats
Returns aggregated statistics across all fares.

**Example Response:**
```json
{
  "totalFares": 20,
  "averagePrice": 68.55,
  "mostExpensiveRoute": {
    "id": 11,
    "from": "Brikama",
    "to": "Soma",
    "vehicleType": "Taxi",
    "price": 400
  },
  "cheapestVehicle": {
    "type": "Gelegele",
    "avgPrice": 13.75
  }
}
```

---

### Fare CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fares` | Get all fares |
| GET | `/api/fares/:id` | Get a single fare by ID |
| POST | `/api/fares` | Create a new fare |
| PUT | `/api/fares/:id` | Update an existing fare |
| DELETE | `/api/fares/:id` | Delete a fare |

#### GET /api/fares
Returns all fare records.

**Example Response:**
```json
{
  "count": 20,
  "fares": [
    { "id": 1, "from": "Banjul", "to": "Serekunda", "vehicleType": "Bus", "price": 15 },
    ...
  ]
}
```

#### GET /api/fares/:id
Returns a single fare by ID.

**Success Response (200):**
```json
{ "id": 1, "from": "Banjul", "to": "Serekunda", "vehicleType": "Bus", "price": 15 }
```

**Error Response (404):**
```json
{ "error": "Fare 1 not found." }
```

#### POST /api/fares
Creates a new fare. All fields are required.

**Request Body:**
```json
{
  "from": "Banjul",
  "to": "Serekunda",
  "vehicleType": "Bus",
  "price": 15
}
```

**Success Response (201):**
```json
{ "id": 21, "from": "Banjul", "to": "Serekunda", "vehicleType": "Bus", "price": 15 }
```

**Validation Error Response (400):**
```json
{
  "error": "Validation Failed",
  "messages": ["\"price\" must be a positive number."],
  "timestamp": "2026-04-23T10:00:00.000Z"
}
```

#### PUT /api/fares/:id
Partially updates an existing fare. Only provided fields are updated.

**Request Body (example - update only price):**
```json
{ "price": 20 }
```

**Success Response (200):**
```json
{ "id": 1, "from": "Banjul", "to": "Serekunda", "vehicleType": "Bus", "price": 20 }
```

#### DELETE /api/fares/:id
Deletes a fare by ID.

**Success Response (200):**
```json
{ "message": "Fare 1 deleted." }
```

**Error Response (404):**
```json
{ "error": "Fare 1 not found." }
```

---

## Data Model

### Fare Record

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique identifier (auto-generated) |
| `from` | String | Departure locality |
| `to` | String | Destination locality |
| `vehicleType` | String | Mode of transport |
| `price` | Number | Fare in Gambian Dalasi (GMD) |

### Supported Vehicle Types

- **Taxi** - Private taxi service
- **Bus** - Public bus
- **Gelegele** - Shared minibus
- **7-Seater** - Large taxi/minivan

### Sample Localities

Banjul, Serekunda, Brikama, Soma, Farafenni, Lamin

---

## Validation Rules

The API enforces the following validation rules (Checkpoint 1d.5):

1. **Price** - Must be a positive number (> 0)
2. **From/To** - Cannot be the same locality (case-insensitive comparison)
3. **Vehicle Type** - Must be one of: `Taxi`, `Bus`, `Gelegele`, `7-Seater`
4. **Required Fields (POST)** - All fields (`from`, `to`, `vehicleType`, `price`) are required
5. **Optional Fields (PUT)** - Only supplied fields are validated

---

## Error Handling

The API implements global structured error handling (Checkpoint 1d.6). All errors return a consistent JSON format:

```json
{
  "error": "Error Type",
  "message": "Human-readable detail",
  "timestamp": "2026-04-23T10:00:00.000Z"
}
```

### Error Types

| Status Code | Error Type |
|-------------|------------|
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js v5.2.1
- **Language:** JavaScript (CommonJS)

---

## License

ISC