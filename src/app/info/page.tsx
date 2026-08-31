import type { Metadata } from "next";
import { siteConfig } from "@/content/site-config";

export const metadata: Metadata = {
  title: `Info & Contact — ${siteConfig.name}`,
};

export default function InfoPage() {
  const { contact } = siteConfig;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
      <section className="flex flex-col gap-4">
        <p className="label-caps text-muted">{siteConfig.role}</p>
        {siteConfig.bio.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </section>

      {siteConfig.tools.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label-caps text-muted">Outils</h2>
          <ul className="text-sm leading-relaxed">
            {siteConfig.tools.map((tool) => (
              <li key={tool}>{tool}</li>
            ))}
          </ul>
        </section>
      )}

      {siteConfig.clients.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="label-caps text-muted">Clients</h2>
          <p className="text-sm leading-relaxed">
            {siteConfig.clients.join(", ")}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="label-caps text-muted">Contact</h2>
        <div className="flex flex-col gap-1 text-sm">
          {contact.email && (
            <a className="hover:underline" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          )}
          {contact.instagram && (
            <a
              className="hover:underline"
              href={contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          )}
          {contact.linkedin && (
            <a
              className="hover:underline"
              href={contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
