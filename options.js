document.getElementById('addBtn').addEventListener('click', addChannel);
document.getElementById('channelInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') addChannel();
});

function addChannel() {
    const input = document.getElementById('channelInput');
    const handle = input.value.trim().replace(/^@/, ''); // Remove leading @ if user adds it
    if (!handle) return;
    chrome.storage.local.get(['whitelist'], (data) => {
        const list = data.whitelist || [];
        if (!list.includes(handle)) {
            list.push(handle);
            chrome.storage.local.set({ whitelist: list }, () => {
                renderList(list);
                input.value = '';
            });
        }
    });
}

function removeChannel(handle) {
    chrome.storage.local.get(['whitelist'], (data) => {
        const list = data.whitelist || [];
        const newList = list.filter(item => item !== handle);
        chrome.storage.local.set({ whitelist: newList }, () => {
            renderList(newList);
        });
    });
}

function renderList(list) {
    const container = document.getElementById('whitelist-container');
    container.innerHTML = '';
    if (list.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No channels whitelisted yet.';
        container.appendChild(empty);
        return;
    }
    list.forEach(handle => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const name = document.createElement('span');
        name.className = 'channel-name';
        name.textContent = '@' + handle;
        const btn = document.createElement('button');
        btn.className = 'remove-btn';
        btn.textContent = 'Remove';
        btn.onclick = () => removeChannel(handle);
        item.appendChild(name);
        item.appendChild(btn);
        container.appendChild(item);
    });
}

// Initial render
chrome.storage.local.get(['whitelist', 'instantRedirect'], (data) => {
    renderList(data.whitelist || []);
    document.getElementById('instantRedirect').checked = !!data.instantRedirect;
});

// Handle Instant Redirect Toggle
document.getElementById('instantRedirect').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ instantRedirect: isEnabled });

    // Update DNR ruleset
    const updateConfig = {
        enableRulesetIds: isEnabled ? ['redirect_rules'] : [],
        disableRulesetIds: isEnabled ? [] : ['redirect_rules']
    };

    chrome.declarativeNetRequest.updateEnabledRulesets(updateConfig, () => {
        if (chrome.runtime.lastError) {
            console.error('Failed to update ruleset:', chrome.runtime.lastError);
        } else {
            console.log('Ruleset updated:', isEnabled);
        }
    });
});
