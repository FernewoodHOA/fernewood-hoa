"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

/**
 * Renders the Turnstile widget and puts its token in a hidden field named
 * `cf-turnstile-response`, which the server actions verify.
 *
 * Renders nothing when no site key is configured, so the forms work unchanged
 * before Cloudflare is set up.
 *
 * `onToken` reports the current token, or null when there isn't one yet or it
 * expired. A form can use that to hold the submit button until the check has
 * actually run — without it, submitting before the widget finishes sends an
 * empty token and the server rejects a real person.
 *
 * `resetKey` resets the widget when its value changes. Turnstile tokens are
 * single use, so after a failed submission the old token is spent; re-issuing
 * one is what stops the form getting stuck on "we couldn't verify that you're
 * a person" until the visitor thinks to reload.
 */
export default function Turnstile({
  siteKey,
  onToken,
  resetKey = 0,
}: {
  siteKey?: string;
  onToken?: (token: string | null) => void;
  resetKey?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Held in a ref so the render effect doesn't re-run (and re-create the
  // widget) every time the parent passes a new inline function.
  const onTokenRef = useRef(onToken);
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    const el = ref.current;

    function render() {
      if (!el || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: siteKey,
        theme: "light",
        callback: (token: string) => onTokenRef.current?.(token),
        "expired-callback": () => onTokenRef.current?.(null),
        "error-callback": () => onTokenRef.current?.(null),
      });
    }

    render();
    // The script may land after this effect runs.
    const timer = setInterval(render, 300);
    return () => {
      clearInterval(timer);
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [siteKey]);

  // Spend-and-reissue. Skipped on first render — there is nothing to reset yet.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onTokenRef.current?.(null);
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={ref} className="my-1" />
    </>
  );
}
