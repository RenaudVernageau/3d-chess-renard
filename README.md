📦 Prérequis

Node.js v14 ou supérieur

npm ou yarn

Une base de données MongoDB (Atlas ou locale)

🗂️ Structure du projet

root/
├─ frontend/   # Application React (Vite + Tailwind + R3F)
└─ server/     # API Express + Socket.IO
    ├─ config/        # Chargement des variables d’environnement
    ├─ controllers/   # Logique métier (auth, rooms)
    ├─ middleware/    # Middleware (auth JWT)
    ├─ routes/        # Définition des endpoints
    ├─ services/      # Socket.IO, DB connection
    └─ utils/         # Logger, helpers

🔧 Variables d’environnement

Variable

Description

Exemple

PORT

Port pour le serveur Express

4000

CORS_ORIGIN

Origine autorisée pour les requêtes CORS

http://localhost:5173

MONGO_URI

URI de connexion MongoDB

mongodb+srv://...

JWT_SECRET

Clé secrète pour la signature des tokens JWT

votre_secret_long_et_sûr

VITE_WS_URL

URL du serveur Socket.IO (frontend)

http://localhost:4000

Astuce : dupliquez .env.example en .env dans server/ et dans frontend/, puis complétez ces valeurs.

🚀 Installation et lancement

Serveur

cd server
npm install
# Créez .env à partir de .env.example et renseignez MONGO_URI et JWT_SECRET
npm start

Frontend

cd frontend
npm install
# Créez .env à partir de .env.example
npm run dev

Le frontend s’ouvre sur : http://localhost:5173

🔐 Authentification

Le MVP inclut un système d’auth sécurisé via JWT et MongoDB :

InscriptionPOST /api/auth/registerBody : { email, password }Réponse : { userId, token }

ConnexionPOST /api/auth/loginBody : { email, password }Réponse : { userId, token }

Le token doit être envoyé dans l’en-tête Authorization: Bearer <token> pour accéder aux routes protégées.

🛠️ Routes API

Auth

Méthode

Endpoint

Description

POST

/api/auth/register

Crée un nouvel utilisateur et renvoie un JWT

POST

/api/auth/login

Vérifie les identifiants et renvoie un JWT

Rooms (protégées)

Méthode

Endpoint

Description

POST

/api/rooms/create

Crée une partie et renvoie { roomId }

GET

/api/rooms/:roomId

Récupère l’état d’une partie (id, joueurs…)

Seules les requêtes authentifiées (Bearer token) peuvent créer ou rejoindre une room.

🔄 Workflow de base

Créer un compte ou vous connecter (/api/auth/register ou /api/auth/login).

Récupérer le token et le stocker en localStorage.

Lancer le serveur et le frontend (npm start, npm run dev).

Depuis l’UI : créer une partie ou saisir un roomId existant (v. étape 2).

Ouvrir un second onglet pour tester la synchronisation des mouvements.

