# campus
# Parcel-Hub-main-2

## Production deployment notes

This project is designed as a full-stack Node + Express + SQLite app with a React frontend built by Vite.

Important deployment differences from local development:

- The frontend must not hardcode `localhost` in production.
- The backend must bind to `0.0.0.0` and respect `PORT` from the runtime environment.
- CORS must allow the deployed frontend origin, not only `localhost`.
- SQLite must write to a writable persistent location in the deployment environment.

### Required environment variables

Create a `.env` file at the project root using values matching your deployment host.

```env
# Frontend (Vite) — must be set for production deployment
VITE_API_BASE_URL=https://your-api-domain.example.com

# Backend
PORT=5001
HOST=0.0.0.0
CORS_ORIGINS=https://your-frontend-domain.example.com
JWT_SECRET=replace_with_a_secure_random_string
DB_PATH=./server/data/campus_hub.db
```

### Production build

```bash
npm install
npm run build --workspace client
```

### Production start

```bash
PORT=5001 HOST=0.0.0.0 JWT_SECRET=replace_with_a_secure_random_string CORS_ORIGINS=https://your-frontend-domain.example.com npm run start
```

### Deployment architecture

Recommended architecture:

- Frontend: static hosted site or Node/Vite build served behind a reverse proxy
- Backend: Node.js Express server on a host that can run the app and write to the SQLite database
- Database: SQLite file database in a persistent writable directory

This project is not a pure static site because it includes an Express API and SQLite persistence.
