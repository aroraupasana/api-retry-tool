# Chrome Web Store Listing — Copy & Paste

**Developer / Author:** Upasana  
**Support email:** upasanaarora00@gmail.com

Use this content when submitting **API Retry Tool** to the Chrome Web Store.

---

## Extension name

```
API Retry Tool
```

---

## Short description (max ~132 chars)

```
Capture failed 4xx API calls, edit payload inline, and retry instantly — no DevTools required.
```

---

## Detailed description

```
API Retry Tool helps frontend developers and QA engineers debug failed API calls directly on the page.

WHAT IT DOES
• Automatically captures failed API responses (HTTP 4xx)
• Shows URL, method, status, and request body in a floating panel
• Lets you edit payload inline before retrying
• Retry with one click — shows "Retrying..." while in progress
• Search, copy, and dismiss individual failed requests

WHY USE IT
Stop switching to DevTools, Postman, or code edits for simple retry/debug flows. When an API returns 400/401/404/422, fix the payload and retry immediately.

FEATURES
• Detects fetch and XMLHttpRequest failures
• Inline payload editor (no popup dialogs)
• Duplicate request deduplication
• Minimize / clear panel controls
• Works on same-origin and /api endpoints

PRIVACY
No data leaves your browser. No analytics. No external servers. See privacy policy for details.

PERMISSIONS
Requires access to web pages to intercept network calls on sites you visit. Only failed 4xx API-like requests are tracked — not analytics or third-party trackers.
```

---

## Category

```
Developer Tools
```

---

## Permission justifications (for review form)

**Why does your extension need broad host access (`<all_urls>`)?**

```
The extension intercepts fetch and XMLHttpRequest on pages the user visits to capture failed 4xx API responses. Developers use it across localhost, staging, and production apps — not a single fixed domain. No data is transmitted externally; capture is local-only for debugging.
```

**Why `activeTab`?**

```
To operate on the currently active tab when the user interacts with the extension UI.
```

**Why `web_accessible_resources` (injected.js)?**

```
Network APIs run in the page JavaScript context. A small injected script hooks fetch/XHR in page context and forwards 4xx failures to the extension panel. Required for reliable capture on modern SPAs.
```

---

## Single purpose description

```
Help developers capture failed HTTP 4xx API requests on web pages and retry them with edited payloads.
```

---

## Privacy practices (dashboard checklist)

- **Collects user data?** No (if you keep current behavior)
- **Privacy policy URL:** Host `PRIVACY.md` on GitHub Pages / your site and paste that URL

Example GitHub Pages URL after hosting:
```
https://upasanaarora00.github.io/api-retry-extension/
```

---

## Screenshots to capture (before submit)

1. Panel showing a failed 4xx request with method + status pills
2. Inline payload edit mode open
3. Retry in progress ("Retrying..." state)
4. Search/filter with multiple entries (optional)

Recommended size: **1280×800** or **640×400**

---

## Package for upload

From project root:

```bash
cd /Users/nestaway/api-retry-extension
zip -r api-retry-extension.zip . \
  -x "*.DS_Store" \
  -x "*.git*" \
  -x "CHROME_STORE_LISTING.md" \
  -x "PRIVACY.md"
```

Upload `api-retry-extension.zip` at:
https://chrome.google.com/webstore/devconsole

---

## Submit checklist

- [ ] Set Chrome developer display name to **Upasana** (in developer account settings)
- [ ] Add support email: **upasanaarora00@gmail.com** (store listing + privacy policy)
- [ ] Pay $5 developer registration (one-time)
- [ ] Icons added (16, 48, 128) ✅
- [ ] Privacy policy hosted online
- [ ] 1+ screenshot uploaded
- [ ] Permission justifications filled
- [ ] Choose Public or Unlisted
- [ ] Submit for review
