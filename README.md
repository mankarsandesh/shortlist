# Shortlist – Recruiter CRM for LinkedIn

A free Chrome extension (Manifest V3) for recruiters and freelancers. It lets you save a LinkedIn profile in one click, move candidates through a pipeline, get follow-up reminders, and send messages from templates.

- Website: https://mankarsandesh.github.io/shortlist/
- Privacy policy: https://mankarsandesh.github.io/shortlist/privacy
- Demo video: https://www.youtube.com/watch?v=hkJwDPavl0E

## What it does

- One-click "Save to Shortlist" button on LinkedIn profiles
- Pipeline stages (Sourced → Contacted → Replied → Interview → Placed / Archived)
- Follow-up dates, a toolbar badge count and a daily reminder notification
- Notes and tags, with search across everything
- Message templates with `{firstName}`, `{company}` and other variables, plus "Copy & mark contacted"
- CSV export

Everything is free for everyone: no limits on contacts or templates, no account and no payments.

All data stays in `chrome.storage.local`. There is no server and no LinkedIn automation: the extension only reads the profile you are looking at, and only when you click.

## Try it locally (2 minutes)

1. Unzip, then open `chrome://extensions` and switch on **Developer mode**.
2. Click **Load unpacked** and choose the `shortlist` folder.
3. Open any `linkedin.com/in/...` profile and click **Save to Shortlist** in the bottom-right corner.
4. Click the toolbar icon to open the side panel.

## Publish to the Chrome Web Store

1. Pay the one-off $5 developer registration at https://chrome.google.com/webstore/devconsole.
2. Zip the **contents** of this folder, with `manifest.json` at the root. Don't right-click the folder and choose Compress: that puts everything inside a `shortlist/` folder, and the store rejects it. From inside this folder, run:

   ```sh
   zip -r -X ../shortlist-extension-1.0.0.zip manifest.json background.js content.js sidepanel.html sidepanel.css sidepanel.js lib icons -x '*.DS_Store'
   ```

   This leaves out `docs/` (the website), `.git`, `README.md` and `PRIVACY.md`, which the extension doesn't need. Bump `version` in `manifest.json` (and the zip name) for every new upload.
3. Prepare the listing:
   - five 1280×800 screenshots (profile button, pipeline, follow-ups, message, templates). For templates, use `screenshot-5-templates-free.png`; the original still mentions Pro.
   - a 440×280 promo tile
   - a privacy policy URL: https://mankarsandesh.github.io/shortlist/privacy
4. Fill in the permission justifications:
   - `storage`: saves contacts locally
   - `alarms` and `notifications`: follow-up reminders
   - `sidePanel`: the CRM UI
   - LinkedIn host access: reads the profile you choose to save
5. Under data disclosure, declare "personally identifiable information" and "website content", stored locally and not sold.

Review usually takes a few days.

## Important risks before you publish

- **LinkedIn's Terms.** LinkedIn prohibits scraping and automation, and it actively blocks extensions that bulk-extract data or automate messages. This build stays on the safer side: it only saves when the user clicks, reads only the open page, and never sends messages for the user. Don't add bulk-save, auto-messaging or auto-visiting features. Those features are what get extensions blocked and accounts restricted.
- **Brand.** Don't use LinkedIn's name or logo in your extension icon or as the leading word of your title. "…for LinkedIn" in the description is the usual practice. Check the name "Shortlist" is free in the Web Store and with your trademark search before launch.
- **GDPR.** Your users (recruiters) become data controllers for candidate data. Local-only storage keeps your own obligations small. If you add cloud sync, you'll need a DPA and a proper privacy policy.
- **Selectors.** LinkedIn changes its HTML often. Name extraction falls back to the page title, but check `extractProfile()` in `content.js` monthly.

## Ideas for v2

- Cloud sync and team sharing for agencies
- Push contacts to Bullhorn, Recruitee, Greenhouse, HubSpot or Notion
- AI-personalised first messages generated from the saved headline
- Kanban board view and weekly pipeline stats

## Files

```
manifest.json      MV3 manifest
background.js      service worker: reminders, badge, messaging
content.js         LinkedIn profile button (shadow DOM)
sidepanel.*        the CRM UI
lib/store.js       data layer and config (stages, default templates)
icons/             16/32/48/128 icons
docs/              website for GitHub Pages (home page and privacy policy)
```

## Website (GitHub Pages)

The site lives in `docs/` as plain HTML and CSS, with no build step. To publish it, open the repository's **Settings → Pages**, choose **Deploy from a branch**, then pick `main` and the `/docs` folder. GitHub serves `docs/privacy.html` at `/shortlist/privacy`.

If you change the privacy policy, update both `docs/privacy.html` and `PRIVACY.md`.
