(() => {
  // ─── Config & State ──────────────────────────────────────────────────────
  let WHITELIST = [];
  let IS_ENABLED = true;

  // Selectors for elements we want to hide/modify
  const SELECTORS = {
    shelfRenderers: 'ytd-reel-shelf-renderer',
    feedContainers: [
      'ytd-grid-video-renderer',
      'ytd-video-renderer',
      'ytd-compact-video-renderer',
      'ytd-rich-item-renderer',
    ].join(', '),
    shortsAnchors: 'a[href^="/shorts/"]',
    shortsTab: [
      'yt-tab-shape[tab-title="Shorts"]',
      'tp-yt-paper-tab:has([tab-title="Shorts"])',
    ].join(', '),
    filterChip: 'yt-chip-cloud-chip-renderer',
    navEntry: 'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer',
    searchVideoRenderer: 'ytd-video-renderer',
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
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

  // Extract handle from a channel name element or string
  // Tries to find @handle, otherwise normalizes name
  const normalizeHandle = (text) => {
    if (!text) return '';
    return text.trim().replace(/^@/, '');
  };

  const isWhitelisted = (channelHandle) => {
    if (!channelHandle || WHITELIST.length === 0) return false;
    // Check if the handle (e.g. "mkbhd") is in the whitelist array
    return WHITELIST.includes(normalizeHandle(channelHandle));
  };

  // ─── Whitelist Checks ────────────────────────────────────────────────────

  // Check if a specific "Shorts Shelf" or container belongs to a whitelisted channel
  // This is tricky because shelves often don't have the channel name in a simple attribute.
  // We'll try to find it in the text content if possible, but honestly for Shelves
  // it's usually a collection of many channels.
  // DECISION: We do NOT whitelist shelves. They are mixed content.
  // We only whitelist individual Short videos in feeds or the Shorts player itself.

  // ─── Core Actions ────────────────────────────────────────────────────────

  const redirectShorts = () => {
    if (!location.pathname.startsWith('/shorts/')) return;

    // If whitelist is empty, we don't need to wait for channel name -> blocking redirect
    // (But we let the fast-path handle this if possible)
    if (WHITELIST.length === 0) {
      performRedirect();
      return;
    }

    // If whitelist has items, we MUST wait for the channel name to appear to check it.
    // This is the trade-off users make for using the whitelist.
    const checkAndRedirect = () => {
      // Try to find channel name in the Shorts player overlay
      // Selector for the channel name in the Shorts player
      const channelElement = document.querySelector('ytd-reel-video-renderer[is-active] ytd-channel-name yt-formatted-string a');
      // If not found yet, we might be loading.
      if (channelElement) {
        const handle = normalizeHandle(channelElement.href.split('/').pop()); // URL is /@handle usually
        // Also try text content just in case URL is weird
        const textHandle = normalizeHandle(channelElement.innerText);

        if (isWhitelisted(handle) || isWhitelisted(textHandle)) {
          // Whitelisted! Do nothing.
          console.log(`[No-Shorts] Whitelisted channel detected: ${handle || textHandle}`);
          return;
        } else {
          performRedirect();
        }
      } else {
        // Channel name not loaded yet. Keep trying for a bit, then redirect anyway?
        // Actually, if we wait too long, it's annoying. 
        // Let's rely on the MutationObserver to call this repeatedly until found.
      }
    };
    checkAndRedirect();
  };

  const performRedirect = () => {
    const id = location.pathname.split('/')[2];
    if (!id) return;

    // Only count redirect if we haven't already to avoid loops/double counting
    if (window.__redirected) return;
    window.__redirected = true;

    chrome.storage.local.get(['redirectCount'], (data) => {
      const newCount = (data.redirectCount || 0) + 1;
      chrome.storage.local.set({ redirectCount: newCount }, () => {
        window.location.replace(`https://www.youtube.com/watch?v=${id}`);
      });
    });
  };


  const removeShortsShelves = () => {
    // 1. Hide Shelves (Mixed content, so we always hide unless user disables extension)
    document.querySelectorAll(SELECTORS.shelfRenderers).forEach(el => {
      el.style.display = 'none';
    });

    // 2. Hide Shorts Tab
    document.querySelectorAll(SELECTORS.shortsTab).forEach(el => {
      el.style.display = 'none';
    });

    // 3. Hide Filter Chip
    document.querySelectorAll(SELECTORS.filterChip).forEach(chip => {
      const label = chip.querySelector('yt-formatted-string');
      if (label && label.textContent.trim().toLowerCase() === 'shorts') {
        chip.style.display = 'none';
      }
    });

    // 4. Hide Individual Items in Feeds (Video Cards)
    // Here we CAN check for whitelist!
    document.querySelectorAll(SELECTORS.shortsAnchors).forEach(a => {
      const container = a.closest(SELECTORS.feedContainers);
      if (!container) return;

      // Try to find channel name in this container
      const channelLink = container.querySelector('ytd-channel-name a, a.yt-simple-endpoint[href*="/@"]');
      if (channelLink) {
        const handle = normalizeHandle(channelLink.href.split('/').pop()); // Get /@handle
        if (isWhitelisted(handle)) {
          container.style.display = ''; // Restore if hidden
          return; // Skip hiding
        }
      }

      container.style.display = 'none';
    });

    // 5. Hide Search Results (Badge check)
    document.querySelectorAll(SELECTORS.searchVideoRenderer).forEach(video => {
      const isShort = Array.from(video.querySelectorAll('ytd-badge-supported-renderer .badge'))
        .some(b => b.textContent.trim().toLowerCase() === 'short');

      if (isShort) {
        // Check whitelist
        const channelLink = video.querySelector('ytd-channel-name a');
        if (channelLink) {
          const handle = normalizeHandle(channelLink.href.split('/').pop());
          if (isWhitelisted(handle)) {
            video.style.display = '';
            return;
          }
        }
        video.style.display = 'none';
      }
    });
  };

  const removeShortsNav = () => {
    // Nav items are global, so we always hide them
    document.querySelectorAll('a[title="Shorts"], a[href="/shorts"]').forEach(el => {
      const container = el.closest(SELECTORS.navEntry);
      if (container) container.style.display = 'none';
    });

    document.querySelectorAll('[aria-label*="Shorts"]').forEach(el => {
      if (el.getAttribute('href') === '/shorts') el.style.display = 'none';
    });
  };

  // ─── CSS Injection ────────────────────────────────────────────────────────
  const injectCSS = () => {
    // We only inject CSS for things that are ALWAYS hidden (Shelves, Nav, Tab)
    // We do NOT inject CSS for individual video cards because we need JS to check whitelist.
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


  // ─── Main Execution ──────────────────────────────────────────────────────
  const runAll = () => {
    if (!IS_ENABLED) return;
    removeShortsShelves();
    removeShortsNav();
    redirectShorts();
  };

  // Initialize
  chrome.storage.local.get(['enabled', 'whitelist'], (data) => {
    IS_ENABLED = data.enabled !== false;
    WHITELIST = data.whitelist || [];

    if (!IS_ENABLED) return;

    injectCSS();

    // Initial Run
    setTimeout(runAll, 500);

    // Watch for URL changes
    let lastUrl = location.href;
    const observer = new MutationObserver((mutations) => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        window.__redirected = false; // Reset redirect flag
        setTimeout(runAll, 300);
      }

      const hasAddedNodes = mutations.some(m => m.addedNodes.length > 0);
      if (hasAddedNodes) {
        throttle(runAll, 1000)();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Listen for storage changes (Dynamic Whitelist Update)
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.whitelist) {
      WHITELIST = changes.whitelist.newValue || [];
      runAll(); // Re-run to unhide/hide based on new list
    }
    if (changes.enabled) {
      IS_ENABLED = changes.enabled.newValue !== false;
      if (IS_ENABLED) runAll();
      else location.reload(); // Reload to restore if disabled
    }
  });

})();