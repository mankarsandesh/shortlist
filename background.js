/* Service worker: payments, follow-up reminders, badge, and messages from the LinkedIn page. */
importScripts('lib/ExtPay.js', 'lib/store.js');

const extpay = ExtPay(Store.EXTPAY_ID);
extpay.startBackground();

async function refreshPaidStatus() {
  try {
    const user = await extpay.getUser();
    await chrome.storage.local.set({ pro: !!user.paid });
  } catch (e) {
    // Offline or ExtensionPay not configured yet: keep the last known value.
  }
}

extpay.onPaid.addListener(async () => {
  await chrome.storage.local.set({ pro: true });
  chrome.notifications.create('pro', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Shortlist Pro unlocked',
    message: 'Unlimited contacts, templates and CSV export are now on. Thank you!'
  });
});

chrome.runtime.onInstalled.addListener(async (details) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  chrome.alarms.create('followups', { periodInMinutes: 60, delayInMinutes: 1 });
  if (details.reason === 'install') {
    const { templates } = await chrome.storage.local.get('templates');
    if (!templates) await chrome.storage.local.set({ templates: Store.DEFAULT_TEMPLATES });
  }
  refreshPaidStatus();
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  refreshPaidStatus();
  updateBadge();
});

// ---- Follow-up reminders -------------------------------------------------
async function updateBadge() {
  const contacts = await Store.listContacts();
  const due = contacts.filter((c) => Store.isDue(c)).length;
  await chrome.action.setBadgeBackgroundColor({ color: '#C2410C' });
  await chrome.action.setBadgeText({ text: due ? String(due) : '' });
  return { due, contacts };
}

async function checkFollowUps() {
  const { due, contacts } = await updateBadge();
  const settings = await Store.getSettings();
  if (!due || !settings.notify) return;

  const today = Store.todayISO();
  const { lastNotified } = await chrome.storage.local.get('lastNotified');
  if (lastNotified === today) return; // one digest per day
  await chrome.storage.local.set({ lastNotified: today });

  const names = contacts.filter((c) => Store.isDue(c)).map((c) => c.name);
  chrome.notifications.create('followups-' + today, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: due === 1 ? '1 follow-up due today' : due + ' follow-ups due today',
    message: names.slice(0, 3).join(', ') + (names.length > 3 ? ' and ' + (names.length - 3) + ' more' : ''),
    priority: 1
  });
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === 'followups') {
    checkFollowUps();
    refreshPaidStatus();
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.contacts) updateBadge();
});

// ---- Messages ------------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  (async () => {
    switch (msg && msg.type) {
      case 'SAVE_PROFILE': {
        const res = await Store.upsertFromProfile(msg.profile);
        reply(res);
        break;
      }
      case 'GET_BY_URL': {
        reply({ contact: await Store.findByUrl(msg.url) });
        break;
      }
      case 'OPEN_PANEL': {
        try {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          reply({ ok: true });
        } catch (e) {
          reply({ ok: false });
        }
        break;
      }
      case 'OPEN_PAYMENT': {
        extpay.openPaymentPage();
        reply({ ok: true });
        break;
      }
      case 'OPEN_LOGIN': {
        extpay.openLoginPage();
        reply({ ok: true });
        break;
      }
      case 'REFRESH_PRO': {
        await refreshPaidStatus();
        reply({ pro: await Store.isPro() });
        break;
      }
      default:
        reply({ ok: false, reason: 'unknown' });
    }
  })();
  return true; // async reply
});
