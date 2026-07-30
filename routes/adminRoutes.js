// backend/routes/adminRoutes.js
//
// C'EST ICI QUE L'ADMINISTRATION EST PROTEGEE.
// router.use() applique les deux middlewares à TOUTES les routes de ce fichier,
// dans l'ordre : d'abord "est-ce que la personne est connectée ?",
// puis "est-ce que cette personne connectée a le rôle admin ?"
// Un client ou un livreur connecté recevra une erreur 403 sur n'importe laquelle
// de ces routes, même en connaissant l'URL exacte.

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { estConnecte } = require('../middlewares/authMiddleware');
const { estAdmin } = require('../middlewares/adminMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(estConnecte, estAdmin);

router.get('/statistiques', asyncHandler(adminController.statistiques));
router.get('/livreurs-en-attente', asyncHandler(adminController.livreursEnAttente));
router.post('/livreurs/:id/valider', asyncHandler(adminController.validerLivreur));
router.post('/livreurs/:id/refuser', asyncHandler(adminController.refuserLivreur));
router.get('/livraisons', asyncHandler(adminController.toutesLivraisons));
router.get('/retraits-en-attente', asyncHandler(adminController.retraitsEnAttente));
router.post('/retraits/:id/traiter', asyncHandler(adminController.traiterRetrait));
router.get('/tarifs', asyncHandler(adminController.tarifs));
router.patch('/tarifs/:id', asyncHandler(adminController.modifierTarif));
router.get('/messages-contact', asyncHandler(adminController.messagesContact));
router.get('/paiements', asyncHandler(adminController.paiements));
router.get('/parametres', asyncHandler(adminController.obtenirParametres));
router.patch('/parametres', asyncHandler(adminController.modifierParametres));

module.exports = router;
