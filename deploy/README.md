# Self-hosting lemo-training (Hetzner Lemo-Main)

Live: https://training.lemonsintheroom.com

| Part | Where |
|---|---|
| Frontend (`vite build` → `dist/`) | `/srv/lemo-training`, served by host Caddy (SPA fallback to `index.html`) |
| API (`api/*.js`, Vercel-style handlers) | container `lemo-training-api` on `127.0.0.1:8110`, wrapped by `deploy/server.mjs` |
| Database + auth | Supabase cloud project `nzlctxteymrysmvqbquc` (unchanged) |
| Lesson videos | Cloudflare R2 `pub-a5b0afd78ca4495dbcc59862b6e90b23.r2.dev` (Leo's account) |

Server: `ssh -i ~/.ssh/id_ed25519_hetzner admin@65.21.180.186`, code in `~/lemo-training`.

## Secrets
`~/lemo-training/deploy/.env` (chmod 600), keys listed in `deploy/.env.example`. Never commit it.

## Deploy (from a clean checkout of `main`, in git-bash)
```sh
npm ci && npm run build
tar -C dist -czf ../dist.tgz . && ssh lemo 'mkdir -p ~/lemo-training-dist && tar -xzf - -C ~/lemo-training-dist' < ../dist.tgz
# frontend: /srv/lemo-training is admin-owned
ssh lemo 'rm -rf /srv/lemo-training.new && cp -r ~/lemo-training-dist /srv/lemo-training.new && rm -rf /srv/lemo-training.old && mv /srv/lemo-training /srv/lemo-training.old; mv /srv/lemo-training.new /srv/lemo-training'
# api
git archive HEAD api src/utils/supabase.js src/i18n/lang-it.js deploy | ssh lemo 'mkdir -p ~/lemo-training && tar -xf - -C ~/lemo-training && cd ~/lemo-training/deploy && docker compose up -d --build'
```

## Checks
- `wget -qO- http://127.0.0.1:8110/healthz` on the server → `{"ok":true}`
- `curl -s -X POST https://training.lemonsintheroom.com/api/chat` → 401 `Login richiesto`

## Cutover reminders
- Supabase → Authentication → URL Configuration: Site URL `https://training.lemonsintheroom.com`, add it to Redirect URLs.
- `scripts/auth-mails.mjs` renders the Supabase email templates with the site URL.
