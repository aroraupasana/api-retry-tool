# Privacy Policy — API Retry Tool

**Last updated:** May 31, 2026

**Developer:** Upasana Arora

API Retry Tool is a browser extension that helps developers capture failed API requests (HTTP 4xx), edit request payloads, and retry calls from the page.

## Data collection

**We do not collect, store, or transmit any personal data to external servers.**

All captured request data (URL, method, status, payload) stays **locally in your browser** for the current tab session. Nothing is sent to the extension developer or any third party.

## Permissions used

| Permission                                 | Why                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `activeTab`                                | Access the current tab when you interact with the extension                |
| Content scripts on web pages               | Intercept `fetch` / `XHR` to detect 4xx failures on pages you visit        |
| `web_accessible_resources` (`injected.js`) | Run network interception in the page context so real app APIs are captured |

## What the extension accesses

- Failed HTTP requests (status 400–499) on same-origin or `/api` paths
- Request URL, method, and body (when present)

The extension does **not** read passwords, cookies, or unrelated page content.

## Data retention

Failed request data is held in memory until you:

- dismiss an item,
- clear the list, or
- close/refresh the tab.

No persistent storage is used unless you add that feature in a future version.

## Third-party services

This extension does not integrate with analytics, ads, or external APIs.

## Contact

For privacy questions, contact **Upasana** at [upasanaarora00@gmail.com](mailto:upasanaarora00@gmail.com)
