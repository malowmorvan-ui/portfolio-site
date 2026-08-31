import Link from "next/link";
import { siteConfig } from "@/content/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur sm:px-8">
      <Link href="/" className="text-sm font-medium tracking-tight">
        {siteConfig.name}
      </Link>
      <Link
        href="/info"
        className="label-caps text-muted transition-colors hover:text-foreground"
      >
        Info &amp; Contact
      </Link>
    </header>
  );
}
