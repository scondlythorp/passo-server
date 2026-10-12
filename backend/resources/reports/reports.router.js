/**
 * backend/resources/reports/reports.router.js
 * Endpoints for Overcharge Reporting & Commuter Feedback.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyAdmin } = require('../../middlewares/auth');

const REPORTS_FILE = path.join(__dirname, '../../../data/reports.json');

function getReports() {
  if (fs.existsSync(REPORTS_FILE)) {
    return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf-8'));
  }
  return [];
}

function saveReports(reports) {
  const dir = path.dirname(REPORTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
}

router.get('/', (req, res) => {
  try {
    const reports = getReports();
    res.status(200).json({ count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read reports', message: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { route, vehicleType, officialPrice, priceCharged, plateNumber, notes } = req.body;

    if (!route || typeof route !== 'string' || !route.trim()) {
      return res.status(400).json({ error: 'Route description is required.' });
    }
    if (!priceCharged || Number(priceCharged) <= 0) {
      return res.status(400).json({ error: 'Price charged must be a positive number.' });
    }

    const reports = getReports();
    const maxId = reports.reduce((max, r) => (r.id > max ? r.id : max), 0);

    const newReport = {
      id: maxId + 1,
      route: route.trim(),
      vehicleType: vehicleType || 'Unspecified',
      officialPrice: Number(officialPrice) || null,
      priceCharged: Number(priceCharged),
      overchargeAmount: officialPrice ? Math.max(0, Number(priceCharged) - Number(officialPrice)) : null,
      plateNumber: plateNumber ? plateNumber.trim().toUpperCase() : 'NOT PROVIDED',
      dateTime: new Date().toISOString(),
      notes: notes ? notes.trim() : '',
      status: 'Under Review',
      reportedBy: 'Commuter Feedback',
    };

    reports.unshift(newReport);
    saveReports(reports);

    res.status(201).json({
      message: 'Overcharge report submitted successfully. Thank you for protecting commuter rights.',
      report: newReport,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report', message: err.message });
  }
});

router.patch('/:id/resolve', verifyAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { resolutionNote } = req.body;
    const reports = getReports();
    const index = reports.findIndex((r) => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: `Report ${id} not found.` });
    }

    reports[index].status = 'Resolved';
    reports[index].resolutionNote = resolutionNote || 'Action taken by transport union inspector.';
    reports[index].resolvedAt = new Date().toISOString();
    saveReports(reports);

    res.status(200).json(reports[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report', message: err.message });
  }
});

module.exports = router;
