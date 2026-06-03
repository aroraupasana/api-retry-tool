(() => {
  "use strict";

  const DEV_MODE = false;
  const AUTHOR = "Upasana";
  const MSG = { SOURCE: "api-retry-extension", FAILED: "API_FAILED" };
  const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
  const SELECTORS = {
    panel: "#api-retry-panel",
    body: "#panel-body",
    handle: "#panel-handle",
    list: "#list",
    badge: "#api-count-badge",
    toolbar: "#toolbar",
    toggle: "#toggle-btn",
    search: "#search-input",
  };

  const store = {
    requests: [],
    ui: {
      query: "",
      hidden: false,
      expanded: false,
      hasNew: false,
      editingIndex: null,
      draftBodies: Object.create(null),
      retryingByIndex: Object.create(null),
    },
  };

  // ---------------------------------------------------------------------------
  // Request helpers
  // ---------------------------------------------------------------------------

  function normalizeUrl(input) {
    if (!input) return "";
    if (typeof input === "string") return input;
    if (typeof input.url === "string") return input.url;
    try {
      return String(input);
    } catch {
      return "";
    }
  }

  function normalizeMethod(method, fallback = "GET") {
    return String(method || fallback).toUpperCase();
  }

  function serializeBody(body, pretty = false) {
    if (body == null || body === "") return "";
    if (typeof body === "string") {
      if (!pretty) return body;
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }
    return JSON.stringify(
      body,
      pretty ? null : undefined,
      pretty ? 2 : undefined,
    );
  }

  function getRequestBody(req) {
    return req.options?.body ?? req.body ?? "";
  }

  function requestSignature(req) {
    return [
      normalizeMethod(req.method),
      req.url,
      req.status,
      serializeBody(getRequestBody(req)),
    ].join("|");
  }

  function is4xx(status) {
    const code = Number(status);
    return Number.isInteger(code) && code >= 400 && code < 500;
  }

  function isValidHttpUrl(url) {
    try {
      const { protocol } = new URL(url, location.origin);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }

  function resolveRetryUrl(url) {
    return typeof url === "string" && url.startsWith("manual://")
      ? `${location.origin}/__api_retry_test_404__`
      : url;
  }

  // ---------------------------------------------------------------------------
  // Store operations
  // ---------------------------------------------------------------------------

  function addFailedRequest(req) {
    if (!is4xx(req.status)) return;

    const entry = { ...req, createdAt: req.createdAt ?? Date.now() };
    const signature = requestSignature(entry);
    const duplicate = store.requests.some(
      (r) => requestSignature(r) === signature,
    );

    if (!duplicate) {
      store.requests.unshift(entry);
    }

    surfacePanel();
  }

  function surfacePanel() {
    store.ui.hidden = false;
    if (!store.ui.expanded) store.ui.hasNew = true;

    createPanel();
    const panel = document.getElementById("api-retry-panel");
    if (!panel) return;

    panel.classList.remove("is-hidden");
    panel.classList.add("is-collapsed");
    panel.classList.remove("is-expanded");
    panel.style.removeProperty("display");
    store.ui.expanded = false;

    render();
  }

  function clearRequests() {
    store.requests = [];
    resetItemUiState();
  }

  function removeRequest(index) {
    store.requests.splice(index, 1);
    clearItemUiState(index);
  }

  function resetItemUiState(index) {
    if (index === undefined) {
      store.ui.editingIndex = null;
      store.ui.draftBodies = Object.create(null);
      store.ui.retryingByIndex = Object.create(null);
      return;
    }
    if (store.ui.editingIndex === index) store.ui.editingIndex = null;
    delete store.ui.draftBodies[index];
    delete store.ui.retryingByIndex[index];
  }

  function getEditedBody(index, fallback) {
    return index in store.ui.draftBodies
      ? store.ui.draftBodies[index]
      : fallback;
  }

  // ---------------------------------------------------------------------------
  // Page bridge (MAIN world injected.js ↔ isolated content script)
  // ---------------------------------------------------------------------------

  function ingestFailurePayload(p) {
    addFailedRequest({
      type: p.type || "fetch",
      url: normalizeUrl(p.url),
      method: normalizeMethod(p.method),
      status: p.status,
      options: p.options ?? {},
      body: p.body,
    });
  }

  function onPageMessage(event) {
    const data = event.data;
    if (!data || data.source !== MSG.SOURCE || data.type !== MSG.FAILED) return;
    ingestFailurePayload(data.payload ?? {});
  }

  function onPageFailureEvent(event) {
    ingestFailurePayload(event.detail ?? {});
  }

  // ---------------------------------------------------------------------------
  // Retry
  // ---------------------------------------------------------------------------

  async function retryRequest(req, index) {
    const url = resolveRetryUrl(req.url);
    if (!isValidHttpUrl(url)) {
      showToast("Invalid URL — retry skipped", "error");
      return;
    }

    const method = normalizeMethod(
      req.type === "fetch" ? req.options?.method : req.method,
      req.method,
    );
    const body = getEditedBody(index, getRequestBody(req));
    const sendBody = !METHODS_WITHOUT_BODY.has(method);

    if (req.type === "fetch") {
      const options = { ...req.options, method };
      if (sendBody) options.body = body;
      else delete options.body;
      await fetch(url, options);
      return;
    }

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.onload = () => resolve();
      xhr.onerror = () => reject(new Error("Network error"));
      sendBody ? xhr.send(body) : xhr.send();
    });
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function showToast(message, variant = "info") {
    document.getElementById("api-retry-toast")?.remove();

    const toast = document.createElement("div");
    toast.id = "api-retry-toast";
    toast.className = `api-retry-toast ${variant}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 220);
    }, 1800);
  }

  function setPanelExpanded(expanded) {
    store.ui.expanded = expanded;
    if (expanded) store.ui.hasNew = false;

    const panel = $(SELECTORS.panel);
    const toggle = $(SELECTORS.toggle);
    if (panel) {
      panel.classList.toggle("is-expanded", expanded);
      panel.classList.toggle("is-collapsed", !expanded);
    }
    if (toggle) {
      toggle.textContent = expanded ? "↓" : "↑";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.title = expanded ? "Collapse panel" : "Expand panel";
    }
  }

  function hidePanel() {
    store.ui.hidden = true;
    store.ui.expanded = false;
    const panel = document.getElementById("api-retry-panel");
    if (!panel) return;
    panel.classList.add("is-hidden");
    panel.classList.remove("is-expanded");
    panel.classList.add("is-collapsed");
    panel.style.display = "none";
  }

  function createPanel() {
    if ($(SELECTORS.panel)) return;

    const panel = document.createElement("div");
    panel.id = "api-retry-panel";
    panel.className = "is-collapsed";
    panel.innerHTML = `
      <div id="handle-wrap">
        <button type="button" id="panel-handle" aria-label="Expand failed APIs panel">
          <span class="handle-bar" aria-hidden="true"></span>
          <span class="handle-row">
            <span class="handle-title">⚡ Failed APIs</span>
            <span id="api-count-badge" class="api-count-badge">0</span>
            <span class="handle-chevron" aria-hidden="true">↑</span>
          </span>
        </button>
        <button type="button" class="close-btn handle-close" aria-label="Close panel" title="Close">×</button>
      </div>
      <div id="panel-body">
        <header id="header">
          <div id="header-title-wrap">
            <span id="header-title">Failed APIs</span>
            <span class="api-count-badge header-badge">0</span>
          </div>
          <div id="header-actions">
            ${DEV_MODE ? '<button type="button" id="test-fail-btn">Test</button>' : ""}
            <button type="button" id="toggle-btn" aria-expanded="false" title="Collapse panel">↑</button>
            <button type="button" id="clear-btn">Clear</button>
            <button type="button" class="close-btn" aria-label="Close panel" title="Close">×</button>
          </div>
        </header>
        <div id="toolbar">
          <input id="search-input" type="search" placeholder="Search URL, method, status, body" />
        </div>
        <div id="list"></div>
        <footer id="panel-footer">by ${AUTHOR}</footer>
      </div>
    `;
    document.body.appendChild(panel);
    setupPanelDrag();
  }

  function setupPanelDrag() {
    const handle = $(SELECTORS.handle);
    const panel = $(SELECTORS.panel);
    if (!handle || !panel) return;

    let startY = 0;
    let dragging = false;

    handle.addEventListener("pointerdown", (e) => {
      dragging = true;
      startY = e.clientY;
      handle.setPointerCapture(e.pointerId);
    });

    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const delta = startY - e.clientY;
      if (delta > 36 && !store.ui.expanded) {
        setPanelExpanded(true);
        render();
        dragging = false;
      }
    });

    handle.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      const delta = startY - e.clientY;
      if (Math.abs(delta) < 8 && !store.ui.expanded) {
        setPanelExpanded(true);
        render();
      }
      dragging = false;
    });
  }

  function filterRequests() {
    const q = store.ui.query.trim().toLowerCase();
    if (!q) return store.requests.map((req, index) => ({ req, index }));

    return store.requests
      .map((req, index) => ({ req, index }))
      .filter(({ req }) =>
        [
          req.url,
          req.method,
          String(req.status),
          serializeBody(getRequestBody(req)),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
  }

  function createButton(label, className, index) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.dataset.index = String(index);
    btn.textContent = label;
    return btn;
  }

  function renderRequestItem({ req, index }) {
    const isEditing = store.ui.editingIndex === index;
    const isRetrying = Boolean(store.ui.retryingByIndex[index]);
    const body = getRequestBody(req);

    const item = document.createElement("article");
    item.className = "api-item";

    const url = document.createElement("div");
    url.className = "url";
    url.textContent = req.url;

    const meta = document.createElement("div");
    meta.className = "meta-row";
    meta.innerHTML = `
      <span class="pill method">${req.method || "GET"}</span>
      <span class="pill status">${req.status}</span>
    `;

    const bodyEl = document.createElement(isEditing ? "textarea" : "pre");
    bodyEl.className = isEditing ? "body inline-editor" : "body";
    if (isEditing) {
      bodyEl.dataset.index = String(index);
      bodyEl.value =
        index in store.ui.draftBodies
          ? store.ui.draftBodies[index]
          : serializeBody(body, true);
    } else {
      bodyEl.textContent = serializeBody(body, true);
    }

    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.append(
      createButton(isRetrying ? "Retrying..." : "Retry", "retry-btn", index),
      createButton(isEditing ? "Close" : "✎ Edit", "ghost-btn edit-btn", index),
      createButton("Copy", "ghost-btn copy-btn", index),
      createButton("Dismiss", "ghost-btn remove-btn", index),
    );
    actions.querySelector(".retry-btn").disabled = isRetrying;

    item.append(url, meta, bodyEl, actions);
    return item;
  }

  function render() {
    const listEl = $(SELECTORS.list);
    const panel = $(SELECTORS.panel);
    if (!listEl || !panel) return;

    const entries = filterRequests();

    panel.classList.toggle("has-new", store.ui.hasNew && !store.ui.expanded);

    document
      .querySelectorAll("#api-retry-panel .api-count-badge")
      .forEach((el) => {
        el.textContent = String(store.requests.length);
      });

    listEl.replaceChildren();

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = store.ui.query.trim()
        ? "No matches for your search."
        : DEV_MODE
          ? "No failed requests yet. Click Test to add one."
          : "No failed 4xx requests yet.";
      listEl.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    entries.forEach((entry) => fragment.append(renderRequestItem(entry)));
    listEl.append(fragment);
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  async function handleRetry(index) {
    const req = store.requests[index];
    if (!req || store.ui.retryingByIndex[index]) return;

    store.ui.retryingByIndex[index] = true;
    render();

    try {
      await retryRequest(req, index);
      showToast("Retry sent", "success");
    } catch (err) {
      showToast(`Retry failed: ${err?.message ?? err}`, "error");
    } finally {
      delete store.ui.retryingByIndex[index];
      render();
    }
  }

  function handleEditToggle(index) {
    if (store.ui.editingIndex === index) {
      store.ui.editingIndex = null;
    } else {
      store.ui.editingIndex = index;
      store.ui.draftBodies[index] = serializeBody(
        getRequestBody(store.requests[index]),
        true,
      );
    }
    render();
  }

  async function handleCopy(index) {
    const req = store.requests[index];
    if (!req) return;

    const payload = {
      url: req.url,
      status: req.status,
      method: req.method || "GET",
      body: getRequestBody(req),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      showToast("Copied request JSON", "success");
    } catch {
      showToast("Copy failed", "error");
    }
  }

  function handleTestRequest() {
    addFailedRequest({
      type: "fetch",
      url: `${location.origin}/__api_retry_test_404__`,
      method: "POST",
      options: {
        method: "POST",
        body: JSON.stringify({ demo: true }),
      },
      status: 400,
    });
    render();
    showToast("Added test 400 request", "info");
  }

  function onClick(e) {
    const { target } = e;
    const index = Number(target.dataset.index);

    if (target.classList.contains("retry-btn")) {
      handleRetry(index);
      return;
    }
    if (target.classList.contains("edit-btn")) {
      handleEditToggle(index);
      return;
    }
    if (target.classList.contains("copy-btn")) {
      handleCopy(index);
      return;
    }
    if (target.classList.contains("remove-btn")) {
      removeRequest(index);
      render();
      return;
    }
    if (target.id === "clear-btn") {
      clearRequests();
      render();
      showToast("Cleared list", "info");
      return;
    }
    if (target.id === "test-fail-btn") {
      handleTestRequest();
      return;
    }
    if (target.classList.contains("close-btn")) {
      hidePanel();
      return;
    }
    if (target.id === "panel-handle" && !store.ui.expanded) {
      setPanelExpanded(true);
      render();
      return;
    }
    if (target.id === "toggle-btn" && store.ui.expanded) {
      setPanelExpanded(false);
      render();
      return;
    }
  }

  let searchTimer;
  function onInput(e) {
    const { target } = e;

    if (target.id === "search-input") {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        store.ui.query = target.value;
        render();
      }, 150);
      return;
    }

    if (target.classList.contains("inline-editor")) {
      const index = Number(target.dataset.index);
      if (Number.isInteger(index)) store.ui.draftBodies[index] = target.value;
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    window.addEventListener("message", onPageMessage, false);
    document.addEventListener("api-retry-extension-failed", onPageFailureEvent);

    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
  }

  init();
})();
