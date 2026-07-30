// backend/routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const asyncHandler = require('../utils/asyncHandler');

// Route publique, sans authentification
router.post('/', asyncHandler(contactController.envoyer));

module.exports = router;
