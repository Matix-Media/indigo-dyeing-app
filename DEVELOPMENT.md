# Development Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 12+
- Git

## Setup

### 1. Clone and install dependencies

```bash
cd indigo-dyeing-app

# Frontend
cd frontend
npm install
cp .env.example .env.local

# Backend (in new terminal)
cd backend
npm install
cp .env.example .env
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb indigo_dyeing

# From backend directory, run migrations
npm run db:migrate

# Seed design templates
npm run db:seed
```

### 3. Environment Configuration

**Frontend (.env.local)**:

```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

**Backend (.env)**:

```
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=indigo_dyeing

JWT_SECRET=your-dev-secret-key

STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

### 4. Run Development Servers

**Frontend** (from frontend/):

```bash
npm run dev
# Runs on http://localhost:5173
```

**Backend** (from backend/):

```bash
npm run dev
# Runs on http://localhost:3000
```

## Common Tasks

### Database Migrations

```bash
# Create new migration
npx knex migrate:make migration_name --env development

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback
```

### Database Seeds

```bash
# Run all seeds
npm run db:seed

# For specific seed file (if supported)
npx knex seed:run --specific=001_design_templates
```

### Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build
# Output in frontend/dist

# Backend
cd backend
npm run build
# Output in backend/dist
```

## Troubleshooting

### Database connection failed

- Ensure PostgreSQL is running: `psql -U postgres`
- Check .env DB credentials match your PostgreSQL setup
- Verify database exists: `psql -l | grep indigo_dyeing`

### Port already in use

- Frontend (5173): `lsof -i :5173` then `kill -9 <PID>`
- Backend (3000): `lsof -i :3000` then `kill -9 <PID>`

### Module not found errors

- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

### TypeScript errors

- Run type check: `npm run type-check` (frontend)
- Ensure TypeScript version matches

## Project Structure

```
indigo-dyeing-app/
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── api/              # API client
│   │   ├── stores/           # Zustand state management
│   │   ├── types/            # TypeScript types
│   │   ├── hooks/            # Custom React hooks
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Express middleware
│   │   ├── models/           # Data models
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utilities
│   │   ├── db.ts             # Database connection
│   │   └── index.ts          # Server entry point
│   ├── migrations/           # Database migrations
│   ├── seeds/                # Database seeds
│   ├── package.json
│   ├── knexfile.ts           # Knex configuration
│   └── tsconfig.json
│
├── docs/
├── .gitignore
└── README.md
```

## API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Designs

- `GET /api/designs/templates` - Get design templates
- `POST /api/designs` - Create design
- `GET /api/designs/my-designs` - Get user's designs
- `GET /api/designs/:id` - Get design by ID
- `DELETE /api/designs/:id` - Delete design

### Workshops

- `POST /api/workshops/register` - Register workshop
- `GET /api/workshops` - List workshops
- `GET /api/workshops/:id` - Get workshop by ID
- `GET /api/workshops/me` - Get my workshop
- `PUT /api/workshops/me` - Update my workshop
- `GET /api/workshops/:id/availability` - Get availability
- `POST /api/workshops/me/availability` - Set availability
- `GET /api/workshops/me/bookings` - Get workshop bookings
- `GET /api/workshops/:id/reviews` - Get reviews

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking
- `GET /api/bookings` - Get user bookings
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `POST /api/bookings/:id/checkout` - Stripe checkout

### Reviews

- `POST /api/reviews` - Create review

## Next Steps

1. Implement Design Studio UI (Phase 1B)
2. Add Workshop Management APIs (Phase 1C)
3. Implement Booking System (Phase 1D)
4. Add Payment Processing with Stripe (Phase 1D)
5. Build Review System (Phase 1E)
6. Testing & Deployment (Phase 1G)
