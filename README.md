# Application de Gestion des Incidents

Cette application est un système complet de gestion des incidents comprenant un backend d'API REST robuste en Python (FastAPI) et une interface utilisateur moderne en React (Vite).

---

## 📂 Structure du Projet

L'arborescence du projet est organisée de manière modulaire :

```text
Miaw miaw/
│
├── Backend/                 # Backend API (FastAPI)
│   ├── core/                # Configuration générale & Sécurité
│   ├── models/              # Définitions des tables SQLAlchemy
│   ├── routers/             # Points de terminaison API (Auth, Incidents, etc.)
│   ├── schemas/             # Modèles de validation de données (Pydantic)
│   ├── services/            # Logique métier (génération de rapports, etc.)
│   ├── reports/             # Rapports locaux générés (PDF, Excel, CSV) [Ignoré par git]
│   ├── uploads/             # Fichiers et images téléchargés [Ignoré par git]
│   ├── database.py          # Configuration & Initialisation de la base SQLite
│   ├── main.py              # Point d'entrée de l'application FastAPI
│   ├── setup_users.py       # Script d'initialisation des utilisateurs de démo
│   └── requirements.txt     # Dépendances Python du projet
│
├── Frontend/                # Frontend Web (React + Vite)
│   ├── src/                 # Code source de l'application
│   │   ├── api/             # Client HTTP Axios de communication avec l'API
│   │   ├── components/      # Composants d'interface utilisateur réutilisables
│   │   ├── context/         # Contextes React (Authentification et Thème)
│   │   ├── hooks/           # Custom hooks React (Notifications)
│   │   ├── pages/           # Pages principales de l'application (Dashboard, etc.)
│   │   └── utils/           # Fonctions utilitaires d'aide (formatage, etc.)
│   ├── index.html           # Document HTML principal
│   └── package.json         # Dépendances et scripts npm
│
├── .gitignore               # Configuration des exclusions de suivi Git
└── README.md                # Documentation principale (ce fichier)
```

---

## 🚀 Lancement de l'Application

### 1. Démarrage du Backend (FastAPI)

1. Ouvrez un terminal dans le dossier `Backend` (ou à la racine en activant l'environnement virtuel) :
   ```bash
   # Activer l'environnement virtuel (Windows)
   .venv\Scripts\activate
   
   # Aller dans le dossier Backend
   cd Backend
   ```
2. Installez les dépendances si nécessaire :
   ```bash
   pip install -r requirements.txt
   ```
3. Initialisez la base de données SQLite et les comptes de démo :
   ```bash
   python setup_users.py
   ```
4. Lancez le serveur de développement FastAPI :
   ```bash
   uvicorn main.py:app --reload
   ```
   L'API sera disponible à l'adresse : `http://localhost:8000`

> [!NOTE]
> Le script `setup_users.py` crée les utilisateurs par défaut suivants :
> - **Admin** : `admin1@gmail.com` / `Admin123!@#`
> - **Tech Réseau** : `tech1@gmail.com` / `Tech123!@#`
> - **Tech Matériel** : `tech2@gmail.com` / `Tech123!@#`
> - **Tech Logiciel** : `tech3@gmail.com` / `Tech123!@#`
> - **Client Demo** : `client@gmail.com` / `Client123!@#`

---

### 2. Démarrage du Frontend (React + Vite)

1. Ouvrez un nouveau terminal dans le dossier `Frontend` :
   ```bash
   cd Frontend
   ```
2. Installez les dépendances npm :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement Vite :
   ```bash
   npm run dev
   ```
   L'interface Web sera accessible à l'adresse : `http://localhost:5173`

---

## 🧹 Détails du Nettoyage Récent

Le projet a fait l'objet d'un nettoyage complet :
- **Suppression des doublons et fichiers résiduels** : La base de données inactive `incidents.db` et les dossiers vides `reports/` et `uploads/` générés à la racine ont été supprimés.
- **Chemins Backend Stables** : La configuration du backend (`Backend/core/config.py`) a été modifiée pour forcer l'usage de chemins absolus résolus dynamiquement à l'intérieur du dossier `Backend`. Quel que soit l'endroit d'où vous lancez l'application, aucun fichier ou dossier parasite ne sera recréé à la racine.
- **Suppression du boilerplate vide** : Les fichiers React de 0 octet qui n'étaient pas importés (`Button.jsx`, `EmptyState.jsx`, `Input.jsx`, `Modal.jsx`, `PageHeader.jsx`, `useApi.js`) ont été supprimés pour garder le code propre.
- **Exclusion et Suivi** : Ajout d'un fichier `.gitignore` complet et de marqueurs `.gitkeep` pour s'assurer que les dossiers de rapports locaux et de fichiers téléchargés restent répertoriés sans encombrer les validations Git.
