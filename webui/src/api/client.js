/**
 * Centralized API Client and Authentication Handler for Elasticease Web.
 * 
 * Automatically attaches the backend API Key configured in .env (X-API-Key header)
 * to all REST requests and SSE (Server-Sent Events) telemetry connections.
 */

export const API_BASE_URL = typeof __API_BASE_URL__ !== "undefined"
  ? __API_BASE_URL__
  : (typeof __BACKEND_BASE_URL__ !== "undefined" ? __BACKEND_BASE_URL__ : "http://localhost:8000");

export const BACKEND_API_KEY = typeof __BACKEND_API_KEY__ !== "undefined"
  ? __BACKEND_API_KEY__
  : (typeof __API_KEY__ !== "undefined"
      ? __API_KEY__
      : (typeof import.meta !== "undefined" && import.meta.env
          ? (import.meta.env.VITE_BACKEND_API_KEY || import.meta.env.BACKEND_API_KEY || import.meta.env.VITE_API_KEY || import.meta.env.API_KEY || "")
          : ""));

export const API_KEY = BACKEND_API_KEY;

/**
 * Fetch wrapper that attaches the X-API-Key header to requests.
 */
export async function apiFetch(input, init = {}) {
  let headers = new Headers(init.headers || {});

  if (input instanceof Request) {
    headers = new Headers(input.headers);
    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
  }

  const key = BACKEND_API_KEY || API_KEY;
  if (key && !headers.has("X-API-Key")) {
    headers.set("X-API-Key", key);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * EventSource-compatible client using streaming fetch,
 * allowing custom HTTP headers (such as X-API-Key) required by backend authentication.
 */
export function createEventSource(url, options = {}) {
  let isClosed = false;
  let abortController = new AbortController();
  let retryTimer = null;
  const listeners = {
    message: [],
    error: [],
    open: [],
  };

  const instance = {
    url,
    readyState: 0, // 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
    CONNECTING: 0,
    OPEN: 1,
    CLOSED: 2,
    onmessage: null,
    onerror: null,
    onopen: null,
    addEventListener(type, cb) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(cb);
    },
    removeEventListener(type, cb) {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((fn) => fn !== cb);
      }
    },
    close() {
      isClosed = true;
      instance.readyState = 2;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      try {
        abortController.abort();
      } catch {
        // Ignored
      }
    },
  };

  async function connect() {
    if (isClosed) return;
    instance.readyState = 0;
    abortController = new AbortController();

    try {
      const headers = new Headers(options.headers || {});
      const key = BACKEND_API_KEY || API_KEY;
      if (key && !headers.has("X-API-Key")) {
        headers.set("X-API-Key", key);
      }
      if (!headers.has("Accept")) {
        headers.set("Accept", "text/event-stream");
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        signal: abortController.signal,
        credentials: options.withCredentials ? "include" : "same-origin",
      });

      if (!response.ok) {
        throw new Error(`SSE HTTP error: ${response.status}`);
      }

      instance.readyState = 1;
      let openEvt;
      try {
        openEvt = new Event("open");
      } catch {
        openEvt = { type: "open", target: instance, currentTarget: instance };
      }
      if (typeof instance.onopen === "function") {
        try {
          instance.onopen(openEvt);
        } catch (e) {
          console.error(e);
        }
      }
      (listeners.open || []).forEach((cb) => {
        try {
          cb(openEvt);
        } catch (e) {
          console.error(e);
        }
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (!isClosed) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (!part.trim()) continue;
          let eventType = "message";
          let eventData = "";
          const lines = part.split(/\r?\n/);
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              const dataLine = line.slice(5).trimStart();
              eventData = eventData ? `${eventData}\n${dataLine}` : dataLine;
            }
          }

          if (eventData) {
            let messageEvt;
            try {
              messageEvt = new MessageEvent(eventType, { data: eventData });
            } catch {
              messageEvt = {
                data: eventData,
                type: eventType,
                target: instance,
                currentTarget: instance,
              };
            }

            if (eventType === "message" && typeof instance.onmessage === "function") {
              try {
                instance.onmessage(messageEvt);
              } catch (e) {
                console.error(e);
              }
            }
            const cbs = listeners[eventType] || [];
            cbs.forEach((cb) => {
              try {
                cb(messageEvt);
              } catch (e) {
                console.error(e);
              }
            });
          }
        }
      }
    } catch (err) {
      if (isClosed) return;
      let errEvt;
      try {
        errEvt = new Event("error");
        errEvt.error = err;
      } catch {
        errEvt = { type: "error", target: instance, currentTarget: instance, error: err };
      }
      if (typeof instance.onerror === "function") {
        try {
          instance.onerror(errEvt);
        } catch (e) {
          console.error(e);
        }
      }
      (listeners.error || []).forEach((cb) => {
        try {
          cb(errEvt);
        } catch (e) {
          console.error(e);
        }
      });
    }

    if (!isClosed) {
      retryTimer = setTimeout(connect, 3000);
    }
  }

  connect();
  return instance;
}

/**
 * Installs global interceptors on window.fetch and window.EventSource.
 * Ensures any request targeting backend API automatically carries X-API-Key.
 */
export function installApiInterceptor() {
  if (typeof window === "undefined" || window.__ELASTICEASE_AUTH_INTERCEPTOR_INSTALLED__) {
    return;
  }
  window.__ELASTICEASE_AUTH_INTERCEPTOR_INSTALLED__ = true;

  const originalFetch = window.fetch;
  window.fetch = async function (input, init = {}) {
    try {
      let targetUrl = "";
      if (typeof input === "string") {
        targetUrl = input;
      } else if (input instanceof Request) {
        targetUrl = input.url;
      } else if (input && typeof input === "object" && "href" in input) {
        targetUrl = input.href;
      }

      const isBackend =
        targetUrl.includes("/v1/") ||
        (API_BASE_URL && targetUrl.startsWith(API_BASE_URL));

      const key = BACKEND_API_KEY || API_KEY;
      if (isBackend && key) {
        const headers = new Headers(
          init.headers || (input instanceof Request ? input.headers : {})
        );
        if (!headers.has("X-API-Key")) {
          headers.set("X-API-Key", key);
        }
        init = { ...init, headers };
      }
    } catch {
      // Proceed with original fetch on any inspection error
    }

    return originalFetch.call(this, input, init);
  };

  if (typeof window.EventSource !== "undefined") {
    const OriginalEventSource = window.EventSource;
    function AuthenticatedEventSource(url, eventSourceInitDict) {
      const urlStr = String(url || "");
      const isBackend =
        urlStr.includes("/v1/") ||
        (API_BASE_URL && urlStr.startsWith(API_BASE_URL));

      const key = BACKEND_API_KEY || API_KEY;
      if (isBackend && key) {
        return createEventSource(urlStr, eventSourceInitDict);
      }
      return new OriginalEventSource(url, eventSourceInitDict);
    }
    AuthenticatedEventSource.CONNECTING = 0;
    AuthenticatedEventSource.OPEN = 1;
    AuthenticatedEventSource.CLOSED = 2;
    AuthenticatedEventSource.prototype = OriginalEventSource.prototype;
    window.EventSource = AuthenticatedEventSource;
  }
}
