# Sounds Of — Brewing Folk Radio

A Node.js website for hosting all Brewing Folk radio shows, podcasts, mixes and projects.

## Quick Start

```bash
npm install
npm start
```

Then open http://localhost:3000

Admin panel: http://localhost:3000/admin

## Stack

- **Express** — web server
- **EJS** — templating
- **Multer** — image uploads
- **JSON files** — data store (no database needed)

## File Structure

```
sounds-of/
├── server.js          # Main app
├── data/
│   ├── posts.json     # All shows
│   ├── contributors.json
│   ├── tags.json
│   ├── pages.json     # About + Contact content
│   └── settings.json  # Site name, max posts etc
├── views/
│   ├── partials/      # header, footer, player
│   ├── admin/         # dashboard, post-form, etc
│   └── *.ejs          # public pages
└── public/
    ├── css/style.css
    ├── js/main.js
    └── uploads/       # locally uploaded images
```

## Audio Hosting (Cloudflare)

Cloudflare R2 is the recommended storage. Upload your .mp3 files to R2, make the bucket public, and paste the URL into the **Audio URL** field when creating a show.

Image URLs from Cloudflare Images work the same way — paste into the **Image URL** field.

## Features

- **Carousel** — last 5 shows featured on homepage with auto-advance
- **Sticky audio player** — persists across page navigation using sessionStorage
- **Categories** — Radio, Podcast, Project, Mix (burnt orange links)
- **Tags** — each tag has a unique persistent colour
- **Contributors** — bio pages with portrait + all their shows
- **Admin** — create/edit/delete shows and contributors, edit About + Contact pages, configure site settings
