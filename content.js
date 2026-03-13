let blockedCount = 0;

// ─── Selectors ────────────────────────────────────────────────────────────────
// Based off a Firefox extension. freeCodeCamp uses React-Bootstrap modals. The donation modal can be identified
// by several overlapping signals — we check all of them for robustness.
const DONATION_SELECTORS = [
    '[class*="donation-modal"]',
    '[id*="donation-modal"]',
    '.modal-backdrop',
];

// Text patterns that indicate a donation modal
const DONATION_TEXT_PATTERNS = [
    /support\s+free\s*code\s*camp/i,
    /donate\s+to\s+free/i,
    /help\s+us\s+keep\s+free/i,
    /one[\s-]time\s+donation/i,
    /monthly\s+donation/i,
    /become\s+a\s+supporter/i,
    /make\s+a\s+donation/i,
    /your\s+donation/i,
];

function isDonationModal(element) {
    const attrString = (element.className || '') + ' ' + (element.id || '');
    if (/donation/i.test(attrString)) return true;

    const text = element.textContent?.slice(0, 500) || '';
    return DONATION_TEXT_PATTERNS.some(pattern => pattern.test(text));
}

function removeElement(el) {
    if (!el || el.dataset.fccBlocked) return;
    el.dataset.fccBlocked = 'true';

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });

    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    el.remove();

    blockedCount++;
    saveCount(blockedCount);
    console.debug(`[FCC Blocker] Removed donation modal. Total blocked: ${blockedCount}`);
}

function scanAndBlock() {
    // Check explicit selectors first
    DONATION_SELECTORS.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => removeElement(el));
    });

    // Also scan all visible Bootstrap modals for donation content
    document.querySelectorAll('.modal.show, .modal.in, .modal[style*="display: block"]').forEach(modal => {
        if (isDonationModal(modal)) removeElement(modal);
    });

    // Check for the portal/overlay wrapper
    document.querySelectorAll('[class*="modal"][class*="show"]').forEach(el => {
        if (isDonationModal(el)) removeElement(el);
    });
}

//Persistent counter
function saveCount(n) {
    try { chrome.storage.local.set({ blockedCount: n }); } catch (_) { }
}

chrome.storage.local.get('blockedCount', result => {
    if (result && result.blockedCount) blockedCount = result.blockedCount;
});

//MutationObserver — catches dynamically injected modals
const observer = new MutationObserver(mutations => {
    let shouldScan = false;
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const attrStr = (node.className || '') + ' ' + (node.id || '');
            if (/modal|donation/i.test(attrStr)) {
                shouldScan = true;
                break;
            }
        }
        if (shouldScan) break;
    }
    if (shouldScan) scanAndBlock();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

//Initial scan
scanAndBlock();