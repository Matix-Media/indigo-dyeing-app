# Indigo Dyeing Design + Workshop Booking App

A Taiwan-wide marketplace connecting users with indigo dyeing workshops. Users create custom indigo designs using pre-made templates and book workshops to create them together with experienced artisans.

## Project Structure

```
indigo-dyeing-app/
├── frontend/          # React + TypeScript + Vite web app
├── backend/           # Node.js + Express API
├── docker-compose.yml # Full-stack production setup
├── .env.example       # Required environment variables
└── docs/              # Documentation
```

---

## Quick Start (Development)

### Prerequisites

- Node.js 20+
- PostgreSQL 12+

### Backend

```bash
cd backend
cp .env.example .env   # fill in DB credentials and secrets
npm install
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:3000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # fill in VITE_STRIPE_PUBLIC_KEY
npm install
npm run dev            # http://localhost:5173
```

---

## Docker Deployment

### 1. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable                 | Description                      |
| ------------------------ | -------------------------------- |
| `DB_PASSWORD`            | PostgreSQL password              |
| `JWT_SECRET`             | Long random string (32+ chars)   |
| `STRIPE_SECRET_KEY`      | Stripe live/test secret key      |
| `VITE_STRIPE_PUBLIC_KEY` | Stripe live/test publishable key |
| `STRIPE_WEBHOOK_SECRET`  | From Stripe webhook dashboard    |
| `FRONTEND_URL`           | Your public domain (for CORS)    |

### 2. Build and start

```bash
docker compose up --build -d
```

This starts:

- **PostgreSQL 16** on an internal network
- **Backend** (Node.js) on internal port 3000
- **Frontend** (nginx) exposed on port **80**

### 3. Run database migrations

```bash
docker compose exec backend node -e "
  import('./dist/db.js').then(({ default: db }) =>
    db.migrate.latest().then(() => { console.log('done'); process.exit(0); })
  )
"
```

Or with the Knex CLI inside the container:

```bash
docker compose exec backend npx knex migrate:latest
docker compose exec backend npx knex seed:run
```

### 4. Stripe webhooks

In the Stripe Dashboard, add a webhook endpoint pointing to:

```
https://your-domain.com/webhooks/stripe
```

Events to enable:

- `checkout.session.completed`
- `checkout.session.async_payment_failed`

Copy the webhook signing secret and add it as `STRIPE_WEBHOOK_SECRET` in `.env`, then restart:

```bash
docker compose restart backend
```

---

## Checking logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Health check

```
GET /health  →  { "status": "ok", "timestamp": "..." }
```

---

## CI

GitHub Actions runs on every push/PR to `main`:

- TypeScript type-check
- Production build (both frontend and backend)

See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: JWT
- **Payments**: Stripe
- **Deployment**: Vercel (frontend), Railway (backend)

## Phases

- **Phase 1 (MVP)**: Design tool + Workshop booking system
- **Phase 2**: Product ordering, advanced design editor, messaging
- **Phase 3**: International expansion, artist profiles, referral system

## Development Status

- [x] Project structure
- [ ] Frontend setup
- [ ] Backend setup
- [ ] Database schema
- [ ] Authentication
- [ ] Design tool
- [ ] Workshop management
- [ ] Booking system
- [ ] Testing & deployment
