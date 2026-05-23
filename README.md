# 🎮 GTI-api

**Grand Theft Info — GraphQL API Backend**

Express + Apollo Server + Drizzle ORM + Neon Postgres backend for the [Grand Theft Info](https://github.com/BathSalt-2/GTI-1) cybersecurity training platform.

By [Or4cl3 AI Solutions](https://github.com/BathSalt-2).

---

## Quick Start

```bash
# Clone
git clone https://github.com/BathSalt-2/GTI-api.git
cd GTI-api

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your Neon Postgres URL and JWT secret

# Run migrations
npm run db:push

# Start dev server
npm run dev
```

The API will be available at `http://localhost:4000/graphql`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+ |
| **Server** | Express 4 + Apollo Server 4 |
| **API** | GraphQL |
| **Database** | Neon Postgres (serverless) |
| **ORM** | Drizzle ORM |
| **Auth** | JWT (Bearer tokens) |
| **Deploy** | Render (Blueprint included) |
| **Security** | Trivy Docker image scanning |

---

## API Schema

### Queries

| Query | Auth | Description |
|-------|------|-------------|
| `me` | ✅ | Current user profile |
| `missions` | ❌ | List missions (filterable by category/difficulty) |
| `mission(id)` | ❌ | Single mission details |
| `myProgress` | ✅ | User's mission progress |
| `leaderboard` | ❌ | Top players by XP |
| `openMatches` | ❌ | Available PvP matches |
| `myMatches` | ✅ | User's match history |
| `myAchievements` | ✅ | Unlocked achievements |
| `allAchievements` | ❌ | All available achievements |

### Mutations

| Mutation | Auth | Description |
|----------|------|-------------|
| `register` | ❌ | Create account |
| `login` | ❌ | Get JWT token |
| `startMission` | ✅ | Begin a mission |
| `completeMission` | ✅ | Submit score & complete |
| `createMatch` | ✅ | Create PvP lobby |
| `joinMatch` | ✅ | Join open PvP match |

---

## Database Schema

```
users ──┬── mission_progress ── missions
        ├── user_achievements ── achievements
        └── pvp_matches
```

Run `npm run db:studio` to open Drizzle Studio and inspect your database.

---

## Deployment (Render)

1. Create a [Neon](https://neon.tech) database
2. Fork/import this repo on [Render](https://render.com)
3. Click "New Blueprint Instance" and point to this repo
4. Set `DATABASE_URL` to your Neon connection string
5. Set `CORS_ORIGIN` to your frontend URL
6. Deploy 🚀

The `render.yaml` blueprint handles the rest.

---

## CI/CD

- **CI** — Type checking + build on every push/PR to `main`
- **Trivy** — Docker image vulnerability scanning on push/PR

---

## License

MIT — Or4cl3 AI Solutions
