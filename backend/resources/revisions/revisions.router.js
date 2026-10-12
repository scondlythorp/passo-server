/**
 * backend/resources/revisions/revisions.router.js
 * Endpoints for Official Tariff Revisions & Regulatory Effective Dates.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const REVISIONS_FILE = path.join(__dirname, '../../../data/revisions.json');

router.get('/', (req, res) => {
  try {
    if (fs.existsSync(REVISIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVISIONS_FILE, 'utf-8'));
      return res.status(200).json({
        activeNotice: data[0] || null,
        revisions: data,
      });
    }
    res.status(200).json({ activeNotice: null, revisions: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load revisions', message: err.message });
  }
});

module.exports = router;
