// backend/middlewares/uploadMiddleware.js
// Gère l'enregistrement des fichiers envoyés (photo de profil, CIN recto/verso,
// selfie, photo du colis). Les fichiers sont stockés dans backend/uploads/
// et servis ensuite en statique par server.js.

const multer = require('multer');
const path = require('path');

const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const suffixeUnique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${suffixeUnique}${path.extname(file.originalname)}`);
  }
});

function filtreFichier(req, file, cb) {
  const typesAutorises = /jpeg|jpg|png|webp/;
  const extensionValide = typesAutorises.test(path.extname(file.originalname).toLowerCase());
  if (extensionValide) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé (JPG, PNG ou WEBP uniquement).'));
  }
}

const upload = multer({
  storage: stockage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max, comme indiqué sur les pages d'inscription
  fileFilter: filtreFichier
});

module.exports = upload;
