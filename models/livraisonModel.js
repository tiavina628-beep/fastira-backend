// backend/models/livraisonModel.js
const db = require('../config/db');

function genererNumero() {
  const annee = new Date().getFullYear();
  const suffixe = Math.floor(10000 + Math.random() * 89999);
  return `FST-${annee}-${suffixe}`;
}

const livraisonModel = {
  async creer(donnees) {
    const numero = genererNumero();
    const { rows } = await db.query(
      `INSERT INTO livraisons
        (numero, client_id, nom_expediteur, telephone_expediteur, nom_destinataire, telephone_destinataire,
         province, ville, quartier, adresse_precise, description_colis, poids_kg, valeur_estimee,
         urgence, photo_colis, commentaire, prix, commission)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        numero, donnees.client_id, donnees.nom_expediteur, donnees.telephone_expediteur,
        donnees.nom_destinataire, donnees.telephone_destinataire, donnees.province, donnees.ville,
        donnees.quartier, donnees.adresse_precise, donnees.description_colis, donnees.poids_kg,
        donnees.valeur_estimee, donnees.urgence, donnees.photo_colis, donnees.commentaire,
        donnees.prix, donnees.commission
      ]
    );
    return { id: rows[0].id, numero };
  },

  async trouverParId(id) {
    const { rows } = await db.query('SELECT * FROM livraisons WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async listerParClient(clientId) {
    const { rows } = await db.query('SELECT * FROM livraisons WHERE client_id = $1 ORDER BY cree_le DESC', [clientId]);
    return rows;
  },

  async listerDisponiblesParProvince(province) {
    const { rows } = await db.query(
      `SELECT * FROM livraisons WHERE province = $1 AND statut = 'en_attente' AND livreur_id IS NULL
       ORDER BY cree_le DESC`,
      [province]
    );
    return rows;
  },

  async listerParLivreur(livreurId) {
    const { rows } = await db.query('SELECT * FROM livraisons WHERE livreur_id = $1 ORDER BY cree_le DESC', [livreurId]);
    return rows;
  },

  async attribuerLivreur(livraisonId, livreurId) {
    return db.query('UPDATE livraisons SET livreur_id = $1 WHERE id = $2', [livreurId, livraisonId]);
  },

  async changerStatut(livraisonId, statut) {
    await db.query('UPDATE livraisons SET statut = $1 WHERE id = $2', [statut, livraisonId]);
    await db.query('INSERT INTO chronologie_livraisons (livraison_id, etape) VALUES ($1, $2)', [livraisonId, statut]);
  },

  async chronologie(livraisonId) {
    const { rows } = await db.query(
      'SELECT * FROM chronologie_livraisons WHERE livraison_id = $1 ORDER BY date_etape ASC',
      [livraisonId]
    );
    return rows;
  },

  async toutesPourAdmin({ statut, province } = {}) {
    let requete = 'SELECT * FROM livraisons WHERE 1=1';
    const params = [];
    if (statut) { params.push(statut); requete += ` AND statut = $${params.length}`; }
    if (province) { params.push(province); requete += ` AND province = $${params.length}`; }
    requete += ' ORDER BY cree_le DESC';
    const { rows } = await db.query(requete, params);
    return rows;
  },

  async compterTotal() {
    const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM livraisons');
    return rows[0].total;
  }
};

module.exports = livraisonModel;
