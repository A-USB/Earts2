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

## Deploy to Vercel

Create two Vercel projects from this repository:

1. Set the frontend project's Root Directory to `client`. Add
   `VITE_API_URL=https://<server-project>.vercel.app/api` and deploy it.
2. Set the backend project's Root Directory to `server`. Add `MONGODB_URI`, a
   long random `JWT_SECRET`, and `CLIENT_ORIGIN=https://<client-project>.vercel.app`.
   Deploy it and allow its URL in MongoDB Atlas Network Access.

Set these variables for Production and Preview as needed. If you use a custom
frontend domain, include it in `CLIENT_ORIGIN` and redeploy the backend.

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
