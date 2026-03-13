# freeCodeCamp Donation Popup Blocker

A Chrome extension that neutralizes freeCodeCamp donation modals without interrupting your coding flow.

## How it works (actual logic)

The extension injects `content.js` on `freecodecamp.org` pages.

It uses a "Ghost Mode" strategy:

1. A `MutationObserver` watches for donation modal nodes (`.donation-modal` / `.donation-animation-container`).
2. If detected, CSS moves the Headless UI portal off-screen and disables pointer interaction.
3. A short polling loop runs to:
	- remove `inert` / `aria-hidden` from non-portal body children (restores page interactivity),
	- look for a `button.close-button` containing `Ask me later`, and click it automatically,
	- stop after success, when modal disappears, or after a failsafe timeout.
4. On successful auto-close, `blockedCount` is incremented in `chrome.storage.local`.

This keeps the modal out of sight while preserving page usability and maintaining a running total of blocked popups.

## Permissions and scope

- Host scope: `https://www.freecodecamp.org/*`, `https://freecodecamp.org/*`
- Permission used: `storage` (only for the counter)

## Installation (Unpacked)

Download the ZIP directly:

- [Download ZIP](https://github.com/Woxell/freeCodeCamp.org-Donation-Blocker-Chrome-Extension/archive/refs/heads/main.zip)

1. Unpack the ZIP, make sure the project folder contains the manifest.json among other files.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select this project folder.

## Notes

- The counter is stored in `chrome.storage.local`, so it persists across tab and browser restarts until extension storage is cleared.

## Project files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration and permissions |
| `content.js` | Donation modal detection, ghosting, unlock, and auto-dismiss logic |
| `popup.html` | Popup UI that reads and displays `blockedCount` |
| `icons/` | Extension icons |