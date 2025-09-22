# HomiesHomes Real Estate API

A comprehensive real estate platform with a Koa.js backend and a React frontend. This project provides a RESTful API for property listings, user management, bookings, favorites, and agent functionality, plus an interactive OpenAPI documentation server.

Note: This project was originally developed as part of a university module and has since been migrated from a university-managed repository to this personal repository.

## Features

- **Property Listings**: Browse, search, and filter properties by various criteria
- **User Authentication**: Secure JWT-based login and registration system
- **Role-Based Access**: Different capabilities for users, agents, and administrators
- **Booking System**: Schedule property viewings with real estate agents
- **Favorites**: Save properties for later viewing
- **Agent Application**: Apply to become an agent with admin approval workflow
- **HATEOAS Support**: Hypermedia links in responses
- **OpenAPI Docs**: Interactive API documentation server

## Technology Stack

### Backend
- Node.js, Koa.js
- MySQL (mysql2/promise)
- JSON Web Tokens (JWT)
- OpenAPI 3.0 (served statically)

### Frontend
- React (CRA), React Router
- Axios
- FontAwesome

## Server URLs (Production/Codio)

- API Server: `https://gammacairo-deltareward-9001.codio-box.uk`
- Frontend: `https://gammacairo-deltareward-3000.codio-box.uk`
- API Docs: `https://gammacairo-deltareward-3000.codio-box.uk:9030`

These are Codio-specific. For local development, use the instructions below.

## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally

### 1) Backend setup

From the project root:

```bash
cd backend
npm install
```

Create `backend/.env` with your local settings:

```env
PORT=9001
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=homieshomes
JWT_SECRET=change_me
# Comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
# Docs server host/port (optional)
DOCS_PORT=9030
DOCS_HOST=http://localhost
```

Create the database (use Workbench or CLI):

```sql
CREATE DATABASE homieshomes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Import schema and optional sample data:

```bash
mysql -u root -p homieshomes < "schemas/schema.sql"
mysql -u root -p homieshomes < "sql_queries/test_data.sql" # optional
```

Start the API server:

```bash
npm start
# API on http://localhost:9001
```

Docs server (optional, separate terminal):

```bash
npm run docs:serve
# Docs on http://localhost:9030
```

### 2) Frontend setup

From the project root:

```bash
cd my-frontend
npm install
```

Configure API base URL in `my-frontend/src/config/api.js`:

```js
const API_BASE_URL = "http://localhost:9001";
export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/users`,
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,
  properties: `${API_BASE_URL}/properties`,
  bookings: `${API_BASE_URL}/bookings`,
  favourites: `${API_BASE_URL}/favourites`,
  agentRequest: `${API_BASE_URL}/agent-requests/status`,
  agentRequests: `${API_BASE_URL}/agent-requests`,
};
export default API_BASE_URL;
```

Run the frontend:

```bash
npm start
# App on http://localhost:3000
```

## Security Audit Summary (Local Hardening)

During a quick audit, we checked for SQL injection, JWT handling, CORS, sensitive logging, and file operations. Highlights:

- **SQL Queries**: Routes use parameterized queries (`?` placeholders) which mitigates SQL injection. Keep using placeholders for all user input. Avoid string interpolation in SQL.
- **CORS**: Centralized in `backend/middlewares/corsOptions.js` and route helpers. Allowed origins are controlled by `ALLOWED_ORIGINS` and localhost is supported. For production, set `ALLOWED_ORIGINS` explicitly and avoid wildcard origins.
- **JWT**: `JWT_SECRET` is required in non-test environments. Tokens are verified on protected routes. Ensure strong, long secrets in production.
- **Sensitive Logging**: Some debug logs may leak sensitive info in dev (e.g., password hashing steps, partial tokens). For production, disable verbose logs and remove any logs that include credentials, raw tokens, or hashed passwords.
  - Examples to review if deploying to prod: `backend/routes/users.js` (password hash/tokens debug), `backend/middlewares/hateoas.js`, `backend/middlewares/auth.js`, and test utilities that log secrets.
- **Environment Variables**: Now default to safe local values. Don’t commit `.env`. Ensure `.gitignore` includes:
  
  ```gitignore
  **/.env
  .env
  .env.*
  .env.*.local
  backend/.env
  my-frontend/.env
  ```
  
  If `.env` is already tracked, run: `git rm --cached <path-to-env>` then commit.
- **File Uploads**: No unsafe arbitrary file writes detected in routes. If adding uploads, validate type/size, store outside webroot, and generate safe filenames.
- **Rate Limiting/Brute Force**: Not implemented. Consider adding basic rate limiting for auth endpoints in production.
- **TLS**: Handle at reverse proxy/CDN in production. Backend assumes HTTP behind a trusted ingress.

## Testing

From `backend/`:

```bash
npm run test         # runs setup then jest
npm run test:watch
npm run test:coverage
```

## Project Scripts (Backend)

- `npm start`: start API server
- `npm run docs:serve`: start docs server on `DOCS_PORT`
- `npm run docs`: copy OpenAPI into public docs folder
- `npm test`: set up test DB and run jest

## Contributing

- Use parameterized SQL.
- Keep CORS origins strict via env.
- Avoid logging secrets or tokens.
- Add types and validation for any new fields.

## License

This project is for educational purposes. Adapt licensing as needed for production use.
