// backend/database/init.js
// Exécuter une seule fois avec : npm run init-db
// Crée les tables PostgreSQL à partir de schema.sql, insère un premier compte
// administrateur, les provinces de base et les tarifs de base.
// Peut être relancé sans risque : toutes les opérations sont idempotentes.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function initialiser() {
  // 1. Exécuter le schéma (création des tables)
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Tables créées avec succès.');

  // 2. Créer un compte administrateur par défaut, si aucun n'existe encore
  const { rows: adminExistant } = await pool.query('SELECT id FROM utilisateurs WHERE role = $1', ['admin']);

  if (adminExistant.length === 0) {
    const motDePasseHache = await bcrypt.hash('ChangezMoiImmediatement123!', 10);

    await pool.query(
      `INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, role, statut_validation)
       VALUES ($1, $2, $3, $4, $5, 'admin', 'valide')`,
      ['Admin', 'Fastira', 'admin@fastira.mg', '+261340000000', motDePasseHache]
    );

    console.log('Compte administrateur créé : admin@fastira.mg / ChangezMoiImmediatement123!');
    console.log('IMPORTANT : changez ce mot de passe dès la première connexion.');
  } else {
    console.log('Un compte administrateur existe déjà — aucune création nécessaire.');
  }

  // 3. Provinces de base
  const provinces = ['Antananarivo', 'Fianarantsoa', 'Toamasina', 'Mahajanga', 'Toliara', 'Antsiranana'];
  for (const p of provinces) {
    await pool.query('INSERT INTO provinces (nom) VALUES ($1) ON CONFLICT (nom) DO NOTHING', [p]);
  }
  console.log('Provinces de base insérées.');

  // 4. Tarifs de base
  const { rows: tarifExistant } = await pool.query('SELECT id FROM tarifs LIMIT 1');
  if (tarifExistant.length === 0) {
    await pool.query(
      `INSERT INTO tarifs (type_livraison, prix_base, commission_pourcentage) VALUES ($1, $2, $3)`,
      ['standard', 5000, 10]
    );
    await pool.query(
      `INSERT INTO tarifs (type_livraison, prix_base, commission_pourcentage) VALUES ($1, $2, $3)`,
      ['urgent', 12000, 10]
    );
    console.log('Tarifs de base insérés.');
  }

  // 5. Numéro de paiement par défaut (à changer depuis administration.html)
  const { rows: parametreExistant } = await pool.query("SELECT cle FROM parametres WHERE cle = 'numero_paiement_reception'");
  if (parametreExistant.length === 0) {
    await pool.query(
      `INSERT INTO parametres (cle, valeur) VALUES ('numero_paiement_reception', $1)`,
      ['+261 34 00 000 00']
    );
    console.log('Numéro de paiement par défaut inséré (à modifier depuis Administration > Paramètres de paiement).');
  }

  console.log('Initialisation terminée.');
  await pool.end();
}

initialiser().catch((err) => {
  console.error('Erreur lors de l\'initialisation de la base :', err);
  process.exit(1);
});
