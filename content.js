/* Runs on linkedin.com. Adds a "Save to Shortlist" button on profile pages.
 * Only reads the profile the user is looking at, and only when they click. No automation. */
(function () {
  'use strict';
  if (window.__shortlistLoaded) return;
  window.__shortlistLoaded = true;

  const isProfile = () => /^\/in\/[^/]+\/?/i.test(location.pathname);

  const text = (el) => (el && el.innerText ? el.innerText.replace(/\s+/g, ' ').trim() : '');

  function extractProfile() {
    const main = document.querySelector('main') || document;
    const h1 = main.querySelector('h1');
    let name = text(h1);
    if (!name) name = (document.title || '').split('|')[0].replace(/^\(\d+\)\s*/, '').trim();

    // The headline usually sits right under the name.
    const top = h1 ? h1.closest('section') || h1.parentElement.parentElement : main;
    const headline = text(top && top.querySelector('.text-body-medium'));
    const loc = text(top && top.querySelector('span.text-body-small.inline'));

    // Current company: LinkedIn exposes it via an aria-label on the top card.
    let company = '';
    const companyBtn = main.querySelector('button[aria-label^="Current company"], a[aria-label^="Current company"]');
    if (companyBtn) {
      company = (companyBtn.getAttribute('aria-label') || '')
        .replace(/^Current company:\s*/i, '')
        .replace(/\.\s*Click.*$/i, '')
        .trim();
    }
    if (!company && headline) {
      const m = headline.match(/\b(?:at|@)\s+(.+?)(?:\s*[|·,]|$)/i);
      if (m) company = m[1].trim();
    }

    return { url: location_href(), name, headline, location: loc, company };
  }

  function location_href() {
    return location.href.split('?')[0];
  }

  // ---- UI (shadow DOM so LinkedIn's CSS can't touch it) --------------------
  let host, btn, sub;

  function mount() {
    if (host) return;
    host = document.createElement('div');
    host.id = 'shortlist-root';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .wrap { position: fixed; right: 20px; bottom: 84px; z-index: 2147483000;
          font: 500 13px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
        button { all: unset; cursor: pointer; display: flex; align-items: center; gap: 8px;
          background: #14532D; color: #fff; padding: 10px 14px 10px 12px; border-radius: 999px;
          box-shadow: 0 6px 20px rgba(0,0,0,.18); transition: transform .12s ease, background .12s ease; }
        button:hover { transform: translateY(-1px); background: #166534; }
        button.saved { background: #fff; color: #14532D; box-shadow: 0 0 0 1px #BBF7D0, 0 6px 20px rgba(0,0,0,.12); }
        button.limit { background: #9A3412; }
        .dot { width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.18);
          display: grid; place-items: center; font-size: 12px; }
        button.saved .dot { background: #DCFCE7; }
        .sub { display: block; font-weight: 400; font-size: 11px; opacity: .75; margin-top: 2px; }
      </style>
      <div class="wrap"><button type="button"><span class="dot">+</span><span><span class="label">Save to Shortlist</span><span class="sub"></span></span></button></div>`;
    btn = shadow.querySelector('button');
    sub = shadow.querySelector('.sub');
    btn.addEventListener('click', onClick);
    document.documentElement.appendChild(host);
  }

  function unmount() {
    if (host) host.remove();
    host = btn = sub = null;
  }

  function setState(state, detail) {
    if (!btn) return;
    btn.classList.toggle('saved', state === 'saved');
    btn.classList.toggle('limit', state === 'limit');
    const label = btn.querySelector('.label');
    const dot = btn.querySelector('.dot');
    if (state === 'saved') {
      dot.textContent = '✓';
      label.textContent = 'In Shortlist';
      sub.textContent = detail || 'Click to open';
    } else if (state === 'limit') {
      dot.textContent = '!';
      label.textContent = 'Free limit reached';
      sub.textContent = 'Upgrade for unlimited';
    } else {
      dot.textContent = '+';
      label.textContent = 'Save to Shortlist';
      sub.textContent = '';
    }
    btn.dataset.state = state;
  }

  const send = (msg) =>
    new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (r) => resolve(r || {}));
      } catch (e) {
        resolve({}); // extension reloaded; page needs a refresh
      }
    });

  const STAGE_LABELS = { sourced: 'Sourced', contacted: 'Contacted', replied: 'Replied', interview: 'Interview', placed: 'Placed', archived: 'Archived' };

  async function refresh() {
    if (!isProfile()) return unmount();
    mount();
    const { contact } = await send({ type: 'GET_BY_URL', url: location_href() });
    if (contact) setState('saved', STAGE_LABELS[contact.stage] + ' · click to open');
    else setState('idle');
  }

  async function onClick() {
    const state = btn.dataset.state;
    if (state === 'saved') return send({ type: 'OPEN_PANEL' });
    if (state === 'limit') return send({ type: 'OPEN_PAYMENT' });

    const res = await send({ type: 'SAVE_PROFILE', profile: extractProfile() });
    if (res.ok) {
      setState('saved', 'Saved · follow-up in 2 days');
      send({ type: 'OPEN_PANEL' });
    } else if (res.reason === 'limit') {
      setState('limit');
    }
  }

  // Side panel asks for the current page's details.
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg && msg.type === 'EXTRACT') {
      reply(isProfile() ? { profile: extractProfile() } : { profile: null });
    }
  });

  // LinkedIn is a single-page app: watch for URL changes.
  let last = '';
  setInterval(() => {
    const now = location_href();
    if (now !== last) {
      last = now;
      setTimeout(refresh, 600); // let the new profile render
    }
  }, 700);

  // Keep the button in sync when the panel changes data.
  chrome.storage.onChanged.addListener((c) => {
    if (c.contacts && isProfile()) refresh();
  });
})();
