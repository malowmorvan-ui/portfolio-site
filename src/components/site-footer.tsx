import { siteConfig } from "@/content/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-5 py-6 sm:px-8">
      <p className="label-caps text-muted">{siteConfig.footerCredits}</p>
    </footer>
  );
}
