"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

/**
 * Renders the Turnstile widget and puts its token in a hidden field named
 * `cf-turnstile-response`, which the server actions verify.
 *
 * Renders nothing when no site key is configured, so the forms work unchanged
 * before Cloudflare is set up.
 */
export default function Turnstile({ siteKey }: { siteKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    const el = ref.current;

    function render() {
      if (!el || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: siteKey,
        theme: "light",
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
