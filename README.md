# Morocco360

**Plateforme centralisee pour tous les evenements au Maroc**

---

## Vue d'ensemble

Morocco360 est une plateforme web permettant aux utilisateurs (locaux et touristes) de decouvrir, reserver et gerer des evenements au Maroc.

**Objectif principal** : Simplifier l'acces aux evenements au Maroc tout en offrant une experience utilisateur fluide et securisee.

---

## Public cible

- **Locaux** : Cherchant des evenements pres de chez eux
- **Touristes internationaux** : Explorant la culture, musique, sports au Maroc
- **Fans d'evenements** : Musique, sports, festivals, conferences, expositions

---

## Fonctionnalites principales

### 1. Authentification et Comptes
- Inscription et connexion par email/password
- JWT access token (15 min) + refresh token (7 jours) avec rotation
- Hachage bcrypt (cost factor 12) pour les mots de passe et les refresh tokens
- Rate limiting sur les routes sensibles

### 2. Systeme de tickets et evenements
- Consultation d'evenements filtres par type, date, ville, prix
- Reservation multi-tickets
- Gestion des billets avec QR code scannable
- Historique des reservations

### 3. Paiement securise
- Integration Stripe, PayPal, cartes bancaires locales
- Recus emailes et telechargeables
- Gestion des remboursements

### 4. Profil utilisateur
- Gestion des preferences
- Historique complet des reservations
- Parametres de securite

---

## Stack technologique

| Couche        | Technologies                          |
|---------------|---------------------------------------|
| **Frontend**  | Next.js 14+ (React, TypeScript)       |
| **Backend**   | Node.js + NestJS 11 (TypeScript)      |
| **Database**  | PostgreSQL 16 (Docker)                |
| **ORM**       | TypeORM 0.3                           |
| **Auth**      | JWT (access + refresh) + Passport.js  |
| **CI/CD**     | GitHub Actions                        |
| **Container** | Docker + Docker Compose               |

---

## Structure du projet

```
morocco360/
├── api/                        # Backend NestJS
│   ├── src/
│   │   ├── auth/               # Module authentification
│   │   │   ├── dto/            # RegisterDto, LoginDto
│   │   │   ├── guards/         # JwtAuthGuard, LocalAuthGuard, JwtRefreshGuard
│   │   │   ├── strategies/     # local, jwt, jwt-refresh
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── entities/       # User, Role
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── events/
│   │   │   └── entities/       # Event, TicketCategory
│   │   ├── orders/
│   │   │   └── entities/       # Order, Ticket
│   │   ├── payments/
│   │   │   └── entities/       # Payment
│   │   ├── database/
│   │   │   └── seeds/          # Seeders roles et utilisateurs
│   │   └── app.module.ts
│   ├── test/
│   ├── .env.example
│   └── package.json
├── web/                        # Frontend Next.js
├── docs/
│   └── conception/             # Diagrammes UML (draw.io)
├── docker-compose.yml          # PostgreSQL local
└── .github/
    └── workflows/              # CI/CD
```

---

## Modele de donnees

### Entites

| Entite           | Description                                            |
|------------------|--------------------------------------------------------|
| `User`           | Utilisateur avec role (ADMIN, ORGANIZER, USER)         |
| `Role`           | Role systeme                                           |
| `Event`          | Evenement avec categorie, dates, capacite, lieu        |
| `TicketCategory` | Categories de billets par evenement (VIP, standard...) |
| `Order`          | Commande d'un utilisateur                              |
| `Ticket`         | Billet individuel avec QR code                         |
| `Payment`        | Transaction de paiement                                |

### Relations cles
- `User` N:1 `Role`
- `User` 1:N `Order`
- `User` (organizer) 1:N `Event`
- `Event` 1:N `TicketCategory`
- `Order` N:1 `User`, N:1 `Event`
- `Order` 1:N `Ticket`
- `Order` 1:1 `Payment`

---

## Configuration et Installation

### Prerequis
- Node.js 18+
- Docker + Docker Compose
- Git

### 1. Cloner et configurer

```bash
git clone https://github.com/Keltoummalouki/Morocco360.git
cd Morocco360
```

### 2. Demarrer la base de donnees

```bash
cp api/.env.example api/.env
docker compose up -d
docker compose ps
```

Variables a renseigner dans `api/.env` :

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=morocco360_user
DB_PASS=morocco360_pass
DB_NAME=morocco360

NODE_ENV=development

JWT_ACCESS_SECRET=change_this_to_a_long_random_secret
JWT_REFRESH_SECRET=change_this_to_another_long_random_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Installer et lancer le backend

```bash
cd api
npm install
npm run start:dev
# Serveur disponible sur http://localhost:3001
```

### 4. Seeder la base de donnees

```bash
cd api
npm run seed
```

Comptes crees par le seeder :

| Email                   | Mot de passe  | Role      |
|-------------------------|---------------|-----------|
| admin@morocco360.ma     | Admin1234     | ADMIN     |
| organizer@morocco360.ma | Organizer1234 | ORGANIZER |
| user@morocco360.ma      | User1234      | USER      |

---

## API REST - Authentification

### Endpoints

| Methode | Route               | Description           | Auth             |
|---------|---------------------|-----------------------|------------------|
| POST    | `/auth/register`    | Inscription           | Public           |
| POST    | `/auth/login`       | Connexion             | Public           |
| POST    | `/auth/logout`      | Deconnexion           | Bearer (access)  |
| POST    | `/auth/refresh`     | Renouveler les tokens | Bearer (refresh) |

### Inscription

```json
POST /auth/register
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password1",
  "full_name": "John Doe",
  "phone_number": "+212600000000"
}
```

Reponse 201 :

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Regles de validation du mot de passe :
- 8 a 100 caracteres
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre

### Connexion

```json
POST /auth/login
{
  "email": "john@example.com",
  "password": "Password1"
}
```

---

## Securite

- **JWT** : access token 15 min + refresh token 7 jours avec rotation
- **Refresh token** : seul le hash bcrypt est stocke en base (jamais le token brut)
- **Rotation** : chaque `/auth/refresh` invalide l'ancien refresh token et en cree un nouveau
- **Rate limiting** : 5 req/min sur `/auth/register`, 10 req/min sur `/auth/login`
- **Validation** : whitelist stricte sur tous les DTOs (class-validator)
- **Hachage passwords** : bcrypt cost factor 12
- **Variables sensibles** : uniquement en variables d'environnement (jamais en Git)

---

## Tests

```bash
cd api
npm run test        # Tests unitaires
npm run test:cov    # Tests avec couverture
npm run test:e2e    # Tests E2E
```

---

## CI/CD

GitHub Actions execute automatiquement :
1. Linting ESLint
2. Build TypeScript
3. Tests unitaires
4. Tests E2E (avec service PostgreSQL)

Fichier de configuration : `.github/workflows/ci.yml`

---

## Contribution

1. Fork le repo
2. Creer une branche (`git checkout -b feature/ma-feature`)
3. Commiter avec des messages clairs
4. Ouvrir une Pull Request vers `main`

---

## Changelog

### v0.2.0 (Mars 2026)
- Authentification JWT (access token + refresh token avec rotation)
- Strategies Passport : local, jwt, jwt-refresh
- Rate limiting sur les routes d'auth
- Seeders pour les roles et utilisateurs
- Validation globale des DTOs

### v0.1.0 (Fevrier 2026)
- Mise en place du monorepo (api/ + web/)
- Configuration NestJS + TypeORM + PostgreSQL via Docker
- Modelisation BDD : 7 entites (User, Role, Event, TicketCategory, Order, Ticket, Payment)
- Pipeline CI/CD GitHub Actions

---

**Status** : Active Development
**Derniere mise a jour** : Mars 2026
