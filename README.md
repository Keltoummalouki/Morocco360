# Morocco360 🎪🎭🏟️

**Plateforme centralisée pour tous les événements au Maroc**

---

## 📋 Vue d'ensemble

Morocco360 est une plateforme web et mobile permettant aux utilisateurs (locaux et touristes) de découvrir, réserver et gérer des événements au Maroc. Intégration complète avec restaurants, activités et équipements basés sur la géolocalisation.

**Objectif principal** : Simplifier l'accès aux événements au Maroc tout en offrant une expérience utilisateur fluide et sécurisée.

---

## 👥 Public cible

- **Locaux** : Cherchant des événements près de chez eux
- **Touristes internationaux** : Explorant la culture, musique, sports au Maroc
- **Fans d'événements** : Musique, sports, festivals, conférences, expositions
- **Voyageurs** : Voulant organiser une expérience complète autour d'un événement

---

## 🎯 Fonctionnalités principales

### 1. **Système de tickets & événements**
- Consultation d'événements filtrés par : type, date, ville, prix, popularité
- Recherche avancée avec autocomplete
- Affichage détaillé : description, localisation, horaires, capacité
- Réservation multi-tickets en un clic
- Gestion des billets : téléchargement PDF + QR code scannable
- Historique des réservations avec détails et statut

### 2. **Découverte d'activités & restaurants**
- Carte interactive avec filtres (type, prix, avis, distance)
- Suggestions intelligentes basées sur :
  - Localisation de l'utilisateur
  - Préférences sauvegardées
  - Historique de consultation
- Avis et notes utilisateurs (1-5 étoiles)
- Affichage du menu, horaires, photos
- Intégration avec Google Maps pour itinéraires

### 3. **Profil utilisateur**
- Création compte via email/Google/Apple
- Gestion des préférences : langues, devises, catégories favorites
- Favoris (événements, restaurants, activités)
- Historique complet des réservations
- Wishlist avec notifications de prix/disponibilité
- Paramètres de confidentialité et sécurité

### 4. **Paiement sécurisé**
- Intégration multi-fournisseurs :
  - **Stripe** (cartes internationales)
  - **PayPal** (transfert sécurisé)
  - **Cartes bancaires locales** (Maroc)
- Stockage sécurisé des moyens de paiement (PCI-DSS compliant)
- Gestion des erreurs et retries automatiques
- Reçus emailés et téléchargeables
- Support des remboursements et modifications

### 5. **Expérience multilingue & responsive**
- Langues : Arabe (darija), Français, Anglais
- Interface entièrement traduite + contenu utilisateur
- Responsive design : mobile, tablette, desktop
- Progressive Web App (PWA) pour offline partiel
- Dark mode / Light mode

### 6. **Fonctionnalités avancées**
- Système de notifications : push, email, SMS
- Partage d'événements sur réseaux sociaux
- Système de points de fidélité (optionnel)
- Reviews et photos utilisateurs
- Chat support en temps réel
- Analytics pour événementiel (dashboard organisateurs)

---

## 🛠️ Stack technologique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14+ (React, TypeScript) |
| **Backend** | Node.js + NestJS (TypeScript) |
| **Database** | MySQL 8.0+ (avec Redis pour cache) |
| **Cartographie** | Google Maps API (primary) + OpenStreetMap fallback |
| **Paiement** | Stripe API, PayPal SDK |
| **Authentification** | JWT + OAuth2 (Google, Apple) |
| **Hosting** | AWS (EC2 + RDS + S3) |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Sentry + CloudWatch |
| **Cache** | Redis |
| **Storage fichiers** | AWS S3 (images, PDF tickets) |

### Dépendances clés

**Frontend** :
- `next.js`, `react`, `typescript`
- `tailwindcss` (styling)
- `zustand` ou `redux-toolkit` (state management)
- `react-query` (data fetching)
- `leaflet` + `leaflet-react` (maps)
- `stripe-js`, `@paypal/checkout-server-sdk`
- `axios` (HTTP client)
- `date-fns` (gestion dates)

**Backend** :
- `@nestjs/core`, `@nestjs/jwt`, `@nestjs/passport`
- `mysql2`, `typeorm` (ORM)
- `stripe`, `paypal-rest-sdk`
- `class-validator`, `class-transformer`
- `dotenv` (config)
- `jest` (tests)

---

## 📁 Structure du projet

```
morocco360/
├── frontend/
│   ├── app/                 # Next.js app router
│   │   ├── (auth)/         # Routes auth
│   │   ├── events/         # Pages événements
│   │   ├── activities/     # Pages activités/restaurants
│   │   ├── profile/        # Profil utilisateur
│   │   └── checkout/       # Processus paiement
│   ├── components/          # Composants réutilisables
│   ├── lib/                # Utilitaires, API calls
│   ├── styles/             # Tailwind config
│   ├── public/             # Assets statiques
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── auth/           # Module authentification
│   │   ├── events/         # Module événements
│   │   ├── activities/     # Module activités/restaurants
│   │   ├── users/          # Module utilisateurs
│   │   ├── payments/       # Module paiements
│   │   ├── tickets/        # Module tickets
│   │   ├── common/         # Filters, guards, interceptors
│   │   └── main.ts         # Entry point
│   ├── test/               # Tests (unit + integration)
│   ├── .env.example        # Variables d'env
│   └── package.json
│
├── database/
│   ├── migrations/         # DB migrations (TypeORM)
│   └── seeds/              # Données initiales
│
├── docs/
│   ├── API.md              # Documentation API REST
│   ├── ARCHITECTURE.md     # Architecture système
│   └── DEPLOYMENT.md       # Guide déploiement
│
└── .github/
    └── workflows/          # CI/CD (GitHub Actions)
```

---

## ⚙️ Configuration & Installation

### Prérequis
- Node.js 18+
- MySQL 8.0+
- Git
- Compte AWS, Stripe, Google Maps

### 1. **Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local

# Variables d'env requises
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_KEY=xxx
NEXT_PUBLIC_STRIPE_KEY=pk_test_xxx
NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxx
```

Lancer en dev :
```bash
npm run dev
# → http://localhost:3000
```

### 2. **Backend**

```bash
cd backend
npm install
cp .env.example .env

# Variables d'env requises
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=xxx
DATABASE_NAME=morocco360

JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=sk_test_xxx
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=xxx
PAYPAL_SECRET=xxx

GOOGLE_MAPS_API_KEY=xxx
```

Migrations DB :
```bash
npm run typeorm migration:run
npm run seed  # Données initiales
```

Lancer en dev :
```bash
npm run start:dev
# → http://localhost:3001
```

### 3. **Base de données**

```bash
# Créer DB
mysql -u root -p
CREATE DATABASE morocco360;
CREATE USER 'morocco360_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON morocco360.* TO 'morocco360_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🗄️ Modèle de données simplifié

### Users
```sql
- id (PK)
- email (UNIQUE)
- password_hash
- first_name, last_name
- phone
- language (ar, fr, en)
- currency (MAD, EUR, USD)
- created_at, updated_at
```

### Events
```sql
- id (PK)
- title, description
- category (music, sports, culture, conference)
- start_date, end_date
- location, latitude, longitude
- capacity, available_tickets
- price_min, price_max
- image_url
- organizer_id (FK → Users)
- created_at
```

### Reservations
```sql
- id (PK)
- user_id (FK → Users)
- event_id (FK → Events)
- quantity
- total_price
- status (pending, confirmed, cancelled)
- created_at
```

### Tickets
```sql
- id (PK)
- reservation_id (FK → Reservations)
- qr_code (UNIQUE)
- pdf_url
- is_scanned
- scanned_at
```

### Payments
```sql
- id (PK)
- reservation_id (FK → Reservations)
- provider (stripe, paypal, bank_card)
- amount, currency
- status (pending, completed, failed, refunded)
- transaction_id
- created_at
```

### Activities
```sql
- id (PK)
- name, description, type (restaurant, activity)
- latitude, longitude
- price_range (€, €€, €€€)
- rating (0-5)
- image_url
- category
```

---

## 🔐 Sécurité

### Mesures implémentées
- **HTTPS/TLS** obligatoire en production
- **JWT** avec expiration (1h access, 7j refresh)
- **Hachage passwords** (bcrypt avec 10 rounds min)
- **CORS** restrictif : domaines approuvés seulement
- **Rate limiting** : 100 req/min par IP
- **SQL injection protection** : parameterized queries (TypeORM)
- **XSS protection** : sanitization HTML + CSP headers
- **CSRF tokens** pour formulaires critiques
- **PCI-DSS compliance** : pas de stockage données cartes
- **GDPR compliance** : export/suppression données utilisateur
- **Audit logging** : toutes actions sensibles enregistrées

### Variables sensibles
Utiliser uniquement des **environment variables** sécurisées (jamais en Git).

```bash
# .env (à l'écart du contrôle de version)
STRIPE_SECRET_KEY=sk_test_xxx
JWT_SECRET=super_secret_key_min_32_chars
DATABASE_PASSWORD=xxx
```

---

## 📊 API REST - Endpoints clés

### Authentication
```
POST   /api/auth/register           # Création compte
POST   /api/auth/login              # Connexion
POST   /api/auth/refresh            # Refresh token
POST   /api/auth/logout             # Déconnexion
```

### Events
```
GET    /api/events                  # Liste (avec filtres)
GET    /api/events/:id              # Détails
POST   /api/events                  # Créer (admin)
PUT    /api/events/:id              # Modifier (admin)
DELETE /api/events/:id              # Supprimer (admin)
```

### Reservations
```
POST   /api/reservations            # Créer réservation
GET    /api/reservations/:id        # Détails
GET    /api/users/me/reservations   # Mes réservations
PUT    /api/reservations/:id/cancel # Annuler
```

### Payments
```
POST   /api/payments/stripe/intent  # Create payment intent
POST   /api/payments/paypal/order   # Create PayPal order
POST   /api/payments/confirm        # Confirmer paiement
```

### Activities
```
GET    /api/activities              # Liste (avec filtres géo)
GET    /api/activities/:id          # Détails
GET    /api/activities/nearby        # À proximité
```

### Profile
```
GET    /api/users/me                # Mon profil
PUT    /api/users/me                # Modifier profil
GET    /api/users/me/favorites      # Favoris
POST   /api/users/me/favorites/:id  # Ajouter favoris
```

**Documentation complète** : `docs/API.md`

---

## 🧪 Tests

### Frontend
```bash
cd frontend
npm run test                # Jest
npm run test:coverage       # Couverture
npm run test:e2e            # Cypress E2E
```

### Backend
```bash
cd backend
npm run test                # Jest
npm run test:coverage
npm run test:e2e            # Tests intégration DB
```

Objectif couverture : **≥ 80%**

---

## 🚀 Déploiement

### Environment
- **Dev** : http://localhost:3000 (frontend)
- **Staging** : AWS EC2 (test avant prod)
- **Production** : AWS ECS + CloudFront CDN

### Processus CI/CD (GitHub Actions)

```yaml
1. Push sur main
2. Linter + tests auto
3. Build Docker images
4. Push vers ECR (AWS)
5. Deploy vers ECS
6. Health checks + rollback si erreurs
```

### Commandes manuelles (si nécessaire)

```bash
# Build images
docker build -t morocco360-frontend ./frontend
docker build -t morocco360-backend ./backend

# Deploy AWS ECS
aws ecs update-service --cluster morocco360 --service frontend --force-new-deployment

# Vérifier logs
aws logs tail /ecs/morocco360-backend --follow
```

**Détails complets** : `docs/DEPLOYMENT.md`

---

## 📈 Performance & Scalabilité

### Optimisations frontend
- **Code splitting** (Next.js automatic)
- **Image optimization** (next/image)
- **Caching** : Service Worker (PWA)
- **Lazy loading** : composants + images
- **Compression** : Gzip + Brotli

### Optimisations backend
- **Database indexing** : sur colonnes frecquentes (email, event_id, date)
- **Query optimization** : N+1 prevention, eager loading
- **Caching** : Redis pour data fréquentes (événements populaires)
- **Pagination** : 20-50 items par page
- **Gestion des fichiers** : S3 avec CloudFront CDN

### Capacité prévue
- **500K users** simultanés sans dégradation
- **5M événements** indexés
- **100K réservations/jour** en pic
- **Response time** < 200ms (p95)

---

## 🔄 Maintenance & Évolutivité

### Monitoring
- **Sentry** : error tracking
- **CloudWatch** : logs + metrics
- **DataDog** (optional) : APM
- **Uptime Robot** : alertes down

### Backup
- **DB** : snapshots journaliers RDS AWS
- **S3 images** : versioning + replication
- **Code** : git + GitHub

### Roadmap v2.0
- [ ] System notifs temps réel (WebSockets)
- [ ] Intégration paiement crypto (Bitcoin, USDC)
- [ ] Système de fidélité avancé (points, cashback)
- [ ] Dashboard analytics pour organisateurs
- [ ] App mobile native (React Native)
- [ ] Live streaming intégré (pour événements)

---

## 📞 Support & Contribution

### Contacter l'équipe
- **Issues** : GitHub Issues
- **Support utilisateurs** : keltoummalouki@gmail.com
- **Bugs critiques** : keltoummalouki@gmail.com

### Contribution
1. Fork le repo
2. Branch feature (`git checkout -b feature/xyz`)
3. Commit messages clairs
4. Tests + linting passants
5. Pull Request vers `develop`

---

## 📜 License & Legals

**License** : MIT (voir LICENSE)  

---

## 👨‍💻 Équipe & Attribution

**Morocco360** - Développé avec ❤️ pour les événements au Maroc

Maintainers : [keltoum malouki], [Emaikeltoummalouki@gmail.coml]

---

## 📝 Changelog

### v1.0.0 (Janvier 2026)
- ✅ Réservation d'événements
- ✅ Système de tickets avec QR codes
- ✅ Paiement sécurisé (Stripe + PayPal)
- ✅ Découverte activités/restaurants
- ✅ Profil utilisateur + favoris
- ✅ Support 3 langues (AR, FR, EN)
- ✅ Design responsive (mobile-first)

---

**Last updated** : February 2026  
**Status** : 🟢 Active Development