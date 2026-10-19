# Publishing Hustle & Hype on Lagos Life

Lagos Life doesn't take a file upload. Your game lives on your own HTTPS website, and Lagos Life shows it inside its game player. So there are two parts: host the game, then register it in the Lagos Life developer dashboard.

This folder is the finished game for Lagos Life. It already includes:

- the Vatar Games SDK (loaded from Vatar's own address, as their docs require)
- the security header Lagos Life needs to show your game in its frame (`_headers` for Netlify and Cloudflare Pages, `vercel.json` for Vercel, `nginx-snippet.conf` for your own server)
- the fonts, bundled locally

## Part 1: Put the game online (pick one host)

### Netlify (easiest)
1. Sign in at app.netlify.com.
2. Open **Add new site → Deploy manually** and drag this whole folder onto the page.
3. Netlify gives you an address like `https://hustle-and-hype.netlify.app`. You can rename it in Site settings.

### Cloudflare Pages
1. In the Cloudflare dashboard, open **Workers & Pages → Create → Pages → Upload assets**.
2. Upload this folder. The `_headers` file is picked up automatically.

### Vercel
1. Install the Vercel CLI, then run `vercel deploy --prod` inside this folder. `vercel.json` sets the header.

### Your own server
1. Upload the folder and add the line from `nginx-snippet.conf` to your server block.
2. Make sure the server does **not** send `X-Frame-Options`, because that blocks Lagos Life from showing the game.

**Check it worked:** open your game address in a normal browser. The game should load, and the leaderboard panel should say it isn't available. That's expected outside Lagos Life.

## Part 2: Register on Lagos Life

1. **Get test keys:** go to lagoslife.app/developers/keys. This creates a draft of your game.
2. **Test in the sandbox:** open lagoslife.app/developers/sandbox/<your-draft> with your game address. Check that:
   - the title screen shows "Lagos Life top hustlers"
   - finishing a run posts your score, and the end screen shows your rank
   - leaving the app or opening its menu shows the "Paused" screen and stops the sound
3. **Integration checklist:** tick the items in the dashboard (see the note about purchases below).
4. **Listing:** upload `icon-512.png`, the five screenshots, and the category and descriptions from `LISTING.md` (all in the store kit).
5. **Agreement:** read and accept the Developer Agreement, then submit for review.
6. Once approved, you get a live secret. Hustle & Hype doesn't use a server, so there's nothing to set it on yet.

## Updating the game later

Rebuild with `python3 tools/build-lagoslife.py` from the project folder and upload the new `dist/lagoslife` folder to the same address. Per Lagos Life's docs, code at the same address updates automatically. A new address goes back to review.

## Note on purchases

The dashboard checklist in Lagos Life's docs mentions a test purchase verified by your own server. Hustle & Hype is free with no purchases, so check with Lagos Life (support@lagoslife.app) whether that item applies to free games before you build anything for it.
