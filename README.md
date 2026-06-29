# Earts — Artist Community Platform

Full-stack React + Express web app.

## Project Structure
```
earts/
├── client/   # React (Vite) frontend
└── server/   # Express backend
```

## Quick Start

### 1. Start the backend
```bash
cd server
npm start         # production
# or
npm run dev       # with file watching (Node 18+)
```
Server runs on **http://localhost:5000**

### 2. Start the frontend
```bash
cd client
npm run dev
```
App runs on **http://localhost:5173**

---

## Pages
| Route | Page |
|---|---|
| `/` | Home |
| `/gallery` | Browse & search artworks |
| `/artwork/:id` | Artwork detail + purchase |
| `/profile/:username` | Artist profile |
| `/about` | About Earts |
| `/products` | Plans & pricing |
| `/upload` | Upload artwork (auth required) |
| `/settings` | Edit profile (auth required) |
| `/login` | Sign in |
| `/signup` | Create account |

## Demo Accounts
Register a new account via `/signup`, or use the pre-seeded users:
- `jane@earts.com`
- `nadia@earts.com`
- `ara@earts.com`

> **Note:** The server uses in-memory storage. Data resets on restart. Swap `users`/`artworks` arrays for a real database (MongoDB, PostgreSQL, etc.) in production.
