// backend/controllers/authController.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const utilisateurModel = require('../models/utilisateurModel');
const { genererToken } = require('../utils/token');

const authController = {
  // POST /api/auth/inscription-client
  async inscriptionClient(req, res) {
    try {
      const { nom, prenom, email, telephone, mot_de_passe, province, ville, adresse } = req.body;

      if (!nom || !prenom || !email || !telephone || !mot_de_passe) {
        return res.status(400).json({ erreur: 'Tous les champs obligatoires doivent être remplis.' });
      }
      if (mot_de_passe.length < 8) {
        return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      if (await utilisateurModel.trouverParEmail(email)) {
        return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email.' });
      }

      const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);
      const id = await utilisateurModel.creerClient({ nom, prenom, email, telephone, mot_de_passe: motDePasseHache, province, ville, adresse });

      const utilisateur = await utilisateurModel.trouverParId(id);
      const token = genererToken(utilisateur);
      res.status(201).json({ message: 'Compte créé avec succès.', token });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur serveur lors de la création du compte.' });
    }
  },

  // POST /api/auth/inscription-livreur  (multipart/form-data : photos incluses via uploadMiddleware)
  async inscriptionLivreur(req, res) {
    try {
      const { nom, prenom, email, telephone, mot_de_passe, province, ville, adresse, type_vehicule, numero_plaque, numero_cin } = req.body;

      if (!nom || !prenom || !email || !telephone || !mot_de_passe || !province) {
        return res.status(400).json({ erreur: 'Tous les champs obligatoires doivent être remplis.' });
      }
      if (mot_de_passe.length < 8) {
        return res.status(400).json({ erreur: 'Le mot de passe doit contenir au moins 8 caractères.' });
      }
      if (await utilisateurModel.trouverParEmail(email)) {
        return res.status(409).json({ erreur: 'Un compte existe déjà avec cet email.' });
      }

      // Vérification de la limite de livreurs par province (message affiché sur le formulaire)
      const nombreActuel = await utilisateurModel.compterLivreursParProvince(province);
      const limite = await utilisateurModel.limiteLivreursPourProvince(province);
      if (nombreActuel >= limite) {
        return res.status(409).json({ erreur: `Le nombre de livreurs est limité pour la province de ${province}. Aucune place disponible actuellement.` });
      }

      const motDePasseHache = await bcrypt.hash(mot_de_passe, 10);

      // req.files est fourni par multer (voir uploadMiddleware.js et authRoutes.js)
      const fichiers = req.files || {};
      const cheminFichier = (champ) => fichiers[champ] ? `/uploads/${fichiers[champ][0].filename}` : null;

      const id = await utilisateurModel.creerLivreur({
        nom, prenom, email, telephone, mot_de_passe: motDePasseHache,
        province, ville, adresse, type_vehicule, numero_plaque, numero_cin,
        photo_profil: cheminFichier('photo_profil'),
        photo_cin_recto: cheminFichier('photo_cin_recto'),
        photo_cin_verso: cheminFichier('photo_cin_verso'),
        photo_selfie: cheminFichier('photo_selfie')
      });

      res.status(201).json({ message: 'Candidature envoyée. Votre compte sera activé après validation par un administrateur.', id });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur serveur lors de la création du compte livreur.' });
    }
  },

  // POST /api/auth/connexion
  async connexion(req, res) {
    try {
      const { email, mot_de_passe } = req.body;
      const utilisateur = await utilisateurModel.trouverParEmail(email);

      if (!utilisateur) {
        return res.status(401).json({ erreur: 'Email ou mot de passe incorrect.' });
      }

      const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
      if (!motDePasseValide) {
        return res.status(401).json({ erreur: 'Email ou mot de passe incorrect.' });
      }

      // Un livreur non encore validé par l'admin ne peut pas se connecter
      if (utilisateur.role === 'livreur' && utilisateur.statut_validation !== 'valide') {
        return res.status(403).json({ erreur: 'Votre compte livreur est en attente de validation par un administrateur.' });
      }

      const token = genererToken(utilisateur);
      res.json({
        message: 'Connexion réussie.',
        token,
        utilisateur: { id: utilisateur.id, nom: utilisateur.nom, prenom: utilisateur.prenom, role: utilisateur.role }
      });
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur serveur lors de la connexion.' });
    }
  },

  // GET /api/auth/moi  (protégée par authMiddleware — sert à vérifier qui est connecté)
  async monProfil(req, res) {
    const utilisateur = await utilisateurModel.trouverParId(req.utilisateur.id);
    if (!utilisateur) return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    const { mot_de_passe, ...utilisateurSansMotDePasse } = utilisateur;
    res.json(utilisateurSansMotDePasse);
  },

  // PATCH /api/auth/moi  (utilisé par profil.html pour enregistrer les modifications)
  async modifierProfil(req, res) {
    try {
      const { telephone, email, province, ville, adresse } = req.body;
      const utilisateurMisAJour = await utilisateurModel.mettreAJourProfil(req.utilisateur.id, {
        telephone, email, province, ville, adresse
      });
      const { mot_de_passe, ...utilisateurSansMotDePasse } = utilisateurMisAJour;
      res.json(utilisateurSansMotDePasse);
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur lors de la mise à jour du profil.' });
    }
  },

  // PATCH /api/auth/moi/photo  (multipart/form-data, champ "photo_profil")
  // Utilisé par profil.html pour changer sa photo de profil (client, livreur ou admin).
  async modifierPhotoProfil(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ erreur: 'Aucune image reçue.' });
      }

      const ancienUtilisateur = await utilisateurModel.trouverParId(req.utilisateur.id);
      const nouveauChemin = `/uploads/${req.file.filename}`;

      const utilisateurMisAJour = await utilisateurModel.mettreAJourPhotoProfil(req.utilisateur.id, nouveauChemin);

      // Nettoyage best-effort de l'ancienne photo pour ne pas accumuler de fichiers orphelins
      if (ancienUtilisateur && ancienUtilisateur.photo_profil) {
        const ancienFichier = path.join(__dirname, '..', ancienUtilisateur.photo_profil.replace(/^\/uploads\//, 'uploads/'));
        fs.unlink(ancienFichier, () => {}); // erreur ignorée si le fichier n'existe déjà plus
      }

      const { mot_de_passe, ...utilisateurSansMotDePasse } = utilisateurMisAJour;
      res.json(utilisateurSansMotDePasse);
    } catch (err) {
      res.status(500).json({ erreur: 'Erreur lors de la mise à jour de la photo de profil.' });
    }
  }
};

module.exports = authController;
