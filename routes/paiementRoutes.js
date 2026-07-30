// backend/routes/paiementRoutes.js
const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');
const { estConnecte } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(estConnecte);

// multipart/form-data : livraison_id, moyen, reference_transaction + fichier "preuve_paiement"
router.post('/', upload.single('preuve_paiement'), asyncHandler(paiementController.payer));
router.post('/retrait', asyncHandler(paiementController.demanderRetrait));
router.get('/numero-reception', asyncHandler(paiementController.numeroReception));

module.exports = router;
