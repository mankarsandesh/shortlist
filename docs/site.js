/* Home page: product tour tabs and a click-to-load demo video. */
(function () {
  'use strict';
  document.documentElement.classList.add('has-js');

  // ---- Product tour: tabs over the store screenshots -------------------------
  const tablist = document.querySelector('.tour-tabs');
  if (tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const panelFor = (tab) => document.getElementById(tab.getAttribute('aria-controls'));

    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panelFor(t).hidden = !on;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      const panel = panelFor(tab);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        select(tabs[(to + tabs.length) % tabs.length], true);
      });
    });

    tablist.hidden = false;
    select(tabs[0]);
  }

  // ---- Demo video: nothing loads from YouTube until someone presses play ------
  const player = document.querySelector('.player');

  function play() {
    if (!player || player.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + player.dataset.video + '?autoplay=1&rel=0';
    frame.title = 'Shortlist demo video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    frame.focus({ preventScroll: true });
  }

  if (player) {
    player.querySelector('.player-start').addEventListener('click', (e) => {
      e.preventDefault();
      play();
    });
  }
  document.querySelectorAll('[data-play-demo]').forEach((link) => link.addEventListener('click', play));
})();
