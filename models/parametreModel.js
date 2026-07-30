// backend/models/parametreModel.js
// Paramètres généraux clé/valeur de la plateforme, modifiables par l'administration
// (ex : numéro Mobile Money de Fastira affiché aux clients sur la page de paiement).

const db = require('../config/db');

const parametreModel = {
  async obtenir(cle, valeurParDefaut = null) {
    const { rows } = await db.query('SELECT valeur FROM parametres WHERE cle = $1', [cle]);
    return rows[0] ? rows[0].valeur : valeurParDefaut;
  },

  async definir(cle, valeur) {
    await db.query(
      `INSERT INTO parametres (cle, valeur) VALUES ($1, $2)
       ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur`,
      [cle, valeur]
    );
    return valeur;
  },

  async tous() {
    const { rows } = await db.query('SELECT cle, valeur FROM parametres');
    return rows.reduce((acc, r) => ({ ...acc, [r.cle]: r.valeur }), {});
  }
};

module.exports = parametreModel;
