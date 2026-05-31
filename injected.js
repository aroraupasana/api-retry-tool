(() => {
  "use strict";

  if (window.__API_RETRY_EXTENSION_INJECTED__) return;
  window.__API_RETRY_EXTENSION_INJECTED__ = true;

  const MSG = { SOURCE: "api-retry-extension", FAILED: "API_FAILED" };

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

  function is4xx(status) {
    const code = Number(status);
    return Number.isInteger(code) && code >= 400 && code < 500;
  }

  function shouldTrack(url) {
    try {
      const parsed = new URL(url, location.origin);
      return (
        parsed.origin === location.origin || parsed.pathname.includes("/api")
      );
    } catch {
      return false;
    }
  }

  function emitFailure(payload) {
    if (!is4xx(payload?.status)) return;
    window.postMessage(
      { source: MSG.SOURCE, type: MSG.FAILED, payload },
      "*",
    );
  }

  // --- fetch ---
  const nativeFetch = window.fetch;
  window.fetch = async (...args) => {
    const [input, init = {}] = args;
    const url = normalizeUrl(input);
    if (!shouldTrack(url)) return nativeFetch(...args);

    const method = normalizeMethod(init.method, input?.method);
    const response = await nativeFetch(...args);

    if (is4xx(response.status)) {
      emitFailure({
        type: "fetch",
        url,
        method,
        status: response.status,
        options: { method, body: init.body },
      });
    }

    return response;
  };

  // --- XMLHttpRequest ---
  const nativeOpen = XMLHttpRequest.prototype.open;
  const nativeSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__retryMeta = { method, url };
    return nativeOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const meta = this.__retryMeta;
    if (!meta || !shouldTrack(meta.url)) {
      return nativeSend.apply(this, arguments);
    }

    this.addEventListener("load", function onLoad() {
      if (!is4xx(this.status)) return;
      emitFailure({
        type: "xhr",
        url: meta.url,
        method: normalizeMethod(meta.method),
        status: this.status,
        body,
      });
    });

    return nativeSend.apply(this, arguments);
  };
})();
