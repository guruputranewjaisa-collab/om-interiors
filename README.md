# Om Interiors — Website + Backend

A working website for Om Interiors, with a real backend: every contact
form submission is saved to a database, optionally emailed to you, and
viewable in a password-protected admin dashboard.

## What's inside

```
om-interiors/
├── server.js          # Express backend (API + serves the site)
├── package.json
├── .env.example        # copy to .env and fill in your values
├── public/
│   ├── index.html       # the main website
│   └── admin.html       # password-protected dashboard
└── data.sqlite          # created automatically on first run
```

## Running it locally

You'll need [Node.js](https://nodejs.org) installed (version 18+).

```bash
cd om-interiors
npm install
cp .env.example .env      # then edit .env with your own values
npm start
```

Visit:
- **http://localhost:3000** — the live website
- **http://localhost:3000/admin.html** — the inquiries dashboard
  (default login: `admin` / `changeme123` — change this in `.env` before going live)

## How the contact form works

1. A visitor fills out the form and hits "Send inquiry."
2. The backend saves it to `data.sqlite` (a real database file) — nothing
   is lost even if email isn't set up.
3. If you've filled in the `SMTP_*` values in `.env`, you also get an
   email notification immediately.
4. You can see, update the status of (New / Contacted / Closed), or
   delete any inquiry from `/admin.html`.

## Setting up email notifications (optional)

Open `.env` and fill in:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=hello@ominteriors.in
```

If you use Gmail, you can't use your normal password — create an
["App Password"](https://myaccount.google.com/apppasswords) instead.
If you'd rather use a different email provider (Zoho, Outlook, a
transactional service like SendGrid or Resend), just swap in their
SMTP host/port/credentials — the code doesn't change.

If you skip this step entirely, the site still works fine — inquiries
just won't trigger an email, only appear in the dashboard.

## Putting it on the real internet

Right now this only runs on your own computer. To make it a real,
public website, you deploy it to a hosting provider. Straightforward,
inexpensive options that work well for a small Node app like this:

- **Railway** (railway.app) — connect your GitHub repo, it deploys automatically
- **Render** (render.com) — same idea, has a free tier
- **A VPS** (DigitalOcean, Hetzner) — more control, more setup

In all cases:
1. Push this folder to a GitHub repository (the `.gitignore` already
   excludes `.env` and the database, so your secrets won't be exposed).
2. Connect that repo to the hosting provider.
3. Set the same environment variables from `.env` in the provider's
   dashboard (never upload `.env` itself).
4. Point your domain name (e.g. ominteriors.in) at the hosting provider
   — they'll each walk you through this with your domain registrar.

## Changing the admin password

Before putting this live, edit `.env`:

```
ADMIN_USER=your-own-username
ADMIN_PASS=something-only-you-know
```

## Customizing the site

- Edit `public/index.html` directly for text, images, or design changes.
- Business details (address, phone, email) are near the bottom of the
  file, in the "Contact" section.
