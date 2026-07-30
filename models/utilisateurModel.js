// backend/models/utilisateurModel.js
// Toutes les requêtes SQL liées à la table "utilisateurs".
// Les controllers appellent ces fonctions — ils n'écrivent jamais de SQL directement.

const db = require('../config/db');

const LIMITE_LIVREURS_PAR_PROVINCE_DEFAUT = 50;

const utilisateurModel = {
  async creerClient({ nom, prenom, email, telephone, mot_de_passe, province, ville, adresse }) {
    const { rows } = await db.query(
      `INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, role, province, ville, adresse)
       VALUES ($1, $2, $3, $4, $5, 'client', $6, $7, $8)
       RETURNING id`,
      [nom, prenom, email, telephone, mot_de_passe, province, ville, adresse]
    );
    return rows[0].id;
  },

  async creerLivreur(donnees) {
    const { rows } = await db.query(
      `INSERT INTO utilisateurs
        (nom, prenom, email, telephone, mot_de_passe, role, province, ville, adresse,
         type_vehicule, numero_plaque, numero_cin, photo_profil,
         photo_cin_recto, photo_cin_verso, photo_selfie, statut_validation)
       VALUES ($1, $2, $3, $4, $5, 'livreur', $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'en_attente')
       RETURNING id`,
      [
        donnees.nom, donnees.prenom, donnees.email, donnees.telephone, donnees.mot_de_passe,
        donnees.province, donnees.ville, donnees.adresse,
        donnees.type_vehicule, donnees.numero_plaque, donnees.numero_cin, donnees.photo_profil,
        donnees.photo_cin_recto, donnees.photo_cin_verso, donnees.photo_selfie
      ]
    );
    return rows[0].id;
  },

  async trouverParEmail(email) {
    const { rows } = await db.query('SELECT * FROM utilisateurs WHERE email = $1', [email]);
    return rows[0] || null;
  },

  async trouverParId(id) {
    const { rows } = await db.query('SELECT * FROM utilisateurs WHERE id = $1', [id]);
    return rows[0] || null;
  },

  // Utilisée par PATCH /api/auth/moi (voir authController.js) pour que
  // client et livreur puissent modifier leurs coordonnées depuis profil.html
  async mettreAJourProfil(id, { telephone, email, province, ville, adresse }) {
    await db.query(
      `UPDATE utilisateurs
       SET telephone = COALESCE($1, telephone),
           email = COALESCE($2, email),
           province = COALESCE($3, province),
           ville = COALESCE($4, ville),
           adresse = COALESCE($5, adresse)
       WHERE id = $6`,
      [telephone, email, province, ville, adresse, id]
    );
    return this.trouverParId(id);
  },

  // Utilisée par PATCH /api/auth/moi/photo (changement de photo de profil, page profil.html)
  async mettreAJourPhotoProfil(id, cheminPhoto) {
    await db.query('UPDATE utilisateurs SET photo_profil = $1 WHERE id = $2', [cheminPhoto, id]);
    return this.trouverParId(id);
  },

  async compterLivreursParProvince(province) {
    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS total FROM utilisateurs
       WHERE role = 'livreur' AND province = $1 AND statut_validation != 'refuse'`,
      [province]
    );
    return rows[0].total;
  },

  async limiteLivreursPourProvince(province) {
    const { rows } = await db.query('SELECT limite_livreurs FROM provinces WHERE nom = $1', [province]);
    return rows[0] ? rows[0].limite_livreurs : LIMITE_LIVREURS_PAR_PROVINCE_DEFAUT;
  },

  async listerLivreursEnAttente() {
    const { rows } = await db.query(`
      SELECT id, nom, prenom, province, type_vehicule, statut_validation, cree_le
      FROM utilisateurs WHERE role = 'livreur' AND statut_validation = 'en_attente'
      ORDER BY cree_le DESC
    `);
    return rows;
  },

  async validerLivreur(id) {
    return db.query(`UPDATE utilisateurs SET statut_validation = 'valide' WHERE id = $1`, [id]);
  },

  async refuserLivreur(id) {
    return db.query(`UPDATE utilisateurs SET statut_validation = 'refuse' WHERE id = $1`, [id]);
  },

  async mettreAJourSolde(livreurId, montant) {
    return db.query('UPDATE utilisateurs SET solde = solde + $1 WHERE id = $2', [montant, livreurId]);
  },

  async reinitialiserSolde(livreurId) {
    return db.query('UPDATE utilisateurs SET solde = 0 WHERE id = $1', [livreurId]);
  },

  async compterParRole(role) {
    const { rows } = await db.query('SELECT COUNT(*)::int AS total FROM utilisateurs WHERE role = $1', [role]);
    return rows[0].total;
  }
};

module.exports = utilisateurModel;
