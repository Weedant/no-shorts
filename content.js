(() => {
  // Throttle function to limit execution frequency
  const throttle = (func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  };

  const redirectShorts = () => {
    if (location.pathname.startsWith("/shorts/")) {
      const id = location.pathname.split("/")[2];
      if (id) {
        // Track redirect BEFORE redirecting
        chrome.storage.local.get(['redirectCount'], (data) => {
          const newCount = (data.redirectCount || 0) + 1;
          chrome.storage.local.set({ redirectCount: newCount }, () => {
            // Only redirect after storage is saved
            window.location.replace(`https://www.youtube.com/watch?v=${id}`);
          });
        });
      }
    }
  };

  const removeShortsShelves = () => {
    // Remove Shorts shelves
    document.querySelectorAll("ytd-rich-section-renderer, ytd-reel-shelf-renderer").forEach(el => {
      const text = el.innerText?.toLowerCase() || "";
      if (text.includes("shorts") || text.includes("short")) {
        el.style.display = "none";
      }
    });

    // Remove individual Shorts videos from feeds
    document.querySelectorAll('a[href^="/shorts/"]').forEach(a => {
      const container = a.closest(
        "ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer"
      );
      if (container) {
        container.style.display = "none";
      }
    });

    // Remove Shorts tab on channel pages
    document.querySelectorAll('yt-tab-shape[tab-title="Shorts"], tp-yt-paper-tab:has([tab-title="Shorts"])').forEach(el => {
      el.style.display = "none";
    });

    // CRITICAL: Remove "Shorts" filter chip on search results
    document.querySelectorAll('yt-chip-cloud-chip-renderer').forEach(chip => {
      const label = chip.querySelector('yt-formatted-string');
      if (label && label.textContent.trim().toLowerCase() === 'shorts') {
        chip.style.display = 'none';
      }
    });

    // Hide search results that are Shorts
    document.querySelectorAll('ytd-video-renderer').forEach(video => {
      const badges = video.querySelectorAll('ytd-badge-supported-renderer .badge');
      badges.forEach(badge => {
        if (badge.textContent.trim().toLowerCase() === 'short') {
          video.style.display = 'none';
        }
      });
    });
  };

  const removeShortsNav = () => {
    // Remove Shorts from sidebar navigation
    document.querySelectorAll('a[title="Shorts"], a[href="/shorts"]').forEach(el => {
      const container = el.closest("ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer");
      if (container) {
        container.style.display = "none";
      }
    });

    // Remove Shorts button from mobile/compact views
    document.querySelectorAll('[aria-label*="Shorts"]').forEach(el => {
      if (el.getAttribute("href") === "/shorts") {
        el.style.display = "none";
      }
    });
  };

  // Initial execution
  redirectShorts();
  
  // Use setTimeout to let YouTube load
  setTimeout(() => {
    removeShortsShelves();
    removeShortsNav();
  }, 500);

  // Track URL changes for SPA navigation
  let lastUrl = location.href;
  const checkUrlChange = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      redirectShorts();
      setTimeout(() => {
        removeShortsShelves();
        removeShortsNav();
      }, 300);
    }
  };

  // Throttled removal function
  const throttledRemoval = throttle(() => {
    removeShortsShelves();
    removeShortsNav();
  }, 1000);

  // More efficient observer with throttling
  const observer = new MutationObserver((mutations) => {
    checkUrlChange();
    
    // Only run removal if relevant nodes were added
    const hasRelevantChanges = mutations.some(mutation => 
      mutation.addedNodes.length > 0
    );
    
    if (hasRelevantChanges) {
      throttledRemoval();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Fallback: periodic check every 3 seconds
  setInterval(() => {
    removeShortsShelves();
    removeShortsNav();
  }, 3000);

  // Add CSS to hide Shorts more aggressively
  const style = document.createElement("style");
  style.textContent = `
    ytd-reel-shelf-renderer,
    a[href^="/shorts/"],
    [tab-title="Shorts"],
    ytd-guide-entry-renderer:has(a[href="/shorts"]),
    ytd-mini-guide-entry-renderer:has(a[href="/shorts"]),
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]) {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
})();