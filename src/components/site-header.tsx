"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/content/site-config";
import { INFO_STATE_EVENT, INFO_TOGGLE_EVENT } from "@/lib/info-overlay";

/**
 * On the home page at large sizes the name lives in the fixed left column
 * (see project-grid.tsx), so this top bar is hidden there. It stays on narrow
 * screens, where that fixed column has no room. On the home page the name
 * opens the full-screen info overlay instead of linking to "/".
 */
export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    function onState(event: Event) {
      setInfoOpen(Boolean((event as CustomEvent<boolean>).detail));
    }
    window.addEventListener(INFO_STATE_EVENT, onState);
    return () => window.removeEventListener(INFO_STATE_EVENT, onState);
  }, []);

  return (
    <header
      className={
        isHome
          ? // Home: floats over the full-screen media, legible on any image.
            "fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 text-white mix-blend-difference sm:px-8 lg:hidden"
          : "sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur sm:px-8"
      }
    >
      {isHome ? (
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(INFO_TOGGLE_EVENT))}
          className="cursor-pointer text-left text-sm font-medium tracking-tight outline-none focus-visible:underline"
          aria-expanded={infoOpen}
          aria-controls="info-overlay"
        >
          {siteConfig.name}
        </button>
      ) : (
        <Link href="/" className="text-sm font-medium tracking-tight">
          {siteConfig.name}
        </Link>
      )}
      <Link
        href="/info"
        className={`label-caps transition-colors ${
          isHome ? "" : "text-muted hover:text-foreground"
        }`}
      >
        Info &amp; Contact
      </Link>
    </header>
  );
}
