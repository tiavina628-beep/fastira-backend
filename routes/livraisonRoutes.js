// backend/routes/livraisonRoutes.js
const express = require('express');
const router = express.Router();
const livraisonController = require('../controllers/livraisonController');
const { estConnecte } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const asyncHandler = require('../utils/asyncHandler');

// Toutes les routes de livraison nécessitent d'être connecté (client, livreur ou admin)
router.use(estConnecte);

router.post('/', upload.single('photo_colis'), asyncHandler(livraisonController.creer));
router.get('/mes-commandes', asyncHandler(livraisonController.mesCommandes));
router.get('/disponibles', asyncHandler(livraisonController.disponibles));
router.get('/mes-livraisons', asyncHandler(livraisonController.mesLivraisons));
router.post('/:id/accepter', asyncHandler(livraisonController.accepter));
router.patch('/:id/statut', asyncHandler(livraisonController.changerStatut));
router.get('/:id', asyncHandler(livraisonController.details));

module.exports = router;
