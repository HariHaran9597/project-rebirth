# Project Rebirth

Personal gym tracker: today's workout with last-session numbers and progression hints, rest timer, protein one-taps, weight trend, strength levels, muscle map, streaks and a weekly review. Installable on Android as its own app, works offline in the gym, syncs through Supabase.

No build step. Plain HTML/JS, deployed as a static site on Vercel.

## Files
- `index.html` — the whole app
- `config.js` — Supabase Project URL and public (anon/publishable) key
- `sw.js`, `manifest.webmanifest`, `icons/` — installable app + offline support
- `lib/supabase.js` — Supabase client (v2.115.0, vendored so it works offline)
- `api/estimate.js` — optional Gemini meal estimate
- `supabase/schema.sql` — table + row-level security (run once)

## Setup
1. Supabase: create a project, run `supabase/schema.sql` in the SQL Editor, turn off "Confirm email" under Authentication → Email.
2. Put the Project URL and anon/publishable key in `config.js`.
3. Vercel: Add New → Project → import this repo → Framework preset "Other" → Deploy. No build command needed.
4. On Android: open the Vercel URL in Chrome → menu (⋮) → **Install app** / **Add to Home screen**.

## Optional: meal estimate
Add these in Vercel → Project → Settings → Environment Variables, then redeploy:
- `GEMINI_API_KEY` (Google AI Studio)
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (same values as `config.js`)
- `GEMINI_MODEL` (optional, default `gemini-2.5-flash`)

## Data
One row per document in `public.logs`: `settings`, plus `d-YYYY-MM-DD` per day. Every edit is saved on the phone first and synced when online. Settings → Export backup downloads everything as JSON.
