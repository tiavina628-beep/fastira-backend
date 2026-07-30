// backend/controllers/adminController.js
// Toutes les fonctions ici ne sont JAMAIS exposées sans passer par
// estConnecte + estAdmin (voir backend/routes/adminRoutes.js).

const utilisateurModel = require('../models/utilisateurModel');
const livraisonModel = require('../models/livraisonModel');
const paiementModel = require('../models/paiementModel');
const tarifModel = require('../models/tarifModel');
const contactModel = require('../models/contactModel');
const parametreModel = require('../models/parametreModel');

const CLE_NUMERO_PAIEMENT = 'numero_paiement_reception';

const adminController = {
  // GET /api/admin/statistiques
  async statistiques(req, res) {
    res.json({
      clients: await utilisateurModel.compterParRole('client'),
      livreurs: await utilisateurModel.compterParRole('livreur'),
      commandes: await livraisonModel.compterTotal(),
      paiementsTraites: await paiementModel.totalTraite()
    });
  },

  // GET /api/admin/livreurs-en-attente
  async livreursEnAttente(req, res) {
    res.json(await utilisateurModel.listerLivreursEnAttente());
  },

  // POST /api/admin/livreurs/:id/valider
  async validerLivreur(req, res) {
    await utilisateurModel.validerLivreur(req.params.id);
    res.json({ message: 'Livreur validé.' });
  },

  // POST /api/admin/livreurs/:id/refuser
  async refuserLivreur(req, res) {
    await utilisateurModel.refuserLivreur(req.params.id);
    res.json({ message: 'Livreur refusé.' });
  },

  // GET /api/admin/livraisons?statut=...&province=...
  async toutesLivraisons(req, res) {
    res.json(await livraisonModel.toutesPourAdmin(req.query));
  },

  // GET /api/admin/retraits-en-attente
  async retraitsEnAttente(req, res) {
    res.json(await paiementModel.listerRetraitsEnAttente());
  },

  // POST /api/admin/retraits/:id/traiter
  async traiterRetrait(req, res) {
    await paiementModel.marquerRetraitTraite(req.params.id);
    res.json({ message: 'Retrait marqué comme traité.' });
  },

  // GET /api/admin/tarifs
  async tarifs(req, res) {
    res.json(await tarifModel.tousLesTarifs());
  },

  // PATCH /api/admin/tarifs/:id
  async modifierTarif(req, res) {
    await tarifModel.mettreAJour(req.params.id, req.body.prix_base, req.body.commission_pourcentage);
    res.json({ message: 'Tarif mis à jour.' });
  },

  // GET /api/admin/messages-contact
  async messagesContact(req, res) {
    res.json(await contactModel.tousLesMessages());
  },

  // GET /api/admin/paiements — liste des paiements avec référence/preuve, pour vérification manuelle
  async paiements(req, res) {
    res.json(await paiementModel.tous());
  },

  // GET /api/admin/parametres
  async obtenirParametres(req, res) {
    res.json({
      numero_paiement_reception: await parametreModel.obtenir(CLE_NUMERO_PAIEMENT, '')
    });
  },

  // PATCH /api/admin/parametres  body: { numero_paiement_reception }
  async modifierParametres(req, res) {
    const { numero_paiement_reception } = req.body;
    if (!numero_paiement_reception || !numero_paiement_reception.trim()) {
      return res.status(400).json({ erreur: 'Le numéro de téléphone pour le paiement est obligatoire.' });
    }
    await parametreModel.definir(CLE_NUMERO_PAIEMENT, numero_paiement_reception.trim());
    res.json({ message: 'Paramètres mis à jour.', numero_paiement_reception: numero_paiement_reception.trim() });
  }
};

module.exports = adminController;
