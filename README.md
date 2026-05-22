# PASSO Transport Fare API

A RESTful API for managing transport fares in The Gambia. This repo uses a structured backend layout with separate resource routers, controllers, and validation middleware.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Test Requests](#test-requests)
- [Validation Rules](#validation-rules)
- [Error Handling](#error-handling)
- [Technology Stack](#technology-stack)

---

## Overview

This API provides transport fare data and lookup endpoints for localities, vehicle types, fare statistics, and full CRUD operations on fare records.

**Base URL:** `http://localhost:4003`

---

## Project Structure

```
passo-express/
 backend/
    config/
       prisma.js
    lib/
       helpers/
       middlewares/
          validation.js
       utils/
    prisma/
    resources/
        fares/
           fares.controller.js
           fares.db.js
           fares.router.js
        localities/
           localities.controller.js
           localities.router.js
        vehicleTypes/
            vehicleTypes.controller.js
            vehicleTypes.router.js
 routes/
    index.js
 test.http
 server.js
 package.json
 README.md
```

---

## Installation

Install project dependencies:

```bash
npm install
```

Create a `.env` file in the project root with the MongoDB connection settings:

```dotenv
PORT=4003
NODE_ENV=development
MONGODB_URI=mongodb+srv://modoulaminthorp4_db_user:scondly@cluster0.1bnlky5.mongodb.net/
MONGODB_DB=passo-express
```

---

## Running the Server

Start the server using nodemon for development:

```bash
npm run dev
```

Or run directly:

```bash
npm start
```

---

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Returns service metadata and available endpoints |

### Lookup Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/localities` | List all unique localities |
| GET | `/api/vehicle-types` | List supported vehicle types |
| GET | `/api/stats` | Return aggregated fare statistics |

### Fare CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fares` | Get all fares |
| GET | `/api/fares/:id` | Get a fare by ID |
| POST | `/api/fares` | Create a new fare |
| PUT | `/api/fares/:id` | Update an existing fare |
| DELETE | `/api/fares/:id` | Delete a fare |

---

## Test Requests

Use the included `test.http` file with VS Code REST Client or another HTTP client to exercise all endpoints.

Example POST body for `/api/fares`:

```json
{
  "from": "Banjul",
  "to": "Serekunda",
  "vehicleType": "Bus",
  "price": 15
}
```

---

## Validation Rules

- `from` must be a non-empty string
- `to` must be a non-empty string
- `from` and `to` cannot be the same locality
- `vehicleType` must be one of: `Taxi`, `Bus`, `Gelegele`, `7-Seater`
- `price` must be a positive number

---

## Error Handling

The API returns structured JSON errors with an HTTP status code and timestamp.

Example error response:

```json
{
  "error": "Bad Request",
  "message": "Validation Failed",
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

---

## Technology Stack

- Node.js
- Express
- nodemon (development)

---

## Notes

Legacy top-level route and data files were removed in favor of the current `backend/resources` architecture.
