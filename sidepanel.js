/* Side panel UI. All user/profile text goes through textContent (via h()) — never innerHTML. */
(function () {
  'use strict';
  const S = Store;

  const state = {
    tab: 'pipeline',
    stage: 'active',
    query: '',
    contacts: [],
    templates: [],
    settings: {},
    pro: false,
    openId: null,
    editingTpl: null
  };

  // ---- tiny DOM helper ------------------------------------------------------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k in el && k !== 'list') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const $ = (id) => document.getElementById(id);
  const stageLabel = (id) => (S.STAGES.find((s) => s.id === id) || {}).label || id;

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function relDay(iso) {
    if (!iso) return '';
    const today = S.todayISO();
    const diff = Math.round((new Date(iso) - new Date(today)) / 86400000);
    if (diff === 0) return 'Follow up today';
    if (diff === 1) return 'Follow up tomorrow';
    if (diff < 0) return 'Overdue ' + -diff + 'd';
    return 'Follow up in ' + diff + 'd';
  }

  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const fmtDateTime = (ts) =>
    new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  // ---- data -----------------------------------------------------------------
  async function load() {
    const [contacts, templates, settings, pro] = await Promise.all([
      S.listContacts(), S.getTemplates(), S.getSettings(), S.isPro()
    ]);
    Object.assign(state, { contacts, templates, settings, pro });
  }

  function matches(c) {
    const q = state.query.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.headline, c.company, c.location, (c.tags || []).join(' '), (c.notes || []).map((n) => n.text).join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(q);
  }

  // ---- render root ----------------------------------------------------------
  function render() {
    $('planBadge').textContent = state.pro ? 'Pro' : 'Free';
    $('planBadge').classList.toggle('pro', state.pro);
    const due = state.contacts.filter((c) => S.isDue(c)).length;
    $('dueCount').textContent = due ? String(due) : '';
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));

    const view = $('view');
    view.replaceChildren(
      state.tab === 'pipeline' ? renderPipeline() :
      state.tab === 'followups' ? renderFollowups() :
      state.tab === 'templates' ? renderTemplates() :
      renderSettings()
    );
    if (state.openId) renderDetail();
  }

  function card(c) {
    const today = S.todayISO();
    const closed = S.CLOSED_STAGES.includes(c.stage);
    return h('button', { class: 'card', onclick: () => openDetail(c.id) },
      h('div', { class: 'name' }, c.name),
      c.headline && h('div', { class: 'headline' }, c.headline),
      h('div', { class: 'meta' },
        h('span', { class: 'pill s-' + c.stage }, stageLabel(c.stage)),
        !closed && c.followUp && h('span', { class: 'due' + (c.followUp <= today ? ' over' : '') }, relDay(c.followUp)),
        (c.tags || []).slice(0, 3).map((t) => h('span', { class: 'tag' }, '#' + t))
      )
    );
  }

  function emptyState(title, body) {
    return h('div', { class: 'empty' }, h('h3', null, title), h('p', null, body));
  }

  // ---- Pipeline ---------------------------------------------------------------
  function renderPipeline() {
    const all = state.contacts.filter(matches);
    const counts = { active: all.filter((c) => c.stage !== 'archived').length };
    S.STAGES.forEach((s) => (counts[s.id] = all.filter((c) => c.stage === s.id).length));

    const chips = h('div', { class: 'chips' },
      [{ id: 'active', label: 'All active' }].concat(S.STAGES).map((s) =>
        h('button', {
          class: 'chip' + (state.stage === s.id ? ' on' : ''),
          onclick: () => { state.stage = s.id; render(); }
        }, s.label, h('b', null, counts[s.id] || 0))
      )
    );

    const shown = all.filter((c) => (state.stage === 'active' ? c.stage !== 'archived' : c.stage === state.stage));

    if (!state.contacts.length) {
      return h('div', null,
        emptyState('Your shortlist is empty',
          'Open any LinkedIn profile and click “Save to Shortlist” in the bottom-right corner. It lands here with a follow-up already set.'),
        h('div', { class: 'row', style: 'justify-content:center' },
          h('button', { class: 'btn primary', onclick: () => chrome.tabs.create({ url: 'https://www.linkedin.com/search/results/people/' }) }, 'Find people on LinkedIn'))
      );
    }
    return h('div', null, chips,
      shown.length ? h('div', { class: 'list' }, shown.map(card))
        : emptyState('Nothing here', state.query ? 'No contacts match your search.' : 'No contacts in this stage yet.'));
  }

  // ---- Follow-ups -------------------------------------------------------------
  function renderFollowups() {
    const today = S.todayISO();
    const weekOut = S.addDaysISO(7);
    const open = state.contacts.filter((c) => matches(c) && c.followUp && !S.CLOSED_STAGES.includes(c.stage))
      .sort((a, b) => a.followUp.localeCompare(b.followUp));

    const groups = [
      ['Overdue', open.filter((c) => c.followUp < today)],
      ['Today', open.filter((c) => c.followUp === today)],
      ['Next 7 days', open.filter((c) => c.followUp > today && c.followUp <= weekOut)],
      ['Later', open.filter((c) => c.followUp > weekOut)]
    ].filter(([, list]) => list.length);

    if (!groups.length) return emptyState('All caught up', 'No follow-ups scheduled. Set a date on any contact and it shows up here.');
    return h('div', null, groups.map(([title, list]) => [
      h('div', { class: 'group-title' }, title + ' · ' + list.length),
      h('div', { class: 'list' }, list.map(card))
    ]));
  }

  // ---- Templates --------------------------------------------------------------
  function renderTemplates() {
    const atLimit = !state.pro && state.templates.length >= S.FREE_TEMPLATE_LIMIT;
    const wrap = h('div', null,
      h('p', { class: 'vars' }, 'Use ', ['{firstName}', '{name}', '{company}', '{headline}', '{myName}'].map((v) => [h('code', null, v), ' ']),
        'and they fill in automatically for each contact.')
    );

    state.templates.forEach((t) => {
      if (state.editingTpl && state.editingTpl.id === t.id) return wrap.append(tplEditor(state.editingTpl));
      wrap.append(h('div', { class: 'tpl' },
        h('div', { class: 'row' }, h('b', null, t.name),
          h('div', { class: 'row' },
            h('button', { class: 'btn sm', onclick: () => { state.editingTpl = Object.assign({}, t); render(); } }, 'Edit'),
            h('button', { class: 'btn sm ghost danger', onclick: async () => {
              if (!confirm('Delete template “' + t.name + '”?')) return;
              await S.deleteTemplate(t.id); await load(); render();
            } }, 'Delete'))),
        h('div', { class: 'preview' }, t.body)));
    });

    if (state.editingTpl && !state.editingTpl.id) wrap.append(tplEditor(state.editingTpl));
    else wrap.append(
      atLimit
        ? upsell('Free plan includes ' + S.FREE_TEMPLATE_LIMIT + ' templates.')
        : h('button', { class: 'btn primary', onclick: () => { state.editingTpl = { name: '', body: '' }; render(); } }, '+ New template')
    );
    return wrap;
  }

  function tplEditor(t) {
    const name = h('input', { type: 'text', value: t.name, placeholder: 'e.g. Senior engineer outreach' });
    const body = h('textarea', { value: t.body, rows: 7, placeholder: 'Hi {firstName}, …' });
    return h('div', { class: 'tpl' },
      h('div', { class: 'field' }, h('label', null, 'Name'), name),
      h('div', { class: 'field' }, h('label', null, 'Message'), body),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onclick: async () => {
          if (!name.value.trim() || !body.value.trim()) return toast('Add a name and a message');
          const res = await S.saveTemplate({ id: t.id, name: name.value.trim(), body: body.value });
          if (!res.ok) return toast('Template limit reached — upgrade to add more');
          state.editingTpl = null; await load(); render(); toast('Template saved');
        } }, 'Save'),
        h('button', { class: 'btn ghost', onclick: () => { state.editingTpl = null; render(); } }, 'Cancel'))
    );
  }

  // ---- Settings ---------------------------------------------------------------
  function upsell(lead) {
    return h('div', { class: 'upsell' },
      h('h3', null, 'Go unlimited with Pro'),
      h('div', null, lead),
      h('ul', null,
        h('li', null, 'Unlimited saved contacts'),
        h('li', null, 'Unlimited message templates'),
        h('li', null, 'CSV export for your ATS or spreadsheet')),
      h('button', { class: 'btn primary', onclick: () => chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' }) }, 'Upgrade to Pro'));
  }

  function renderSettings() {
    const s = state.settings;
    const used = state.contacts.length;
    const myName = h('input', { type: 'text', value: s.myName, placeholder: 'Used for {myName} in templates' });
    const days = h('select', null, [1, 2, 3, 5, 7, 14].map((d) => h('option', { value: d, selected: s.defaultFollowUpDays === d }, d + (d === 1 ? ' day' : ' days'))));
    const notify = h('input', { type: 'checkbox', checked: s.notify });

    const save = async () => {
      state.settings = await S.saveSettings({ myName: myName.value.trim(), defaultFollowUpDays: Number(days.value), notify: notify.checked });
      toast('Settings saved');
    };
    [myName, days, notify].forEach((el) => el.addEventListener('change', save));

    return h('div', null,
      h('div', { class: 'panel' },
        h('h4', null, 'Plan'),
        state.pro
          ? h('div', null, h('b', null, 'Pro'), ' — unlimited everything. Thanks for supporting Shortlist.')
          : h('div', null,
              h('div', { class: 'row', style: 'justify-content:space-between' }, h('span', null, 'Contacts used'), h('b', null, used + ' / ' + S.FREE_CONTACT_LIMIT)),
              h('div', { class: 'meter' }, h('i', { style: 'width:' + Math.min(100, (used / S.FREE_CONTACT_LIMIT) * 100) + '%' })),
              upsell('You’re on the free plan.'),
              h('div', { class: 'row', style: 'margin-top:8px' },
                h('button', { class: 'btn ghost sm', onclick: () => chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' }) }, 'Already paid? Restore purchase'),
                h('button', { class: 'btn ghost sm', onclick: async () => {
                  const r = await chrome.runtime.sendMessage({ type: 'REFRESH_PRO' });
                  await load(); render(); toast(r && r.pro ? 'Pro is active' : 'Still on the free plan');
                } }, 'Refresh status')))
      ),
      h('div', { class: 'panel' },
        h('h4', null, 'Preferences'),
        h('div', { class: 'field' }, h('label', null, 'Your name'), myName),
        h('div', { class: 'field' }, h('label', null, 'Follow-up after first contact'), days),
        h('label', { class: 'check' }, notify, 'Daily reminder when follow-ups are due')
      ),
      h('div', { class: 'panel' },
        h('h4', null, 'Data'),
        h('p', { class: 'vars', style: 'margin-top:0' }, 'Everything is stored locally in your browser. Nothing is sent to a server.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: exportCSV }, 'Export CSV' + (state.pro ? '' : ' (Pro)')))
      )
    );
  }

  function exportCSV() {
    if (!state.pro) return chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
    const blob = new Blob([S.toCSV(state.contacts)], { type: 'text/csv' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'shortlist-' + S.todayISO() + '.csv' });
    document.body.append(a); a.click(); a.remove();
    toast('Exported ' + state.contacts.length + ' contacts');
  }

  // ---- Contact detail -----------------------------------------------------------
  function openDetail(id) {
    state.openId = id;
    renderDetail();
  }
  function closeDetail() {
    state.openId = null;
    $('detail').hidden = true;
    document.body.classList.remove('detail-open');
    render();
  }

  async function patch(fields, msg) {
    await S.updateContact(state.openId, fields);
    await load();
    render();
    if (msg) toast(msg);
  }

  function renderDetail() {
    const c = state.contacts.find((x) => x.id === state.openId);
    const el = $('detail');
    if (!c) return closeDetail();
    const firstOpen = el.hidden;
    el.hidden = false;
    document.body.classList.add('detail-open');
    if (firstOpen) window.scrollTo(0, 0);

    const headline = h('input', { type: 'text', value: c.headline, onchange: (e) => patch({ headline: e.target.value, _edited_headline: true }) });
    const company = h('input', { type: 'text', value: c.company, placeholder: 'Company', onchange: (e) => patch({ company: e.target.value, _edited_company: true }) });
    const tags = h('input', { type: 'text', value: (c.tags || []).join(', '), placeholder: 'e.g. react, london, senior',
      onchange: (e) => patch({ tags: e.target.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean) }, 'Tags saved') });
    const followUp = h('input', { type: 'date', value: c.followUp || '', onchange: (e) => patch({ followUp: e.target.value || null }, 'Follow-up updated') });

    const noteBox = h('textarea', { rows: 3, placeholder: 'Call notes, salary expectations, notice period…' });
    const tplSelect = h('select', null, state.templates.map((t) => h('option', { value: t.id }, t.name)));
    const preview = h('div', { class: 'preview' });
    const updatePreview = () => {
      const t = state.templates.find((x) => x.id === tplSelect.value);
      preview.textContent = t ? S.fillTemplate(t.body, c, state.settings) : 'Create a template in the Templates tab.';
    };
    tplSelect.addEventListener('change', updatePreview);
    updatePreview();

    el.replaceChildren(
      h('button', { class: 'btn ghost back', onclick: closeDetail }, '← Back'),
      h('h2', null, c.name),
      h('p', { class: 'sub' }, [c.location, 'Saved ' + fmtDate(c.createdAt)].filter(Boolean).join(' · ')),
      h('div', { class: 'row', style: 'margin-top:10px' },
        h('button', { class: 'btn', onclick: () => chrome.tabs.create({ url: c.url }) }, 'Open LinkedIn profile')),

      h('div', { class: 'panel' },
        h('h4', null, 'Stage'),
        h('div', { class: 'stages' }, S.STAGES.map((s) =>
          h('button', { class: c.stage === s.id ? 'on' : '', onclick: () => {
            const fields = { stage: s.id };
            if (S.CLOSED_STAGES.includes(s.id)) fields.followUp = null;
            patch(fields, 'Moved to ' + s.label);
          } }, s.label)))
      ),

      h('div', { class: 'panel' },
        h('h4', null, 'Follow-up'),
        h('div', { class: 'field' }, followUp),
        h('div', { class: 'row' },
          [['Tomorrow', 1], ['+3 days', 3], ['+1 week', 7], ['+2 weeks', 14]].map(([l, d]) =>
            h('button', { class: 'btn sm', onclick: () => patch({ followUp: S.addDaysISO(d) }, 'Follow-up set') }, l)),
          c.followUp && h('button', { class: 'btn sm ghost', onclick: () => patch({ followUp: null }, 'Follow-up cleared') }, 'Clear'))
      ),

      h('div', { class: 'panel' },
        h('h4', null, 'Message'),
        h('div', { class: 'field' }, tplSelect),
        preview,
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: async () => {
            await navigator.clipboard.writeText(preview.textContent);
            const fields = { lastContacted: Date.now(), followUp: S.addDaysISO(state.settings.defaultFollowUpDays || 3) };
            if (c.stage === 'sourced') fields.stage = 'contacted';
            await patch(fields, 'Copied — paste it into LinkedIn');
          } }, 'Copy & mark contacted'),
          h('button', { class: 'btn', onclick: async () => {
            await navigator.clipboard.writeText(preview.textContent); toast('Copied');
          } }, 'Copy only')),
        c.lastContacted && h('p', { class: 'vars', style: 'margin:8px 0 0' }, 'Last contacted ' + fmtDateTime(c.lastContacted))
      ),

      h('div', { class: 'panel' },
        h('h4', null, 'Notes'),
        noteBox,
        h('div', { class: 'row', style: 'margin-top:8px' },
          h('button', { class: 'btn', onclick: async () => {
            if (!noteBox.value.trim()) return;
            await S.addNote(c.id, noteBox.value); await load(); render(); toast('Note added');
          } }, 'Add note')),
        (c.notes || []).map((n) => h('div', { class: 'note' },
          h('time', null, fmtDateTime(n.at),
            h('button', { class: 'btn sm ghost danger', onclick: async () => { await S.deleteNote(c.id, n.id); await load(); render(); } }, 'Delete')),
          h('p', null, n.text)))
      ),

      h('div', { class: 'panel' },
        h('h4', null, 'Details'),
        h('div', { class: 'field' }, h('label', null, 'Headline'), headline),
        h('div', { class: 'field' }, h('label', null, 'Company'), company),
        h('div', { class: 'field' }, h('label', null, 'Tags (comma separated)'), tags)
      ),

      h('div', { class: 'row', style: 'margin-top:16px' },
        h('button', { class: 'btn ghost danger', onclick: async () => {
          if (!confirm('Delete ' + c.name + ' from your shortlist?')) return;
          await S.deleteContact(c.id); state.openId = null; $('detail').hidden = true; document.body.classList.remove('detail-open'); await load(); render(); toast('Contact deleted');
        } }, 'Delete contact'))
    );
  }

  // ---- Banner for the LinkedIn profile in the active tab -------------------------
  async function refreshBanner() {
    const banner = $('pageBanner');
    let tab;
    try { [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); } catch (e) { /* ignore */ }
    const url = tab && tab.url && S.normaliseProfileUrl(tab.url);
    if (!url) { banner.hidden = true; return; }

    const existing = await S.findByUrl(url);
    if (existing) {
      banner.replaceChildren(
        h('div', { class: 'who' }, h('b', null, existing.name), h('span', null, 'On this page · ' + stageLabel(existing.stage))),
        h('button', { class: 'btn sm', onclick: () => openDetail(existing.id) }, 'Open'));
      banner.hidden = false;
      return;
    }

    let profile = null;
    try { ({ profile } = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT' })); } catch (e) { /* content script not ready */ }
    banner.replaceChildren(
      h('div', { class: 'who' }, h('b', null, (profile && profile.name) || 'LinkedIn profile'), h('span', null, 'Not in your shortlist yet')),
      h('button', { class: 'btn sm primary', onclick: async () => {
        const res = await chrome.runtime.sendMessage({ type: 'SAVE_PROFILE', profile: profile || { url } });
        if (res && res.ok) { await load(); render(); refreshBanner(); openDetail(res.contact.id); toast('Saved'); }
        else if (res && res.reason === 'limit') { toast('Free limit reached'); state.tab = 'settings'; render(); }
      } }, 'Save'));
    banner.hidden = false;
  }

  // ---- wiring ---------------------------------------------------------------------
  document.querySelectorAll('.tabs button').forEach((b) =>
    b.addEventListener('click', () => { state.tab = b.dataset.tab; state.editingTpl = null; if (state.openId) closeDetail(); else render(); }));
  $('search').addEventListener('input', (e) => { state.query = e.target.value; render(); });

  chrome.storage.onChanged.addListener(async (changes) => {
    if (changes.contacts || changes.templates || changes.pro || changes.settings) {
      // Don't re-render while the user is typing in a field.
      const active = document.activeElement;
      if (active && /INPUT|TEXTAREA/.test(active.tagName) && active.id !== 'search') return;
      await load(); render(); refreshBanner();
    }
  });
  if (chrome.tabs && chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(refreshBanner);
    chrome.tabs.onUpdated.addListener((_id, info) => { if (info.status === 'complete' || info.url) setTimeout(refreshBanner, 700); });
  }

  load().then(() => { render(); refreshBanner(); });
})();
