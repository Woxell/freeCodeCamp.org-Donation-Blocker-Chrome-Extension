// 1. Get the current count from storage as soon as the popup opens
chrome.storage.local.get({ blockedCount: 0 }, (result) => {
    document.getElementById('count').textContent = result.blockedCount;
});

// 2. Listen for storage changes (in case a popup is blocked while this menu is open)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.blockedCount) {
        document.getElementById('count').textContent = changes.blockedCount.newValue;
    }
});