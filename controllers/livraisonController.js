// backend/controllers/livraisonController.js
const livraisonModel = require('../models/livraisonModel');
const tarifModel = require('../models/tarifModel');
const paiementController = require('./paiementController');

const livraisonController = {
  // POST /api/livraisons  (client connecté)
  async creer(req, res) {
    try {
      const tarif = await tarifModel.trouverParType(req.body.urgence || 'standard');
      const prix = tarif ? tarif.prix_base : 5000;
      const commission = tarif ? Math.round(prix * (tarif.commission_pourcentage / 100)) : 500;

      const fichier = req.file ? `/uploads/${req.file.filename}` : null;

      const { id, numero } = await livraisonModel.creer({
        client_id: req.utilisateur.id,
        nom_expediteur: req.body.nom_expediteur,
        telephone_expediteur: req.body.telephone_expediteur,
        nom_destinataire: req.body.nom_destinataire,
        telephone_destinataire: req.body.telephone_destinataire,
        province: req.body.province,
        ville: req.body.ville,
        quartier: req.body.quartier,
        adresse_precise: req.body.adresse_precise,
        description_colis: req.body.description_colis,
        poids_kg: req.body.poids_kg,
        valeur_estimee: req.body.valeur_estimee,
        urgence: req.body.urgence || 'standard',
        photo_colis: fichier,
        commentaire: req.body.commentaire,
        prix,
        commission
      });

      await livraisonModel.changerStatut(id, 'en_attente');
      res.status(201).json({ message: 'Livraison créée.', id, numero, prix, commission, total: prix + commission });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur lors de la création de la livraison.' });
    }
  },

  // GET /api/livraisons/mes-commandes  (client connecté)
  async mesCommandes(req, res) {
    res.json(await livraisonModel.listerParClient(req.utilisateur.id));
  },

  // GET /api/livraisons/disponibles  (livreur connecté — filtre sur sa province)
  async disponibles(req, res) {
    res.json(await livraisonModel.listerDisponiblesParProvince(req.query.province));
  },

  // GET /api/livraisons/mes-livraisons  (livreur connecté)
  async mesLivraisons(req, res) {
    res.json(await livraisonModel.listerParLivreur(req.utilisateur.id));
  },

  // POST /api/livraisons/:id/accepter  (livreur connecté)
  async accepter(req, res) {
    await livraisonModel.attribuerLivreur(req.params.id, req.utilisateur.id);
    await livraisonModel.changerStatut(req.params.id, 'recupere');
    res.json({ message: 'Livraison acceptée.' });
  },

  // PATCH /api/livraisons/:id/statut  (livreur ou admin connecté)  body: { statut }
  async changerStatut(req, res) {
    const statutsValides = ['en_attente', 'recupere', 'en_route', 'livre', 'annule'];
    if (!statutsValides.includes(req.body.statut)) {
      return res.status(400).json({ erreur: 'Statut invalide.' });
    }

    await livraisonModel.changerStatut(req.params.id, req.body.statut);

    // Dès que la livraison est confirmée livrée, les fonds retenus sont versés au livreur
    if (req.body.statut === 'livre') {
      const livraison = await livraisonModel.trouverParId(req.params.id);
      if (livraison.livreur_id) {
        await paiementController.libererPaiement(livraison.id, livraison.livreur_id);
      }
    }

    res.json({ message: 'Statut mis à jour.' });
  },

  // GET /api/livraisons/:id
  async details(req, res) {
    const livraison = await livraisonModel.trouverParId(req.params.id);
    if (!livraison) return res.status(404).json({ erreur: 'Livraison introuvable.' });
    const chronologie = await livraisonModel.chronologie(req.params.id);
    res.json({ ...livraison, chronologie });
  }
};

module.exports = livraisonController;
