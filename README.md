# Shortlist – Recruiter CRM for LinkedIn

A Chrome extension (Manifest V3) for recruiters and freelancers. It lets you save a LinkedIn profile in one click, move candidates through a pipeline, get follow-up reminders, and send messages from templates.

- Website: https://mankarsandesh.github.io/shortlist/
- Privacy policy: https://mankarsandesh.github.io/shortlist/privacy
- Demo video: https://www.youtube.com/watch?v=hkJwDPavl0E

## What it does

| Feature | Free | Pro |
|---|---|---|
| One-click "Save to Shortlist" button on LinkedIn profiles | ✓ | ✓ |
| Pipeline stages (Sourced → Contacted → Replied → Interview → Placed / Archived) | ✓ | ✓ |
| Follow-up dates, a toolbar badge count and a daily reminder notification | ✓ | ✓ |
| Notes and tags, with search across everything | ✓ | ✓ |
| Message templates with `{firstName}`, `{company}` and other variables, plus "Copy & mark contacted" | 3 | Unlimited |
| Saved contacts | 25 | Unlimited |
| CSV export | — | ✓ |

All data stays in `chrome.storage.local`. There is no server and no LinkedIn automation: the extension only reads the profile you are looking at, and only when you click.

## Try it locally (2 minutes)

1. Unzip, then open `chrome://extensions` and switch on **Developer mode**.
2. Click **Load unpacked** and choose the `shortlist` folder.
3. Open any `linkedin.com/in/...` profile and click **Save to Shortlist** in the bottom-right corner.
4. Click the toolbar icon to open the side panel.

To test Pro features without paying, set `DEV_FORCE_PRO = true` in `lib/store.js`. Set it back to `false` before publishing.

## Turn on payments (ExtensionPay + Stripe)

1. Sign up at https://extensionpay.com and register an extension. Use an ID such as `shortlist-recruiter-crm`.
2. Put that ID in `EXTPAY_ID` in `lib/store.js`.
3. Connect Stripe in the ExtensionPay dashboard and create the plan. Suggested pricing: **£9/month or £79/year**.
4. Reload the extension. "Upgrade to Pro" now opens ExtensionPay's checkout, and `onPaid` unlocks Pro immediately. "Restore purchase" handles reinstalls and new devices.

ExtensionPay takes 5% on top of Stripe's fees. If you later move to your own backend (for example Node, Postgres and Stripe webhooks), replace `refreshPaidStatus()` in `background.js`.

## Publish to the Chrome Web Store

1. Pay the one-off $5 developer registration at https://chrome.google.com/webstore/devconsole.
2. Zip the **contents** of this folder, with `manifest.json` at the root. Leave out `docs/` (the website), `README.md` and `PRIVACY.md`; the extension doesn't need them.
3. Prepare the listing:
   - five 1280×800 screenshots (pipeline, profile button, follow-ups, templates, upgrade)
   - a 440×280 promo tile
   - a privacy policy URL: https://mankarsandesh.github.io/shortlist/privacy
4. Fill in the permission justifications:
   - `storage`: saves contacts locally
   - `alarms` and `notifications`: follow-up reminders
   - `sidePanel`: the CRM UI
   - LinkedIn host access: reads the profile you choose to save
5. Under data disclosure, declare "personally identifiable information" and "website content", stored locally and not sold.

Review usually takes a few days.

## Important risks before you sell this

- **LinkedIn's Terms.** LinkedIn prohibits scraping and automation, and it actively blocks extensions that bulk-extract data or automate messages. This build stays on the safer side: it only saves when the user clicks, reads only the open page, and never sends messages for the user. Don't add bulk-save, auto-messaging or auto-visiting features. Those features are what get extensions blocked and accounts restricted.
- **Brand.** Don't use LinkedIn's name or logo in your extension icon or as the leading word of your title. "…for LinkedIn" in the description is the usual practice. Check the name "Shortlist" is free in the Web Store and with your trademark search before launch.
- **GDPR.** Your users (recruiters) become data controllers for candidate data. Local-only storage keeps your own obligations small. If you add cloud sync, you'll need a DPA and a proper privacy policy.
- **Selectors.** LinkedIn changes its HTML often. Name extraction falls back to the page title, but check `extractProfile()` in `content.js` monthly.

## Ideas for v2 (things people will pay more for)

- Cloud sync and a team plan, priced per seat; this is the real revenue lever for agencies
- Push contacts to Bullhorn, Recruitee, Greenhouse, HubSpot or Notion
- AI-personalised first messages generated from the saved headline (Pro)
- Kanban board view and weekly pipeline stats

## Files

```
manifest.json      MV3 manifest
background.js      service worker: payments, reminders, badge, messaging
content.js         LinkedIn profile button (shadow DOM)
sidepanel.*        the CRM UI
lib/store.js       data layer and config (EXTPAY_ID, limits, DEV_FORCE_PRO)
lib/ExtPay.js      ExtensionPay library (MIT)
icons/             16/32/48/128 icons
docs/              website for GitHub Pages (home page and privacy policy)
```

## Website (GitHub Pages)

The site lives in `docs/` as plain HTML and CSS, with no build step. To publish it, open the repository's **Settings → Pages**, choose **Deploy from a branch**, then pick `main` and the `/docs` folder. GitHub serves `docs/privacy.html` at `/shortlist/privacy`.

If you change the privacy policy, update both `docs/privacy.html` and `PRIVACY.md`.
