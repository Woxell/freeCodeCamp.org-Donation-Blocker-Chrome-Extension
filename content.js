let blockedCount = 0;

function updateBadge() {
    blockedCount++;
    chrome.runtime.sendMessage({ action: 'updateCount', count: blockedCount }).catch(() => { });
    console.debug(`[FCC Blocker] Dismissed donation modal. Total: ${blockedCount}`);
}

// ─── 1. Hide everything instantly ──────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  /* Hide the modal, the animation, and the portal wrapper */
  #headlessui-portal-root,
  .donation-modal,
  .donation-animation-container {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;
document.head.appendChild(style);

function nukeModal() {

    setTimeout(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true
        }));

        const backdrop = document.querySelector('.fixed.inset-0.bg-gray-900.opacity-50');
        if (backdrop) backdrop.click();

    }, 100);

    let attempts = 0;
    const pollInterval = setInterval(() => {
        attempts++;

        // Look for the "Ask me later" close button
        const closeBtn = document.querySelector('button.close-button');
        if (closeBtn) {
            closeBtn.click();
            clearInterval(pollInterval);
            updateBadge();
        }

        //Stop polling if the modal is successfully gone
        if (!document.querySelector('.donation-modal') || attempts > 125) {
            clearInterval(pollInterval);
        }
    }, 200); //Check 5 times a second
}

// ─── 3. MutationObserver ─────────────────────────────────────────────────────
const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            // Detect the Headless UI portal or the donation modal wrapper
            if (
                node.id === 'headlessui-portal-root' ||
                node.classList?.contains('donation-modal') ||
                node.querySelector?.('.donation-modal')
            ) {
                nukeModal();
            }
        }
    }
});

// Observe the document body for portal injections
observer.observe(document.body, {
    childList: true,
    subtree: true,
});