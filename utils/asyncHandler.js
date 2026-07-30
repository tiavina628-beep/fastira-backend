// backend/utils/asyncHandler.js
// Enveloppe un handler de route async pour que ses erreurs (promesses rejetées)
// soient transmises à next(err) au lieu de faire planter le serveur silencieusement.
// Nécessaire depuis le passage à PostgreSQL (toutes les requêtes en base sont
// maintenant asynchrones) — Express 4 ne rattrape pas seul les rejets de promesses.

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
