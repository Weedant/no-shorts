console.log('Popup script loaded');

// Test if chrome.storage is available
if (!chrome.storage) {
  console.error('chrome.storage not available!');
  document.getElementById('debug').textContent = 'Error: chrome.storage not available';
  document.getElementById('debug').style.display = 'block';
}

// Test if chrome.tabs is available
if (!chrome.tabs) {
  console.error('chrome.tabs not available!');
  document.getElementById('debug').textContent = 'Error: chrome.tabs not available';
  document.getElementById('debug').style.display = 'block';
}

// Load stats
try {
  chrome.storage.local.get(['installDate', 'redirectCount'], (data) => {
    console.log('Storage data:', data);
    
    // Initialize install date if not set
    if (!data.installDate) {
      const now = Date.now();
      chrome.storage.local.set({ installDate: now }, () => {
        console.log('Install date set:', now);
      });
      data.installDate = now;
    }
    
    // Calculate days active
    const installDate = data.installDate || Date.now();
    const daysActive = Math.floor((Date.now() - installDate) / (1000 * 60 * 60 * 24));
    
    // Update display
    document.getElementById('redirectCount').textContent = data.redirectCount || 0;
    document.getElementById('daysActive').textContent = daysActive;
    
    console.log('Display updated - Redirects:', data.redirectCount || 0, 'Days:', daysActive);
  });
} catch (error) {
  console.error('Error loading stats:', error);
  document.getElementById('debug').textContent = 'Error loading stats: ' + error.message;
  document.getElementById('debug').style.display = 'block';
}

// Button handlers
document.getElementById('coffeeBtn').addEventListener('click', () => {
  console.log('Coffee button clicked');
  try {
    chrome.tabs.create({ 
      url: 'https://buymeacoffee.com/weedant'
    }, (tab) => {
      console.log('Tab created:', tab);
    });
  } catch (error) {
    console.error('Error opening coffee link:', error);
    // Fallback: try opening in current window
    window.open('https://buymeacoffee.com/weedant', '_blank');
  }
});

document.getElementById('githubBtn').addEventListener('click', () => {
  console.log('GitHub button clicked');
  try {
    chrome.tabs.create({ 
      url: 'https://github.com/weedant/no-shorts'
    }, (tab) => {
      console.log('Tab created:', tab);
    });
  } catch (error) {
    console.error('Error opening GitHub link:', error);
    // Fallback: try opening in current window
    window.open('https://github.com/weedant/no-shorts', '_blank');
  }
});