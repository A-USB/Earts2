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
   long random `JWT_SECRET`, `CLIENT_ORIGIN=https://<client-project>.vercel.app`,
   `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`.
   Deploy it and allow its URL in MongoDB Atlas Network Access.

Password reset emails use Resend. Create an API key in Resend, verify a domain
you control there, then set `RESEND_FROM_EMAIL` to an address on that domain
(for example, `Earts <password-reset@mail.example.com>`). For local development,
put these values in `server/.env`; for Vercel, set them in the backend project's
environment variables and redeploy. The `onboarding@resend.dev` fallback is for
development and should not be used as the production sender. A missing API key
or client origin returns a configuration error; provider rejections are logged
with the response reason and do not leave a usable reset token behind.

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

## Safety and checkout notes

- Artwork and profile reports are submitted through `/api/reports`. To review them, set `MODERATOR_USER_IDS` on the backend to a comma-separated list of trusted account IDs, then open `/moderation` while signed in as one of those accounts. Find account IDs in the MongoDB `users` collection. Never put moderator IDs in a `VITE_` variable.
- Artwork checkout is currently a demo flow. It records a sample order but does not collect card details or process a payment. Do not describe demo orders as completed real sales.
- MongoDB is used when configured. The in-memory store is only a development fallback; fallback data is temporary and disappears when the process restarts.

GitHub Actions runs frontend lint/build and backend syntax checks for pushes and pull requests to `main`.
