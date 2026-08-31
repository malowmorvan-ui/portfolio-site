"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectMediaItem } from "@/components/project-media";
import { siteConfig } from "@/content/site-config";

/**
 * Home page: one continuous scroll, one project per screen.
 *
 * On large screens two fixed columns frame the media, both vertically centred:
 *  - left: the name. Hovering (or clicking, for touch) it reveals info &
 *    contact and hides the project list.
 *  - right: every project, name + description, the one currently on screen in
 *    the accent colour and the others faded. Clicking one scrolls to it.
 *
 * Below `lg` neither column fits, so the top bar handles navigation and each
 * project simply carries its caption underneath.
 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!best || entry.intersectionRatio > best.intersectionRatio) {
            best = entry;
          }
        }
        if (!best) return;
        const index = Number((best.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) setActive(index);
      },
      { threshold: [0.2, 0.4, 0.6, 0.8], rootMargin: "-5% 0px -5% 0px" },
    );

    for (const el of sectionRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [projects.length]);

  if (projects.length === 0) {
    return (
      <p className="label-caps text-muted px-5 py-16 sm:px-8">
        Aucun projet publié pour le moment.
      </p>
    );
  }

  const accent = siteConfig.accentColor;
  const { contact } = siteConfig;

  function subtitleOf(project: Project) {
    return project.description?.trim() || project.tags.join(", ");
  }

  function goTo(index: number) {
    sectionRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <div>
      {/* Left column: name, revealing info & contact on hover. */}
      <div
        className="fixed left-6 top-1/2 z-20 hidden w-60 -translate-y-1/2 lg:block"
        onMouseEnter={() => setShowInfo(true)}
        onMouseLeave={() => setShowInfo(false)}
      >
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="cursor-pointer text-left text-sm font-medium tracking-tight"
          aria-expanded={showInfo}
        >
          {siteConfig.name}
        </button>

        {/* Absolute so that revealing it never moves the name off centre. */}
        <div
          className={`absolute left-0 top-full mt-4 flex max-h-[38vh] w-60 flex-col gap-3 overflow-y-auto text-xs leading-relaxed transition-opacity duration-300 ${
            showInfo ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p className="text-muted">{siteConfig.role}</p>

          {siteConfig.bio.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}

          <div className="flex flex-col gap-1">
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
            <Link className="text-muted hover:underline" href="/info">
              Info &amp; Contact →
            </Link>
          </div>
        </div>
      </div>

      {/* Right column: the project index, hidden while info is showing. */}
      <nav
        aria-label="Projets"
        className={`pointer-events-none fixed right-6 top-1/2 z-10 hidden max-h-[80vh] w-56 -translate-y-1/2 flex-col gap-5 overflow-y-auto text-right transition-opacity duration-300 lg:flex xl:w-64 ${
          showInfo ? "opacity-0" : "opacity-100"
        }`}
      >
        {projects.map((project, index) => {
          const isActive = index === active;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => goTo(index)}
              className={`w-full min-w-0 cursor-pointer text-right transition-opacity duration-300 ${
                showInfo ? "" : "pointer-events-auto"
              }`}
              style={{ color: accent, opacity: isActive ? 1 : 0.35 }}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="block text-xs uppercase tracking-wide">
                {project.title}
              </span>
              {subtitleOf(project) && (
                <span className="block text-xs">{subtitleOf(project)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {projects.map((project, index) => (
        <section
          key={project.id}
          id={project.slug}
          data-index={index}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className="flex min-h-[90vh] scroll-mt-16 flex-col items-center justify-center gap-7 px-5 py-14 sm:px-8 lg:px-72"
        >
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
            {project.media.map((media, i) => (
              <ProjectMediaItem key={media.key ?? i} media={media} />
            ))}
          </div>

          {/* Caption under the media: replaced by the fixed index on large screens. */}
          <div
            className="flex flex-col items-center gap-0.5 text-center lg:hidden"
            style={{ color: accent }}
          >
            <h2 className="text-sm uppercase tracking-wide">{project.title}</h2>
            {subtitleOf(project) && (
              <p className="text-sm">{subtitleOf(project)}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
