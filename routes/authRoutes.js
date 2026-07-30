// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middlewares/uploadMiddleware');
const { estConnecte } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

router.post('/inscription-client', asyncHandler(authController.inscriptionClient));

router.post(
  '/inscription-livreur',
  upload.fields([
    { name: 'photo_profil', maxCount: 1 },
    { name: 'photo_cin_recto', maxCount: 1 },
    { name: 'photo_cin_verso', maxCount: 1 },
    { name: 'photo_selfie', maxCount: 1 }
  ]),
  asyncHandler(authController.inscriptionLivreur)
);

router.post('/connexion', asyncHandler(authController.connexion));
router.get('/moi', estConnecte, asyncHandler(authController.monProfil));
router.patch('/moi', estConnecte, asyncHandler(authController.modifierProfil));
router.patch('/moi/photo', estConnecte, upload.single('photo_profil'), asyncHandler(authController.modifierPhotoProfil));

module.exports = router;
