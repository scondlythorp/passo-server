/**
 * backend/resources/localities/localities.router.js
 * Routes for localities lookup.
 */

const express = require('express');
const router = express.Router();
const { getLocalities } = require('./localities.controller');

router.get('/', getLocalities);

module.exports = router;
