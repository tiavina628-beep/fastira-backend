-- ============================================================
-- FASTIRA — Structure de la base de données (PostgreSQL)
-- Fichier : backend/database/schema.sql
-- ============================================================

-- Table des utilisateurs (clients, livreurs ET administrateurs)
-- Le champ "role" est ce qui détermine l'accès à l'administration
CREATE TABLE IF NOT EXISTS utilisateurs (
  id             SERIAL PRIMARY KEY,
  nom            TEXT NOT NULL,
  prenom         TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  telephone      TEXT NOT NULL UNIQUE,
  mot_de_passe   TEXT NOT NULL,              -- haché avec bcrypt, jamais en clair
  role           TEXT NOT NULL CHECK(role IN ('client','livreur','admin')) DEFAULT 'client',
  province       TEXT,
  ville          TEXT,
  adresse        TEXT,
  photo_profil   TEXT,
  -- Champs spécifiques aux livreurs
  type_vehicule  TEXT,
  numero_plaque  TEXT,
  numero_cin     TEXT,
  photo_cin_recto TEXT,
  photo_cin_verso TEXT,
  photo_selfie   TEXT,
  statut_validation TEXT CHECK(statut_validation IN ('en_attente','valide','refuse')) DEFAULT 'en_attente',
  solde          INTEGER DEFAULT 0,          -- portefeuille du livreur, en Ariary
  cree_le        TIMESTAMP DEFAULT NOW()
);

-- Table des provinces
CREATE TABLE IF NOT EXISTS provinces (
  id         SERIAL PRIMARY KEY,
  nom        TEXT NOT NULL UNIQUE,
  actif      BOOLEAN DEFAULT TRUE,
  limite_livreurs INTEGER DEFAULT 50
);

-- Table des villes
CREATE TABLE IF NOT EXISTS villes (
  id           SERIAL PRIMARY KEY,
  nom          TEXT NOT NULL,
  province_id  INTEGER NOT NULL REFERENCES provinces(id),
  actif        BOOLEAN DEFAULT TRUE
);

-- Table des tarifs
CREATE TABLE IF NOT EXISTS tarifs (
  id              SERIAL PRIMARY KEY,
  type_livraison  TEXT NOT NULL,   -- 'standard' ou 'urgent'
  prix_base       INTEGER NOT NULL,
  commission_pourcentage REAL NOT NULL DEFAULT 10
);

-- Table des livraisons
CREATE TABLE IF NOT EXISTS livraisons (
  id                  SERIAL PRIMARY KEY,
  numero              TEXT NOT NULL UNIQUE,       -- ex: FST-2026-00231
  client_id           INTEGER NOT NULL REFERENCES utilisateurs(id),
  livreur_id          INTEGER REFERENCES utilisateurs(id),  -- NULL tant que non attribuée
  nom_expediteur      TEXT NOT NULL,
  telephone_expediteur TEXT NOT NULL,
  nom_destinataire    TEXT NOT NULL,
  telephone_destinataire TEXT NOT NULL,
  province            TEXT NOT NULL,
  ville               TEXT NOT NULL,
  quartier            TEXT,
  adresse_precise     TEXT NOT NULL,
  description_colis   TEXT,
  poids_kg            REAL,
  valeur_estimee      INTEGER,
  urgence             TEXT CHECK(urgence IN ('standard','urgent')) DEFAULT 'standard',
  photo_colis         TEXT,
  commentaire         TEXT,
  statut              TEXT CHECK(statut IN ('en_attente','recupere','en_route','livre','annule')) DEFAULT 'en_attente',
  prix                INTEGER,
  commission          INTEGER,
  cree_le             TIMESTAMP DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
  id                    SERIAL PRIMARY KEY,
  livraison_id          INTEGER NOT NULL REFERENCES livraisons(id),
  moyen                 TEXT NOT NULL,          -- Mvola, Orange Money, Airtel Money, etc.
  montant               INTEGER NOT NULL,
  reference_transaction TEXT,                   -- référence/numéro de transaction fourni par le client
  preuve_paiement       TEXT,                    -- chemin vers la capture d'écran justificative
  statut                TEXT CHECK(statut IN ('en_attente','retenu','libere','rembourse')) DEFAULT 'en_attente',
  cree_le               TIMESTAMP DEFAULT NOW()
);

-- Table de la chronologie (historique de statut) d'une livraison
CREATE TABLE IF NOT EXISTS chronologie_livraisons (
  id            SERIAL PRIMARY KEY,
  livraison_id  INTEGER NOT NULL REFERENCES livraisons(id),
  etape         TEXT NOT NULL,
  date_etape    TIMESTAMP DEFAULT NOW()
);

-- Table des retraits demandés par les livreurs
CREATE TABLE IF NOT EXISTS retraits (
  id          SERIAL PRIMARY KEY,
  livreur_id  INTEGER NOT NULL REFERENCES utilisateurs(id),
  montant     INTEGER NOT NULL,
  statut      TEXT CHECK(statut IN ('en_attente','traite','refuse')) DEFAULT 'en_attente',
  demande_le  TIMESTAMP DEFAULT NOW()
);

-- Table des messages envoyés depuis le formulaire de contact public
CREATE TABLE IF NOT EXISTS messages_contact (
  id            SERIAL PRIMARY KEY,
  nom_complet   TEXT NOT NULL,
  telephone     TEXT,
  email         TEXT NOT NULL,
  sujet         TEXT,
  message       TEXT NOT NULL,
  traite        BOOLEAN DEFAULT FALSE,
  cree_le       TIMESTAMP DEFAULT NOW()
);

-- Table des paramètres généraux de la plateforme (clé/valeur), modifiables
-- depuis administration.html — sert notamment à stocker le numéro Mobile Money
-- de Fastira affiché aux clients sur la page de paiement.
CREATE TABLE IF NOT EXISTS parametres (
  cle     TEXT PRIMARY KEY,
  valeur  TEXT
);
