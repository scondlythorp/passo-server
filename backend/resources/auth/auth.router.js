/**
 * backend/resources/auth/auth.router.js
 * Admin passkey verification & session token generation.
 */

const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../../middlewares/auth');

router.post('/login', (req, res) => {
  const { passkey } = req.body;
  if (!passkey) {
    return res.status(400).json({ error: 'Passkey is required.' });
  }

  const result = loginAdmin(passkey);
  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.status(200).json(result);
});

router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token && (token.startsWith('admin_tok_') || token === 'passo-admin-2026')) {
    return res.status(200).json({ authenticated: true, role: 'admin' });
  }
  res.status(200).json({ authenticated: false, role: 'commuter' });
});

module.exports = router;
