function updateBadge() {
    chrome.storage.local.get({ blockedCount: 0 }, (result) => {
        const newCount = result.blockedCount + 1;
        chrome.storage.local.set({ blockedCount: newCount });
        console.debug(`[FCC Blocker] Ghost modal disposed. Total: ${newCount}`);
    });
}

//1. Ghost Mode CSS
const style = document.createElement('style');
style.textContent = `
  /* Push the specific donation portal off-screen but keep it in the DOM */
  #headlessui-portal-root:has(.donation-modal),
  #headlessui-portal-root:has(.donation-animation-container) {
    position: fixed !important;
    top: -9999px !important;
    left: -9999px !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Force scrollbars to stay active while the ghost modal is ticking */
  html:has(#headlessui-portal-root .donation-modal),
  html:has(#headlessui-portal-root .donation-animation-container),
  body:has(#headlessui-portal-root .donation-modal),
  body:has(#headlessui-portal-root .donation-animation-container) {
    overflow: visible !important;
    padding-right: 0 !important;
  }
`;
document.head.appendChild(style);

//2. Targeted Dismissal & Page Unlocker
function nukeDonationModal() {
    let attempts = 0;

    const pollInterval = setInterval(() => {
        attempts++;

        // Headless UI paralyzes the rest of the page by adding 'inert'.
        // This is stripped off so you can keep using the page.
        Array.from(document.body.children).forEach(child => {
            if (child.id !== 'headlessui-portal-root' && child.hasAttribute('inert')) {
                child.removeAttribute('inert');
                child.removeAttribute('aria-hidden');
            }
        });

        // Check for the delayed close button
        const closeBtns = document.querySelectorAll('button.close-button');
        for (const btn of closeBtns) {
            if (btn.textContent.includes('Ask me later')) {
                btn.click(); // Silently dispose of the ghost modal
                clearInterval(pollInterval);
                updateBadge();
                return;
            }
        }

        // Stop polling if the modal vanishes on its own
        if ((!document.querySelector('.donation-modal') && !document.querySelector('.donation-animation-container')) || attempts > 150) {
            clearInterval(pollInterval);
        }
    }, 200); //Check 5 times a second
}

//3. Strict MutationObserver
const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            if (
                node.classList?.contains('donation-modal') ||
                node.classList?.contains('donation-animation-container') ||
                node.querySelector?.('.donation-modal') ||
                node.querySelector?.('.donation-animation-container')
            ) {
                nukeDonationModal();
            }
        }
    }
});

// Observe the document body for portal injections
observer.observe(document.body, {
    childList: true,
    subtree: true,
});