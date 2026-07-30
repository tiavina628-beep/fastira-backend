// backend/middlewares/authMiddleware.js
// Vérifie que la requête contient un token valide (donc que l'utilisateur est connecté).
// Utilisé devant TOUTES les routes qui nécessitent d'être connecté(e).

const { verifierToken } = require('../utils/token');

function estConnecte(req, res, next) {
  const enTete = req.headers.authorization; // format attendu : "Bearer eyJhbGciOi..."

  if (!enTete || !enTete.startsWith('Bearer ')) {
    return res.status(401).json({ erreur: 'Connexion requise.' });
  }

  const token = enTete.split(' ')[1];

  try {
    const donnees = verifierToken(token);
    req.utilisateur = donnees; // { id, role, email } disponible dans les routes suivantes
    next();
  } catch (err) {
    return res.status(401).json({ erreur: 'Session invalide ou expirée, veuillez vous reconnecter.' });
  }
}

module.exports = { estConnecte };
