/* Shared data layer. Loaded by the service worker (importScripts) and the side panel (<script>). */
(function (root) {
  'use strict';

  // ---- Configuration ----------------------------------------------------
  const STAGES = [
    { id: 'sourced', label: 'Sourced' },
    { id: 'contacted', label: 'Contacted' },
    { id: 'replied', label: 'Replied' },
    { id: 'interview', label: 'Interview' },
    { id: 'placed', label: 'Placed' },
    { id: 'archived', label: 'Archived' }
  ];
  const CLOSED_STAGES = ['placed', 'archived'];

  const DEFAULT_TEMPLATES = [
    {
      id: 'tpl_intro',
      name: 'First outreach',
      body:
        "Hi {firstName}, I came across your profile and your work at {company} stood out. " +
        "I'm working on a role that looks like a strong fit for your background. " +
        "Open to a quick chat this week?\n\nThanks,\n{myName}"
    },
    {
      id: 'tpl_followup',
      name: 'Gentle follow-up',
      body:
        "Hi {firstName}, just bumping this in case it got buried. " +
        "Happy to share details by message first if that's easier.\n\n{myName}"
    },
    {
      id: 'tpl_interview',
      name: 'Interview next steps',
      body:
        "Thanks for your time today, {firstName}. I'll share feedback from the team by the end of the week. " +
        "Any questions in the meantime, just reply here.\n\n{myName}"
    }
  ];

  // ---- Helpers ----------------------------------------------------------
  const area = () => chrome.storage.local;
  const get = (keys) => area().get(keys);
  const set = (obj) => area().set(obj);

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function todayISO(d = new Date()) {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 10);
  }

  function addDaysISO(days, from = new Date()) {
    const d = new Date(from);
    d.setDate(d.getDate() + days);
    return todayISO(d);
  }

  function normaliseProfileUrl(url) {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/^\/in\/([^/]+)/i);
      if (!m) return null;
      return 'https://www.linkedin.com/in/' + decodeURIComponent(m[1]).toLowerCase() + '/';
    } catch (e) {
      return null;
    }
  }

  function firstName(name) {
    return (name || '').trim().split(/\s+/)[0] || 'there';
  }

  function fillTemplate(body, contact, settings) {
    const vars = {
      firstName: firstName(contact.name),
      name: contact.name || '',
      company: contact.company || 'your company',
      headline: contact.headline || '',
      location: contact.location || '',
      myName: (settings && settings.myName) || ''
    };
    return body.replace(/\{(\w+)\}/g, (all, k) => (k in vars ? vars[k] : all)).trim();
  }

  function isDue(c, today = todayISO()) {
    return !!c.followUp && c.followUp <= today && !CLOSED_STAGES.includes(c.stage);
  }

  // ---- Contacts ---------------------------------------------------------
  async function getContacts() {
    const { contacts = {} } = await get('contacts');
    return contacts;
  }

  async function listContacts() {
    const all = await getContacts();
    return Object.values(all).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  async function findByUrl(url) {
    const key = normaliseProfileUrl(url);
    if (!key) return null;
    const all = await getContacts();
    return Object.values(all).find((c) => c.url === key) || null;
  }

  /** Create or refresh a contact from captured profile data. */
  async function upsertFromProfile(profile) {
    const url = normaliseProfileUrl(profile.url);
    if (!url) return { ok: false, reason: 'not_profile' };
    const all = await getContacts();
    const existing = Object.values(all).find((c) => c.url === url);
    const now = Date.now();

    if (existing) {
      // Refresh scraped fields but never overwrite user edits with blanks.
      ['name', 'headline', 'location', 'company'].forEach((k) => {
        if (profile[k] && !existing['_edited_' + k]) existing[k] = profile[k];
      });
      existing.updatedAt = now;
      all[existing.id] = existing;
      await set({ contacts: all });
      return { ok: true, contact: existing, existed: true };
    }

    const contact = {
      id: uid('c'),
      url,
      name: profile.name || 'Unknown',
      headline: profile.headline || '',
      location: profile.location || '',
      company: profile.company || '',
      stage: 'sourced',
      tags: [],
      notes: [],
      followUp: addDaysISO(2),
      lastContacted: null,
      createdAt: now,
      updatedAt: now
    };
    all[contact.id] = contact;
    await set({ contacts: all });
    return { ok: true, contact, existed: false };
  }

  async function updateContact(id, patch) {
    const all = await getContacts();
    if (!all[id]) return null;
    all[id] = Object.assign({}, all[id], patch, { updatedAt: Date.now() });
    await set({ contacts: all });
    return all[id];
  }

  async function deleteContact(id) {
    const all = await getContacts();
    delete all[id];
    await set({ contacts: all });
  }

  async function addNote(id, text) {
    const all = await getContacts();
    const c = all[id];
    if (!c || !text.trim()) return c;
    c.notes = [{ id: uid('n'), text: text.trim(), at: Date.now() }].concat(c.notes || []);
    c.updatedAt = Date.now();
    await set({ contacts: all });
    return c;
  }

  async function deleteNote(id, noteId) {
    const all = await getContacts();
    const c = all[id];
    if (!c) return c;
    c.notes = (c.notes || []).filter((n) => n.id !== noteId);
    await set({ contacts: all });
    return c;
  }

  // ---- Templates --------------------------------------------------------
  async function getTemplates() {
    const { templates } = await get('templates');
    return Array.isArray(templates) ? templates : DEFAULT_TEMPLATES.slice();
  }

  async function saveTemplate(tpl) {
    const list = await getTemplates();
    const i = list.findIndex((t) => t.id === tpl.id);
    if (i >= 0) {
      list[i] = tpl;
    } else {
      tpl.id = tpl.id || uid('tpl');
      list.push(tpl);
    }
    await set({ templates: list });
    return { ok: true, template: tpl };
  }

  async function deleteTemplate(id) {
    const list = (await getTemplates()).filter((t) => t.id !== id);
    await set({ templates: list });
  }

  // ---- Settings ---------------------------------------------------------
  async function getSettings() {
    const { settings = {} } = await get('settings');
    return Object.assign({ myName: '', defaultFollowUpDays: 3, notify: true }, settings);
  }

  async function saveSettings(patch) {
    const s = Object.assign(await getSettings(), patch);
    await set({ settings: s });
    return s;
  }

  // ---- Export -----------------------------------------------------------
  function toCSV(contacts) {
    const cols = ['name', 'headline', 'company', 'location', 'stage', 'followUp', 'lastContacted', 'tags', 'notes', 'url'];
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = contacts.map((c) =>
      cols
        .map((k) => {
          if (k === 'tags') return esc((c.tags || []).join('; '));
          if (k === 'notes') return esc((c.notes || []).map((n) => n.text).join(' | '));
          if (k === 'lastContacted') return esc(c.lastContacted ? todayISO(new Date(c.lastContacted)) : '');
          return esc(c[k]);
        })
        .join(',')
    );
    return [cols.join(',')].concat(rows).join('\n');
  }

  root.Store = {
    STAGES, CLOSED_STAGES, DEFAULT_TEMPLATES,
    uid, todayISO, addDaysISO, normaliseProfileUrl, firstName, fillTemplate, isDue,
    getContacts, listContacts, findByUrl, upsertFromProfile, updateContact, deleteContact, addNote, deleteNote,
    getTemplates, saveTemplate, deleteTemplate, getSettings, saveSettings, toCSV
  };
})(typeof self !== 'undefined' ? self : window);
