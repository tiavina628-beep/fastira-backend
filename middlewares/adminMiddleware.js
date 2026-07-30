// backend/middlewares/adminMiddleware.js
// À utiliser APRÈS estConnecte() sur toutes les routes /api/admin/*
// Bloque toute personne dont le rôle n'est pas "admin", même si elle est connectée
// (ex : un client ou un livreur connecté ne doit jamais passer ce contrôle).

function estAdmin(req, res, next) {
  if (!req.utilisateur || req.utilisateur.role !== 'admin') {
    return res.status(403).json({ erreur: 'Accès réservé aux administrateurs.' });
  }
  next();
}

module.exports = { estAdmin };
