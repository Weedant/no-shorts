// ─── Context Menu ─────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "open-as-regular",
        title: "Open as Regular Video",
        contexts: ["link", "page"],
        documentUrlPatterns: ["*://*.youtube.com/*"],
        targetUrlPatterns: ["*://*.youtube.com/shorts/*"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-as-regular") {
        // Determine the URL (linkUrl if right-clicked a link, pageUrl if right-clicked background)
        const urlString = info.linkUrl || info.pageUrl;
        if (!urlString) return;

        try {
            const url = new URL(urlString);
            // Check if it's a shorts URL
            if (url.pathname.startsWith('/shorts/')) {
                const videoId = url.pathname.split('/')[2];
                if (videoId) {
                    const newUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    chrome.tabs.create({ url: newUrl });
                }
            }
        } catch (e) {
            console.error('Invalid URL:', e);
        }
    }
});
