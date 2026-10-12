/**
 * backend/resources/terminals/terminals.router.js
 * Endpoints for Car Parks & Transit Terminals Directory.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TERMINALS_FILE = path.join(__dirname, '../../../data/terminals.json');

router.get('/', (req, res) => {
  try {
    if (fs.existsSync(TERMINALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TERMINALS_FILE, 'utf-8'));
      return res.status(200).json({ count: data.length, terminals: data });
    }
    res.status(200).json({ count: 0, terminals: [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load terminals data', message: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    if (fs.existsSync(TERMINALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TERMINALS_FILE, 'utf-8'));
      const terminal = data.find((t) => t.id === req.params.id);
      if (!terminal) {
        return res.status(404).json({ error: `Terminal ${req.params.id} not found.` });
      }
      return res.status(200).json(terminal);
    }
    res.status(404).json({ error: 'Terminal not found.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

module.exports = router;
