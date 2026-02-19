(() => {
  // ─── Centralized selector config ─────────────────────────────────────────
  // All YouTube selectors live here. Update in one place if YouTube changes.
  const SELECTORS = {
    // Shelf/section containers that ARE Shorts
    shelfRenderers: 'ytd-reel-shelf-renderer',

    // Feed item containers that link to a Short
    feedContainers: [
      'ytd-grid-video-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-rich-item-renderer',
    ].join(', '),

    // Any anchor pointing to a Short
    shortsAnchors: 'a[href^="/shorts/"]',

    // "Shorts" tab on channel pages
    shortsTab: [
      'yt-tab-shape[tab-title="Shorts"]',
      'tp-yt-paper-tab:has([tab-title="Shorts"])',
    ].join(', '),

    // "Shorts" filter chip in search results
    filterChip: 'yt-chip-cloud-chip-renderer',

    // Sidebar / mini-guide nav entries
    navEntry: 'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer',

    // Search result videos
    searchVideoRenderer: 'ytd-video-renderer',
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const throttle = (fn, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  };

  // ─── Core actions ─────────────────────────────────────────────────────────
  const redirectShorts = () => {
    if (!location.pathname.startsWith('/shorts/')) return;
    const id = location.pathname.split('/')[2];
    if (!id) return;

    chrome.storage.local.get(['redirectCount'], (data) => {
      const newCount = (data.redirectCount || 0) + 1;
      chrome.storage.local.set({ redirectCount: newCount }, () => {
        window.location.replace(`https://www.youtube.com/watch?v=${id}`);
      });
    });
  };

  const removeShortsShelves = () => {
    // Hide Shorts shelf sections — use tag selector, NOT text matching
    document.querySelectorAll(SELECTORS.shelfRenderers).forEach(el => {
      el.style.display = 'none';
    });

    // Hide individual Short cards in feeds by walking up from the anchor
    document.querySelectorAll(SELECTORS.shortsAnchors).forEach(a => {
      const container = a.closest(SELECTORS.feedContainers);
      if (container) container.style.display = 'none';
    });

    // Hide Shorts tab on channel pages
    document.querySelectorAll(SELECTORS.shortsTab).forEach(el => {
      el.style.display = 'none';
    });

    // Hide "Shorts" filter chip in search results
    document.querySelectorAll(SELECTORS.filterChip).forEach(chip => {
      const label = chip.querySelector('yt-formatted-string');
      if (label && label.textContent.trim().toLowerCase() === 'shorts') {
        chip.style.display = 'none';
      }
    });

    // Hide search result cards that are Shorts (via badge text)
    document.querySelectorAll(SELECTORS.searchVideoRenderer).forEach(video => {
      video.querySelectorAll('ytd-badge-supported-renderer .badge').forEach(badge => {
        if (badge.textContent.trim().toLowerCase() === 'short') {
          video.style.display = 'none';
        }
      });
    });
  };

  const removeShortsNav = () => {
    // Hide Shorts from sidebar navigation
    document.querySelectorAll('a[title="Shorts"], a[href="/shorts"]').forEach(el => {
      const container = el.closest(SELECTORS.navEntry);
      if (container) container.style.display = 'none';
    });

    // Hide Shorts button in compact/mobile views
    document.querySelectorAll('[aria-label*="Shorts"]').forEach(el => {
      if (el.getAttribute('href') === '/shorts') el.style.display = 'none';
    });
  };

  // ─── CSS — hides known static selectors instantly on page load ────────────
  // Note: We do NOT hide `a[href^="/shorts/"]` directly here because that only
  // hides the anchor while leaving the parent card layout broken. The JS above
  // correctly hides the parent container instead.
  const injectCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
      ytd-reel-shelf-renderer,
      [tab-title="Shorts"],
      ytd-guide-entry-renderer:has(a[href="/shorts"]),
      ytd-mini-guide-entry-renderer:has(a[href="/shorts"]),
      yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]) {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  };

  // ─── Run everything ───────────────────────────────────────────────────────
  const runAll = () => {
    removeShortsShelves();
    removeShortsNav();
  };

  // Check if the extension is enabled before doing anything
  chrome.storage.local.get(['enabled'], (data) => {
    // Default to enabled if key has never been set
    const isEnabled = data.enabled !== false;
    if (!isEnabled) return;

    injectCSS();
    redirectShorts();

    // Let YouTube's initial render settle before the first sweep
    setTimeout(runAll, 500);

    // ─── SPA navigation tracking ─────────────────────────────────────────
    let lastUrl = location.href;
    const checkUrlChange = () => {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      redirectShorts();
      // Give the new page a moment to render
      setTimeout(runAll, 300);
    };

    // ─── MutationObserver (throttled) ────────────────────────────────────
    const throttledRun = throttle(runAll, 1000);

    const observer = new MutationObserver((mutations) => {
      checkUrlChange();
      const hasNewNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasNewNodes) throttledRun();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
})();