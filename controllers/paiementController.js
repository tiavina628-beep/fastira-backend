// backend/controllers/paiementController.js
const paiementModel = require('../models/paiementModel');
const livraisonModel = require('../models/livraisonModel');
const utilisateurModel = require('../models/utilisateurModel');
const parametreModel = require('../models/parametreModel');

const CLE_NUMERO_PAIEMENT = 'numero_paiement_reception';

const paiementController = {
  // POST /api/paiements  (client connecté)
  // multipart/form-data : livraison_id, moyen, reference_transaction, + fichier "preuve_paiement"
  async payer(req, res) {
    try {
      const livraison = await livraisonModel.trouverParId(req.body.livraison_id);
      if (!livraison) return res.status(404).json({ erreur: 'Livraison introuvable.' });

      if (!req.body.reference_transaction || !req.body.reference_transaction.trim()) {
        return res.status(400).json({ erreur: 'La référence de la transaction est obligatoire.' });
      }

      const montant = livraison.prix + livraison.commission;
      const preuve = req.file ? `/uploads/${req.file.filename}` : null;

      // Le paiement est immédiatement marqué "retenu" : les fonds sont conservés
      // en sécurité par Fastira jusqu'à la confirmation de la livraison.
      const id = await paiementModel.creer({
        livraison_id: livraison.id,
        moyen: req.body.moyen,
        montant,
        reference_transaction: req.body.reference_transaction.trim(),
        preuve_paiement: preuve
      });

      res.status(201).json({ message: 'Paiement reçu, conservé en sécurité jusqu\'à confirmation de la livraison.', id, montant });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur lors de l\'enregistrement du paiement.' });
    }
  },

  // Appelé en interne (par livraisonController) quand une livraison passe au statut "livre"
  async libererPaiement(livraisonId, livreurId) {
    await paiementModel.libererPourLivraison(livraisonId);
    const paiement = await paiementModel.parLivraison(livraisonId);
    if (paiement) {
      const montantLivreur = paiement.montant - (paiement.montant * 0.1); // la commission reste à Fastira
      await utilisateurModel.mettreAJourSolde(livreurId, Math.round(montantLivreur));
    }
  },

  // POST /api/paiements/retrait  (livreur connecté)
  async demanderRetrait(req, res) {
    try {
      const livreur = await utilisateurModel.trouverParId(req.utilisateur.id);
      if (livreur.solde < paiementModel.SEUIL_RETRAIT) {
        return res.status(400).json({ erreur: `Le retrait est disponible uniquement à partir de ${paiementModel.SEUIL_RETRAIT} Ariary.` });
      }
      const id = await paiementModel.demanderRetrait(livreur.id, livreur.solde);
      await utilisateurModel.reinitialiserSolde(livreur.id);
      res.status(201).json({ message: 'Demande de retrait envoyée. Votre solde sera viré sous peu.', id });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur lors de la demande de retrait.' });
    }
  },

  // GET /api/paiements/numero-reception  (client ou livreur connecté)
  // Renvoie le numéro Mobile Money de Fastira, configuré par l'admin, à afficher sur paiement.html
  async numeroReception(req, res) {
    const numero = await parametreModel.obtenir(CLE_NUMERO_PAIEMENT, '');
    res.json({ numero_paiement: numero });
  }
};

module.exports = paiementController;
