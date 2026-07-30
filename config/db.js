// backend/config/db.js
// Point d'accès unique à la base de données PostgreSQL.
// Tous les fichiers du dossier models/ importent ce fichier et utilisent
// exclusivement pool.query(...) — jamais de SQL direct ailleurs.

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        // Nécessaire pour la plupart des hébergeurs Postgres managés (Render, Railway, Supabase...)
        // qui exigent SSL mais présentent un certificat auto-signé.
        ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
      }
    : {
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || '',
        database: process.env.PGDATABASE || 'fastira'
      }
);

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL :', err);
});

module.exports = pool;
