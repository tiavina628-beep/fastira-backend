// backend/models/tarifModel.js
const db = require('../config/db');

const tarifModel = {
  async trouverParType(type) {
    const { rows } = await db.query('SELECT * FROM tarifs WHERE type_livraison = $1', [type]);
    return rows[0] || null;
  },
  async tousLesTarifs() {
    const { rows } = await db.query('SELECT * FROM tarifs');
    return rows;
  },
  async mettreAJour(id, prix_base, commission_pourcentage) {
    return db.query(
      'UPDATE tarifs SET prix_base = $1, commission_pourcentage = $2 WHERE id = $3',
      [prix_base, commission_pourcentage, id]
    );
  }
};

module.exports = tarifModel;
