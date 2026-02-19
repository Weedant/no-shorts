// ─── Load persisted state ────────────────────────────────────────────────────
chrome.storage.local.get(['installDate', 'redirectCount', 'enabled'], (data) => {

  // ── Install date ────────────────────────────────────────────────────────
  if (!data.installDate) {
    const now = Date.now();
    chrome.storage.local.set({ installDate: now });
    data.installDate = now;
  }

  const daysActive = Math.floor((Date.now() - data.installDate) / 86_400_000);
  document.getElementById('redirectCount').textContent = data.redirectCount ?? 0;
  document.getElementById('daysActive').textContent = daysActive;

  // ── Toggle (default: enabled) ───────────────────────────────────────────
  const isEnabled = data.enabled !== false;
  applyToggleState(isEnabled);
  document.getElementById('enabledToggle').checked = isEnabled;
});

// ─── Toggle handler ───────────────────────────────────────────────────────────
document.getElementById('enabledToggle').addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  chrome.storage.local.set({ enabled: isEnabled });
  applyToggleState(isEnabled);
});

function applyToggleState(isEnabled) {
  const banner = document.getElementById('statusBanner');
  const icon = document.getElementById('statusIcon');
  const text = document.getElementById('statusText');

  if (isEnabled) {
    banner.className = 'status active';
    icon.textContent = '✓';
    text.textContent = 'Extension is active';
  } else {
    banner.className = 'status inactive';
    icon.textContent = '✕';
    text.textContent = 'Extension is paused';
  }
}

// ─── Reset stats ──────────────────────────────────────────────────────────────
document.getElementById('resetBtn').addEventListener('click', () => {
  chrome.storage.local.set({ redirectCount: 0, installDate: Date.now() }, () => {
    document.getElementById('redirectCount').textContent = 0;
    document.getElementById('daysActive').textContent = 0;
  });
});

// ─── External links ───────────────────────────────────────────────────────────
document.getElementById('coffeeBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://buymeacoffee.com/weedant' });
});

document.getElementById('githubBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://github.com/weedant/no-shorts' });
});