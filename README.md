# Everlight Christian Lyrics — starter website

A static, responsive first version of Everlight Christian Lyrics. It is designed to run without a paid server, database, API key, or build step.

## Features in this starter
- Responsive homepage with Telugu-first visual styling
- Local catalogue search using `songs.json`
- Search by title, artist, description, and alternate search terms
- Language filter, currently seeded for Telugu
- External search links for Google, YouTube, and Spotify
- No audio or copyrighted lyrics are copied or hosted
- No API keys or paid services required for this version

## Files
- `index.html` — homepage structure
- `styles.css` — responsive design
- `app.js` — catalogue and web-search logic
- `songs.json` — editable starter catalogue

## Test locally
1. Extract the ZIP.
2. Open `index.html` in a browser. Most features work directly from the file.
3. For a closer hosted preview, run a static local server from this folder:
   - Python: `python -m http.server 8000`
   - Visit `http://localhost:8000`

## Free deployment with Cloudflare Pages (no paid Hostinger plan needed)
1. Create a GitHub account if you do not have one.
2. Create a new repository, for example `everlight-christian-lyrics`.
3. Upload the contents of this folder to the repository root (not the ZIP itself).
4. Sign in to Cloudflare and open Workers & Pages.
5. Create a Pages project and connect the GitHub repository.
6. For a plain HTML/CSS/JS site, select no framework / static site. Leave the build command blank and set the output directory to `/` or the repository root as the Cloudflare setup screen requests.
7. Deploy. Cloudflare will provide a free `*.pages.dev` address.

Provider dashboard labels and free-plan limits can change; check the current Cloudflare Pages documentation before deploying.

## Add or edit songs
Edit `songs.json`. Each item can have:
- `title` (required)
- `language` (e.g. `Telugu`, `English`)
- `artist`
- `description`
- `searchTerms` (alternate spellings/transliterations)
- `youtubeUrl` (only an official or authorized URL)
- `spotifyUrl` (valid track/artist/album URL)
- `authorizedLyricsUrl` (a source you are allowed to link to)

Do not put full lyrics in this file unless you have permission or a valid legal basis to publish them. The current starter entries are generic search topics, not verified individual song records. Verify titles, creators, and official links before treating them as catalogue listings.

## Important current limitation
The web-search buttons open a search results page on Google, YouTube, or Spotify. This starter does not embed a third-party search engine or fetch live results inside the page. An API-backed unified results page can be added later after checking provider API terms, quotas, and whether a genuinely free tier is available.

## Before public launch
- Replace `hello@example.com` in `index.html` with a real contact address you control.
- Add a privacy notice and terms/contact page if collecting data or user submissions.
- Add only verified metadata, authorized links, and lyrics you can legally publish.
- Test mobile layout and links after deployment.
