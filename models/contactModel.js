// backend/models/contactModel.js
// Requêtes SQL liées aux messages envoyés depuis le formulaire de contact public.

const db = require('../config/db');

const contactModel = {
  async creer({ nom_complet, telephone, email, sujet, message }) {
    const { rows } = await db.query(
      `INSERT INTO messages_contact (nom_complet, telephone, email, sujet, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [nom_complet, telephone, email, sujet, message]
    );
    return rows[0].id;
  },

  async tousLesMessages() {
    const { rows } = await db.query('SELECT * FROM messages_contact ORDER BY cree_le DESC');
    return rows;
  },

  async marquerTraite(id) {
    return db.query('UPDATE messages_contact SET traite = TRUE WHERE id = $1', [id]);
  }
};

module.exports = contactModel;
