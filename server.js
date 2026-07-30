// backend/server.js
// Point d'entrée du backend. Lancer avec : npm start  (ou npm run dev en développement)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const livraisonRoutes = require('./routes/livraisonRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// --- Middlewares globaux ---
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sert les photos uploadées (profil, CIN, selfie, colis) de façon publique en lecture
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Routes de l'API ---
app.use('/api/auth', authRoutes);
app.use('/api/livraisons', livraisonRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// Route de vérification que le serveur tourne (utile pour les health checks d'hébergeur)
app.get('/api/sante', (req, res) => res.json({ statut: 'ok' }));

// Route inconnue -> 404 JSON propre plutôt qu'une page d'erreur générique
app.use('/api', (req, res) => {
  res.status(404).json({ erreur: 'Route API introuvable.' });
});

// Gestion centralisée des erreurs non interceptées
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erreur: 'Une erreur interne est survenue.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur Fastira démarré sur http://localhost:${PORT}`);
});
