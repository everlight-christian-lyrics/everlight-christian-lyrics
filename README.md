# Everlight Christian Lyrics — Admin + SEO version

This package upgrades the existing static starter into a Cloudflare Pages + Pages Functions + D1 app. It provides a password-protected admin dashboard, draft/publish workflow, a D1 song database, individual SEO-friendly `/lyrics/<slug>/` pages, and a dynamic `/sitemap.xml`.

## Important before deploying
- This is a Cloudflare Pages app, not a WordPress theme. Keep your current GitHub repo connected to Cloudflare Pages and replace its files with this package.
- You must create a Cloudflare D1 database and bind it as `DB`.
- Set `ADMIN_PASSWORD` and `SESSION_SECRET` as Cloudflare Pages **environment variables/secrets** for Production and Preview if you use preview deployments. Do not put passwords in GitHub files. Use a long unique password and a random secret of at least 32 characters.
- Update `REPLACE_WITH_YOUR_EMAIL` in `functions/lyrics/[slug].js` and `index.html` to an email address you control.
- The included robots.txt and sitemap use the current `pages.dev` domain. Update them if you later connect a custom domain.
- This implementation is a starter and should be tested in a Cloudflare Preview deployment before using it for important content. Keep a backup of your current repo.

## Setup
1. Download and extract the ZIP.
2. In your existing GitHub repository, replace the old files with all files/folders in this ZIP. Ensure `functions/`, `migrations/`, `admin/`, `wrangler.toml`, and `_headers` are uploaded at the repository root. Commit the changes.
3. In Cloudflare dashboard, open **Workers & Pages → D1 SQL Database** and create a database named `everlight-christian-lyrics-db`.
4. Copy the database ID from Cloudflare and replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` in `wrangler.toml`. Commit the updated file.
5. In the Cloudflare Pages project settings, add a D1 binding named `DB` and select the new database. Bind it for both Production and Preview if desired.
6. Apply `migrations/0001_create_songs.sql` to the D1 database using the Cloudflare D1 console (paste/run the SQL) or Wrangler CLI. For Wrangler CLI, install Wrangler and run: `npx wrangler d1 execute everlight-christian-lyrics-db --remote --file=migrations/0001_create_songs.sql` after authenticating and verifying the database name.
7. In **Pages → your project → Settings → Variables and Secrets**, add:
   - `ADMIN_PASSWORD`: a strong unique password you create.
   - `SESSION_SECRET`: a long random secret (at least 32 characters). Generate one with a password manager.
   Set them for Production and Preview as needed. Never share them or commit them.
8. Deploy/redeploy. Visit `/admin/` on your site, log in, and add your first song.
9. Check `/api/songs`, `/lyrics/your-song-slug/`, and `/sitemap.xml` on the deployed site.
10. In Google Search Console, verify your site, submit `https://YOUR-DOMAIN/sitemap.xml`, and request indexing for important published song pages. Google decides whether/when pages appear; indexing and ranking are not guaranteed.

## How to publish a song
1. Open `https://YOUR-DOMAIN/admin/`.
2. Log in using `ADMIN_PASSWORD`.
3. Click **Add new song** and fill the title, artist, language, slug, description, authorized lyrics, optional transliteration, and official links.
4. Confirm you have the right to publish the lyrics.
5. Choose **Publish publicly** and save. The public URL is `/lyrics/<slug>/`.

Drafts are excluded from public pages and sitemap. Unpublished lyrics are not served publicly. Keep database backups. A single-password admin is suitable for a small owner-operated catalogue; for multiple editors, add a proper identity provider and role management.

## Security and content notes
- Admin routes are protected by a signed, HttpOnly, Secure, SameSite cookie with a 12-hour expiry. Use HTTPS (Cloudflare Pages supplies it).
- Do not store secrets in the repository. Rotate the admin password and session secret if exposed.
- Publish only lyrics you own, have permission to publish, or otherwise have a valid legal basis to use. The checkbox is a reminder, not legal advice.
- This version does not automatically make Google display lyrics in its search snippet. It creates crawlable pages and a sitemap; Google controls crawling, indexing, snippets, and rankings.
- Search metadata is kept intentionally simple. Add a custom domain and Google Search Console later for stronger brand discoverability.

## Local notes
The Pages Functions require a Cloudflare-compatible runtime and a D1 binding; opening the HTML file directly will not make the admin/database work. Test via Cloudflare Pages Preview or Wrangler Pages development with a local D1 database.
