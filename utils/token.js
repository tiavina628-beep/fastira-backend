// backend/utils/token.js
// Génère le "token" que le frontend garde après une connexion réussie,
// et qui doit être envoyé avec chaque requête vers les pages protégées.

const jwt = require('jsonwebtoken');
require('dotenv').config();

function genererToken(utilisateur) {
  // On ne met JAMAIS le mot de passe dans le token, seulement l'identité et le rôle
  return jwt.sign(
    { id: utilisateur.id, role: utilisateur.role, email: utilisateur.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifierToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { genererToken, verifierToken };
