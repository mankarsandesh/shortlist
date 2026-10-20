# Shortlist Privacy Policy

_Last updated: 20 October 2026_

The published version of this policy is at https://mankarsandesh.github.io/shortlist/privacy (source: `docs/privacy.html`). Keep the two in sync.

Shortlist is a Chrome extension that helps recruiters and freelancers keep track of people they find on LinkedIn. This policy explains what information the extension handles, where it's kept and what control you have. It also covers the Shortlist website.

## The short version

- Everything you save stays in your browser, on your computer. Shortlist has no servers, so we never receive your contacts, notes or templates.
- Shortlist reads a LinkedIn profile only when you click Save, and only the profile you're viewing.
- There are no analytics, ads or trackers in the extension or on the website.
- We never sell or share your data.
- If you buy Pro, ExtensionPay and Stripe handle the payment. We never see your card details.
- Uninstalling Shortlist deletes everything it stored.

## Information Shortlist stores

Shortlist stores the following, and only on your computer:

| Information | When it's stored |
|---|---|
| Profile details: name, headline, location, current company and LinkedIn profile address | When you click Save to Shortlist on a LinkedIn profile, or Save in the side panel |
| Your pipeline: each contact's stage, follow-up date, last-contacted date, tags and notes | When you add or change them |
| Message templates | When you save a template |
| Settings: your name (used for `{myName}`), default follow-up delay and reminder preference | When you change them in Settings |

If you save a profile that's already in your shortlist, Shortlist refreshes its details from the page but never overwrites anything you've edited yourself.

While the side panel is open, Shortlist checks the address of the tab you're viewing so it can show whether that LinkedIn profile is already saved. On a profile you haven't saved, it reads the name on the page to label the Save button. Nothing is stored unless you click Save.

## What Shortlist never collects

- Your LinkedIn password, login session or cookies
- Your LinkedIn messages, inbox, connections or feed
- Profiles you look at but don't save
- Your browsing history or activity on other websites. Shortlist only runs on linkedin.com and, for payments, extensionpay.com.
- Analytics, crash reports or advertising identifiers

Shortlist doesn't click, scroll, send messages or visit profiles on your behalf.

## Where your data is kept

Your contacts, notes, templates and settings are stored with Chrome's storage API (`chrome.storage.local`) inside your Chrome profile on your computer. They don't sync to other computers, and they're never uploaded to us. Shortlist doesn't have a server to send them to.

The only exception is your Pro licence, described under Payments and Pro.

## How information is used

Information is used only to provide Shortlist's features: showing your pipeline, filling in message templates, reminding you about follow-ups, showing the number of due follow-ups on the toolbar icon and, on Pro, exporting a CSV file. Reminder notifications are created on your computer and show the names of the contacts that are due.

We don't use your information for advertising, profiling, credit or lending decisions, or to train AI models.

Shortlist's use of information complies with the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use), including the Limited Use requirements.

## Payments and Pro

Shortlist sells Pro subscriptions through [ExtensionPay](https://extensionpay.com), which uses [Stripe](https://stripe.com/privacy) to process payments.

- Nothing is sent to ExtensionPay until you click Upgrade to Pro or Restore purchase. When you do, ExtensionPay creates a random licence key for your copy of Shortlist and opens its checkout or sign-in page.
- On that page you give ExtensionPay and Stripe your email address and payment details. They handle them under their own privacy policies. We never see your full card details.
- After that, Shortlist checks the licence key with extensionpay.com when Chrome starts and about once an hour, to see whether Pro is active. These checks send only the licence key, never your contacts, notes or templates.
- The licence key and your Pro status, which can include the email address you paid with, are saved in Chrome's synced storage. If you use Chrome sync, that lets Pro follow you to your other computers.
- As the seller, we can see paying customers' email addresses and subscription status in our ExtensionPay account. We use them only to provide support and manage subscriptions.

## Browser permissions

| Permission | Why Shortlist needs it |
|---|---|
| `storage` | Saves your contacts, templates and settings on your computer |
| `alarms` | Checks about once an hour whether any follow-ups are due |
| `notifications` | Shows your daily follow-up reminder. You can turn it off in Settings. |
| `sidePanel` | Shows Shortlist in Chrome's side panel |
| Access to linkedin.com | Adds the Save to Shortlist button to profiles and reads the profile you choose to save |
| Access to extensionpay.com | Confirms your purchase when you upgrade to Pro |

## Sharing and selling

We don't sell, rent or share your information with anyone. Information leaves your browser only when you choose to send it:

- when you copy a message and paste it into LinkedIn or anywhere else
- when you export a CSV file (Pro)
- when you buy or restore Pro through ExtensionPay, as described above

We would disclose the limited information we hold, such as a paying customer's email address, only if the law required us to.

## Keeping and deleting your data

Shortlist keeps your information until you delete it.

- **One contact:** open it in the side panel and click Delete contact. Notes and templates have their own Delete buttons.
- **Everything:** remove Shortlist from Chrome (open `chrome://extensions` and click Remove). Chrome deletes all data the extension stored, including the licence key.
- **Payment records:** ExtensionPay and Stripe keep these under their own policies and legal obligations. To cancel Pro or close your ExtensionPay account, contact us.

## Information about people you save

The profiles you save belong to real people. When you use Shortlist for recruiting or other business, you decide what to save and why, and under laws such as the UK and EU GDPR you're usually the data controller for that information.

Because it never leaves your computer, we can't see it or act on requests about it, but you can. Save only what you need for a role, delete candidates you no longer need, and honour requests from people who ask you to remove their details.

## Security

Your data is protected by Chrome and by your computer's own security. Anyone who can use your Chrome profile can open Shortlist and see your contacts, so lock your computer and don't share your Chrome profile.

Shortlist doesn't download or run code from the internet. All of its code is included in the extension package.

## The Shortlist website

The website is hosted on GitHub Pages. It doesn't use cookies, analytics or advertising, and its fonts and images are served from the site itself. GitHub may log visitors' IP addresses to keep its service secure, as described in the [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

The demo video is hosted on YouTube. It loads in YouTube's privacy-enhanced mode, and only after you press play. From then on, [Google's Privacy Policy](https://policies.google.com/privacy) applies.

## Children

Shortlist is a business tool and isn't intended for anyone under 16.

## Changes to this policy

If we change how Shortlist handles information, we'll update this page and the date at the top. If a change affects data you've already saved, we'll tell you in the extension before it takes effect.

## Contact

Questions about this policy or your data? Email [YOUR EMAIL].
