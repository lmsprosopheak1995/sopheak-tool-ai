# StoryAI — Story Translate & Summarize

Static frontend (`public/index.html`) + Vercel serverless function (`api/ai.js`) that calls the OpenAI API.
The API key stays on the server, never in the browser.

## Deploy
1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project** → import the repo (no build settings needed).
3. **Settings → Environment Variables**: add `OPENAI_API_KEY` (optional: `OPENAI_MODEL`).
4. Redeploy. Done.

## Run locally
```
npm i -g vercel
cp .env.example .env.local   # put your real key in it
vercel dev
```

## Voice reading (ប្រុស / ស្រី)
Uses the browser's built-in Web Speech API (free, no server). Available voices depend on the device/browser:
Microsoft Edge on Windows has Khmer voices (male/female); Chrome/Android may have a Khmer voice without gender choice,
in which case the app shifts the pitch for male/female.

## Supabase (login + history)
1. Supabase Dashboard → **SQL Editor** → paste and run `supabase.sql` (creates the `stories` table with Row Level Security).
2. **Authentication → Providers → Email** is on by default. For quick testing you may turn off "Confirm email".
3. **Authentication → URL Configuration**: set *Site URL* to your Vercel domain (e.g. https://your-app.vercel.app).
4. `public/config.js` holds the project URL + **anon** key (public by design). NEVER put the `service_role` key anywhere in this repo.
