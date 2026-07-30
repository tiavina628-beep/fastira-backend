// backend/controllers/contactController.js
// Route publique (aucune connexion requise) — utilisée par contact.html.

const contactModel = require('../models/contactModel');

const contactController = {
  // POST /api/contact
  async envoyer(req, res) {
    try {
      const { nom_complet, telephone, email, sujet, message } = req.body;

      if (!nom_complet || !email || !message) {
        return res.status(400).json({ erreur: 'Nom, email et message sont obligatoires.' });
      }

      const id = await contactModel.creer({ nom_complet, telephone, email, sujet, message });

      // NOTE : l'envoi d'un email de notification à l'équipe (ex. via un service
      // comme Resend, SendGrid ou Nodemailer) peut être ajouté ici plus tard.
      // Pour l'instant, le message est simplement stocké en base pour consultation
      // par l'équipe via /api/admin/messages-contact.

      res.status(201).json({ message: 'Votre message a bien été reçu. Notre équipe vous répondra rapidement.', id });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur serveur lors de l\'envoi du message.' });
    }
  }
};

module.exports = contactController;
