# Daily Tracker

Personal daily task and spending tracker. Each user signs up with email and password and gets private data.

Live example: [daily-tracker-navy.vercel.app](https://daily-tracker-navy.vercel.app/)

## Fix Vercel deployment (required env vars)

If sign-up shows **"Something went wrong"**, the API database is not configured. Vercel only hosts the frontend unless you add these **Environment Variables** in your Vercel project → Settings → Environment Variables:

| Variable | Value |
|----------|--------|
| `JWT_SECRET` | A long random string (32+ characters) |
| `TURSO_DATABASE_URL` | From [Turso](https://turso.tech) (free) |
| `TURSO_AUTH_TOKEN` | Turso auth token for that database |

### Set up Turso (5 minutes)

1. Go to [turso.tech](https://turso.tech) and create a free account
2. Create a new database (e.g. `daily-tracker`)
3. Copy the database URL and create an auth token
4. Paste both into Vercel environment variables
5. **Redeploy** the project (Deployments → ⋯ → Redeploy)

After redeploy, `/api/health` should return `{ "ok": true, "database": true }`.

## Run locally

```bash
npm install
npm run dev
```

- Website: http://localhost:5173
- API: http://localhost:3001

Local dev uses a SQLite file in `./data/` automatically. Optional: set Turso env vars to use cloud DB locally too.

## Features

- Email + password accounts (private data per user)
- Custom **display name** in Settings (shown in greeting)
- Daily tasks (repeat every day), expenses, mood, analysis
- Daily reminders (browser notifications)
- Indian Rupees (₹) budgeting

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add env vars: `JWT_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
4. Deploy (build command: `npm run build`, output: `dist`)

The `api/` folder provides serverless endpoints. The `vercel.json` routes all non-API traffic to the React app.
