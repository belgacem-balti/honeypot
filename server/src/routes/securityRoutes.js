const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { protect } = require('../middleware/authMiddleware');

// Webhook / direct analysis ingestion (open for Wazuh integration / Honeypot sensors)
router.post('/analyze', securityController.analyze);

// Dashboard view endpoints (protected for dashboard users)
router.get('/alerts', protect, securityController.getAlerts);
router.get('/stats', protect, securityController.getStats);

module.exports = router;
