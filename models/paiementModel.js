// backend/models/paiementModel.js
const db = require('../config/db');

const paiementModel = {
  async creer({ livraison_id, moyen, montant, reference_transaction, preuve_paiement }) {
    const { rows } = await db.query(
      `INSERT INTO paiements (livraison_id, moyen, montant, reference_transaction, preuve_paiement, statut)
       VALUES ($1, $2, $3, $4, $5, 'retenu')
       RETURNING id`,
      [livraison_id, moyen, montant, reference_transaction || null, preuve_paiement || null]
    );
    return rows[0].id;
  },

  async libererPourLivraison(livraisonId) {
    return db.query(`UPDATE paiements SET statut = 'libere' WHERE livraison_id = $1`, [livraisonId]);
  },

  async parLivraison(livraisonId) {
    const { rows } = await db.query('SELECT * FROM paiements WHERE livraison_id = $1', [livraisonId]);
    return rows[0] || null;
  },

  async tous() {
    // Utilisé par l'administration pour vérifier les preuves de paiement (référence + capture d'écran)
    const { rows } = await db.query(`
      SELECT p.*, l.numero AS numero_livraison, l.nom_destinataire
      FROM paiements p
      JOIN livraisons l ON l.id = p.livraison_id
      ORDER BY p.cree_le DESC
    `);
    return rows;
  },

  async totalTraite() {
    const { rows } = await db.query('SELECT COALESCE(SUM(montant), 0)::int AS total FROM paiements');
    return rows[0].total;
  },

  // --- Retraits livreurs ---
  SEUIL_RETRAIT: 20000,

  async demanderRetrait(livreurId, montant) {
    const { rows } = await db.query(
      `INSERT INTO retraits (livreur_id, montant, statut) VALUES ($1, $2, 'en_attente') RETURNING id`,
      [livreurId, montant]
    );
    return rows[0].id;
  },

  async listerRetraitsEnAttente() {
    const { rows } = await db.query(`SELECT * FROM retraits WHERE statut = 'en_attente' ORDER BY demande_le DESC`);
    return rows;
  },

  async marquerRetraitTraite(id) {
    return db.query(`UPDATE retraits SET statut = 'traite' WHERE id = $1`, [id]);
  }
};

module.exports = paiementModel;
