# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY knexfile.cjs ./knexfile.cjs
COPY migrations ./migrations
COPY seeds ./seeds

EXPOSE 3000

CMD ["sh", "-c", "npx knex migrate:latest --knexfile knexfile.cjs --env production && npx knex seed:run --knexfile knexfile.cjs --env production && node dist/index.js"]
