# Acquisitions API

Node.js / Express REST API backed by [Neon](https://neon.tech) PostgreSQL.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+)
- A [Neon](https://console.neon.tech) account with a project created
- Your **Neon API Key** and **Project ID** (both found in the Neon Console)

---

## Environment variables

| File               | Purpose                                                           |
| ------------------ | ----------------------------------------------------------------- |
| `.env.development` | Local Docker dev — filled with your Neon API credentials          |
| `.env.production`  | Production Docker — filled with your Neon Cloud connection string |

Neither file is committed to git. Copy the relevant section from below.

---

## Development (Neon Local)

Neon Local is a lightweight Docker sidecar that talks to your real Neon project and creates an **ephemeral branch** for the session. Your local app connects to this branch via a standard Postgres socket. The branch is automatically deleted when the container stops.

### 1. Configure `.env.development`

```bash
cp .env.development .env.development   # already exists — just fill the blanks
```

Open `.env.development` and set:

```
NEON_API_KEY=<your api key from console.neon.tech/app/settings/api-keys>
NEON_PROJECT_ID=<your project id from console.neon.tech — e.g. proud-bird-12345678>
PARENT_BRANCH_ID=
ARCJET_KEY=<Your Arcjet key>
```

`PARENT_BRANCH_ID` is optional. If omitted, Neon Local branches off **main**.

### 2. Start the stack

```bash
docker compose -f docker-compose.dev.yml up --build
```

Docker will:

1. Pull `neondatabase/neon_local` and create an ephemeral Neon branch.
2. Build the app image (development target) and start it with `--watch` for hot-reload.
3. Inject `DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require` into the app — overriding whatever is in `.env.development`.

The API is available at `http://localhost:4000`.

### 3. Run database migrations

```bash
docker compose -f docker-compose.dev.yml exec app npm run db:migrate
```

### 4. Stop and clean up

```bash
docker compose -f docker-compose.dev.yml down
```

The ephemeral Neon branch is deleted automatically.

> **Mac + Docker Desktop note:** For reliable file watching (`--watch`) and Git volume mounts, use **gRPC FUSE** instead of VirtioFS in Docker Desktop → Settings → General.

## Alternatively, You can build the project by running: npm run dev:docker

## Production (Neon Cloud)

In production the app connects directly to your Neon Cloud database. No sidecar is involved.

### 1. Configure `.env.production`

```
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
JWT_SECRET=<strong random secret — openssl rand -hex 64>
DATABASE_URL=<connection string from Neon Console — postgres://...neon.tech/neondb?sslmode=require>
ARCJET_KEY=<Your Arcjet key>
```

### 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Run migrations against Neon Cloud

```bash
docker compose -f docker-compose.prod.yml exec app npm run db:migrate
```

### 4. Verify health

```bash
curl http://localhost:4000/health
# {"status":"OK","timestamp":"...","uptime":...}
```

## Alternatively, You can build the project by running: npm run prod:docker

## How `DATABASE_URL` switches between environments

| Context           | `DATABASE_URL` value                         | Driver config                                                |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **Dev (Docker)**  | `postgres://neon:npg@neon-local:5432/neondb` | `neonConfig` set to HTTP mode (see `src/config/database.js`) |
| **Prod (Docker)** | Your Neon Cloud URL (`...neon.tech`)         | Default — standard Neon HTTPS                                |

`docker-compose.dev.yml` injects the local URL via an `environment:` block that **overrides** any value in `.env.development`, so there is no risk of accidentally pointing dev at production.

The `@neondatabase/serverless` driver is configured at startup in `src/config/database.js`:

```js
if (process.env.NODE_ENV !== 'production') {
  neonConfig.fetchEndpoint = (host, port) => `http://${host}:${port}/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
```

This tells the serverless driver to speak plain HTTP to Neon Local on the same port (5432) instead of reaching out to Neon's HTTPS API.

---

## Available scripts

```bash
npm run dev          # run with hot-reload (outside Docker)
npm run db:generate  # generate Drizzle migration files
npm run db:migrate   # apply migrations
npm run db:studio    # open Drizzle Studio
npm run lint         # ESLint
npm run format       # Prettier
```
