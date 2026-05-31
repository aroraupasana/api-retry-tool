# API Retry Tool

A Chrome extension that captures failed API calls (HTTP 4xx), lets you edit the request payload inline, and retry instantly — without leaving the page or opening DevTools.

**Author:** Upasana  
**Contact:** upasanaarora00@gmail.com  
**Privacy policy:** https://aroraupasana.github.io/api-retry-tool/

---

## Why this exists

When an API returns `400`, `401`, `404`, or `422`, developers usually:

1. Open DevTools → Network tab  
2. Find the failed request  
3. Copy payload  
4. Switch to Postman or edit code  
5. Refresh and try again  

**API Retry Tool** shortens that to: see failure → edit payload → retry.

---

## Features

- **Auto-capture 4xx failures** from `fetch` and `XMLHttpRequest`
- **Floating panel** showing URL, method, status, and body
- **Inline payload editor** — click ✎ Edit, change JSON, click Retry
- **Retry with loading state** — button shows `Retrying...` while in flight
- **Search** failed requests by URL, method, status, or body
- **Copy** request details as JSON
- **Dismiss** individual entries or clear the full list
- **Duplicate prevention** — same failing request is not spammed
- **Privacy-first** — all data stays in your browser; nothing is sent to external servers

---

## How it works

```
Page (fetch / XHR)
       ↓
injected.js      ← hooks network APIs in page context
       ↓
postMessage
       ↓
content.js       ← stores failures, renders UI, handles retry
       ↓
Panel on page    ← search, edit, retry, copy
```

| File | Role |
|------|------|
| `manifest.json` | Extension config (Manifest V3) |
| `injected.js` | Intercepts `fetch` / XHR in **page context** (required for SPAs) |
| `content.js` | UI panel, state, retry logic, message bridge |
| `styles.css` | Panel and inline editor styling |
| `icons/` | Extension icons (16, 48, 128) |
| `docs/index.html` | Hosted privacy policy (GitHub Pages) |

Only **same-origin** or **`/api`** URLs with **4xx status codes** are tracked. Analytics and third-party tracker failures are ignored.

---

## Install locally (developer mode)

1. Clone the repo:
   ```bash
   git clone https://github.com/aroraupasana/api-retry-tool.git
   cd api-retry-tool
   ```
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the project folder
6. Refresh any tab where you want to use it

---

## Usage

1. Use your app normally — when an API returns 4xx, it appears in the **⚡ Failed APIs** panel (bottom-right).
2. Click **✎ Edit** to modify the request body inline.
3. Click **Retry** to resend with the updated payload.
4. Use **Copy** to export request JSON, or **Dismiss** to remove an entry.

### Panel controls

| Control | Action |
|---------|--------|
| `_` / `+` | Minimize / expand panel |
| **Clear** | Remove all captured requests |
| **Search** | Filter by URL, method, status, or body |

---

## Development

### Project structure

```
api-retry-tool/
├── manifest.json
├── content.js          # UI + retry + bridge
├── injected.js         # Page-context network hooks
├── styles.css
├── icons/
├── docs/index.html     # Privacy policy (GitHub Pages)
├── PRIVACY.md
└── CHROME_STORE_LISTING.md
```

### Enable dev test button

In `content.js`, set:

```js
const DEV_MODE = true;
```

This shows a **Test** button that adds a sample 400 request to the panel. Keep `DEV_MODE = false` for production / store builds.

### Build upload zip (Chrome Web Store)

```bash
zip -r api-retry-extension.zip . \
  -x "*.DS_Store" \
  -x "*.git*" \
  -x "CHROME_STORE_LISTING.md" \
  -x "PRIVACY.md" \
  -x "README.md" \
  -x "docs/*" \
  -x "api-retry-extension.zip"
```

Upload `api-retry-extension.zip` at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Permissions

| Permission | Reason |
|------------|--------|
| `activeTab` | Operate on the tab you are debugging |
| Content scripts on all URLs | Capture failed APIs on localhost, staging, and production |
| `web_accessible_resources` | Inject `injected.js` into page context for reliable interception |

No data is collected or transmitted externally. See [PRIVACY.md](./PRIVACY.md) or the [hosted policy](https://aroraupasana.github.io/api-retry-tool/).

---

## License

MIT — use freely for personal and commercial projects.

---

## Contributing

Issues and pull requests are welcome at [github.com/aroraupasana/api-retry-tool](https://github.com/aroraupasana/api-retry-tool).
