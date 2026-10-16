"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project, ProjectMedia } from "@/lib/types";
import { siteConfig } from "@/content/site-config";
import { INFO_STATE_EVENT, INFO_TOGGLE_EVENT } from "@/lib/info-overlay";

/**
 * Home page as a full-screen stage, one project at a time
 * (reference: tanguymorvan.com).
 *
 *  - Mouse wheel / trackpad, vertical swipe, ↑ ↓ keys: previous / next project.
 *  - Click or tap on the media, horizontal swipe, ← → keys: previous / next
 *    image or film inside the current project.
 *  - Media fill the window height (and shrink to the width when needed).
 *  - Films play with sound as soon as they are on screen. Browsers block sound
 *    until the visitor's first click, tap or key press, so the very first film
 *    may start silent and turns its sound on at that first interaction.
 *
 * Large screens: the name on the left (hover = full-screen white info sheet,
 * click = pin it), the project titles on the right, the description under the
 * active title. Small screens: the top bar opens the same sheet, and a caption
 * at the bottom carries the title, description and counter.
 */

/** Minimum wheel travel before it counts as a step (filters tiny nudges). */
const WHEEL_THRESHOLD = 30;
/** Minimum time between two project changes from the wheel. */
const WHEEL_MIN_INTERVAL = 600;
/** A trackpad keeps sending inertia events; wait for this much silence. */
const WHEEL_QUIET_GAP = 180;
/** Swipe distance (px) that counts as a gesture rather than a tap. */
const SWIPE_DISTANCE = 50;

export function ProjectGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState(0);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [hoverInfo, setHoverInfo] = useState(false);
  const [pinnedInfo, setPinnedInfo] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [audible, setAudible] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showInfo = hoverInfo || pinnedInfo;
  const count = projects.length;

  const project = projects[active];
  const media = project?.media ?? [];
  const current = media[Math.min(mediaIndex, media.length - 1)];

  /* ---------------------------------------------------------------- nav -- */

  const goToProject = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActive(((index % count) + count) % count);
      setMediaIndex(0);
    },
    [count],
  );

  const stepProject = useCallback(
    (dir: 1 | -1) => {
      if (count === 0) return;
      setActive((a) => (((a + dir) % count) + count) % count);
      setMediaIndex(0);
    },
    [count],
  );

  const stepMedia = useCallback(
    (dir: 1 | -1) => {
      if (media.length < 2) return;
      setMediaIndex((m) => (((m + dir) % media.length) + media.length) % media.length);
    },
    [media.length],
  );

  // Open the project named in the URL hash (shareable links), then keep the
  // hash in sync without adding history entries.
  const initialHash = useRef<string | null>(null);
  useEffect(() => {
    // Read once, before the sync below rewrites it.
    initialHash.current ??= window.location.hash;
    const slug = decodeURIComponent(initialHash.current.slice(1));
    const index = projects.findIndex((p) => p.slug === slug);
    if (index <= 0) return;
    // Deferred a frame: the server always renders the first project.
    const frame = requestAnimationFrame(() => goToProject(index));
    return () => cancelAnimationFrame(frame);
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!project) return;
    window.history.replaceState(null, "", `#${project.slug}`);
  }, [project]);

  // The stage replaces page scrolling on the home page.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  // Wheel → project. One step per gesture, even with trackpad inertia.
  useEffect(() => {
    let travel = 0;
    let lockedUntil = 0;
    let lastEvent = 0;
    let locked = false;

    function onWheel(event: WheelEvent) {
      if (showInfo) return;
      event.preventDefault();
      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;

      if (locked) {
        if (now < lockedUntil || gap < WHEEL_QUIET_GAP) return;
        locked = false;
        travel = 0;
      }

      travel += event.deltaY;
      if (Math.abs(travel) < WHEEL_THRESHOLD) return;
      stepProject(travel > 0 ? 1 : -1);
      locked = true;
      lockedUntil = now + WHEEL_MIN_INTERVAL;
      travel = 0;
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [showInfo, stepProject]);

  // Keyboard. Escape always closes the info sheet.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHoverInfo(false);
        setPinnedInfo(false);
        return;
      }
      if (showInfo) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      // Space on a focused button or link keeps its normal behaviour.
      if (event.key === " " && target?.closest("button, a")) return;

      if (["ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        stepProject(1);
      } else if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        stepProject(-1);
      } else if (event.key === "ArrowRight") {
        stepMedia(1);
      } else if (event.key === "ArrowLeft") {
        stepMedia(-1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showInfo, stepProject, stepMedia]);

  // Touch: vertical swipe → project, horizontal swipe → media. Taps fall
  // through to the media's own click handler.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    function onStart(event: TouchEvent) {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }
    function onEnd(event: TouchEvent) {
      if (showInfo) return;
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
      if (Math.abs(dy) > Math.abs(dx)) stepProject(dy < 0 ? 1 : -1);
      else stepMedia(dx < 0 ? 1 : -1);
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [showInfo, stepProject, stepMedia]);

  /* -------------------------------------------------------------- sound -- */

  // Sound can only start inside a user gesture: the first click, tap or key
  // press anywhere turns it on for the film on screen.
  useEffect(() => {
    function unlock(event: Event) {
      // The sound toggle handles its own click.
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-sound-toggle]")) return;
      const video = videoRef.current;
      if (!soundOn || !video || !video.muted) return;
      video.muted = false;
      setAudible(true);
      void video.play().catch(() => {});
    }
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
    };
  }, [soundOn]);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    const video = videoRef.current;
    if (video) {
      video.muted = !next;
      setAudible(next);
      void video.play().catch(() => {});
    }
  }

  // Warm the cache for the next project's first image.
  useEffect(() => {
    const next = projects[(active + 1) % Math.max(count, 1)]?.media[0];
    if (next?.type === "image") {
      const img = new Image();
      img.src = next.url;
    }
  }, [active, count, projects]);

  /* -------------------------------------------------------- info sheet -- */

  useEffect(() => {
    function onToggle() {
      setHoverInfo(false);
      setPinnedInfo((v) => !v);
    }
    window.addEventListener(INFO_TOGGLE_EVENT, onToggle);
    return () => window.removeEventListener(INFO_TOGGLE_EVENT, onToggle);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(INFO_STATE_EVENT, { detail: showInfo }),
    );
  }, [showInfo]);

  function closeInfo() {
    setHoverInfo(false);
    setPinnedInfo(false);
  }

  function openProject(index: number) {
    closeInfo();
    goToProject(index);
  }

  /* ------------------------------------------------------------ render -- */

  if (!project || !current) {
    return (
      <p className="label-caps text-muted px-5 py-16 sm:px-8">
        No published projects yet.
      </p>
    );
  }

  const description = project.description?.trim() || project.tags.join(", ");
  const counter =
    media.length > 1 ? `${mediaIndex + 1}/${media.length}` : null;

  return (
    <div>
      {/* Stage: the current media, full window height. */}
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background">
        <StageMedia
          key={`${project.id}-${mediaIndex}`}
          media={current}
          soundOn={soundOn}
          videoRef={videoRef}
          onAudibleChange={setAudible}
          onClick={() => stepMedia(1)}
          clickable={media.length > 1}
        />
      </div>

      {/* Small screens: caption at the bottom. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-0.5 px-5 pb-4 text-center text-xs text-white mix-blend-difference lg:hidden"
      >
        <h2 className="uppercase tracking-wide">{project.title}</h2>
        {description && <p className="line-clamp-2 max-w-md">{description}</p>}
        {counter && <p className="tabular-nums">{counter}</p>}
      </div>

      {/* Sound toggle, only when a film is on screen. */}
      {current.type === "video" && (
        <button
          type="button"
          onClick={toggleSound}
          data-sound-toggle
          className="label-caps fixed bottom-4 right-5 z-30 cursor-pointer text-white mix-blend-difference max-lg:top-[3.4rem] max-lg:bottom-auto lg:right-6"
          aria-pressed={soundOn && audible}
        >
          {soundOn && audible ? "Mute" : "Unmute"}
        </button>
      )}

      {/* Full-screen white info sheet. Clicking its empty background closes it. */}
      <div
        id="info-overlay"
        aria-hidden={!showInfo}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeInfo();
        }}
        className={`fixed inset-0 z-20 overflow-y-auto overscroll-contain bg-background motion-safe:transition-opacity motion-safe:duration-300 ${
          showInfo ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Small screens: the sheet carries the info and the project list.
            Top padding clears the top bar. */}
        <div className="flex min-h-full flex-col gap-10 px-5 pb-12 pt-24 sm:px-8 lg:hidden">
          <InfoBlock />
          <nav aria-label="Projects" className="flex flex-col gap-3">
            {projects.map((p, index) => (
              <button
                key={p.id}
                type="button"
                tabIndex={showInfo ? 0 : -1}
                onClick={() => openProject(index)}
                className="w-fit cursor-pointer py-1 text-left text-sm uppercase tracking-wide"
                style={{ opacity: index === active ? 1 : 0.35 }}
                aria-current={index === active ? "true" : undefined}
              >
                {p.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Left column (large screens): the name, with the info under it. The
          hover zone covers both so the pointer can reach the links. */}
      <div
        className={`fixed left-6 top-1/2 z-30 hidden w-72 -translate-y-1/2 lg:block ${
          showInfo ? "" : "text-white mix-blend-difference"
        }`}
        onMouseEnter={() => setHoverInfo(true)}
        onMouseLeave={() => setHoverInfo(false)}
      >
        <button
          type="button"
          onClick={() => setPinnedInfo((v) => !v)}
          className="cursor-pointer text-left text-sm font-medium tracking-tight outline-none focus-visible:underline"
          aria-expanded={showInfo}
          aria-controls="info-overlay"
        >
          {siteConfig.name}
        </button>

        {/* Absolute so that revealing it never moves the name off centre. */}
        <div
          className={`absolute left-0 right-0 top-full pt-4 motion-safe:transition-all motion-safe:duration-300 ${
            showInfo
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }`}
        >
          <InfoBlock />
        </div>
      </div>

      {/* Right column (large screens): the project index, above the media and
          the white sheet. The active project shows its description and the
          media counter. */}
      <nav
        aria-label="Projects"
        className="pointer-events-none fixed right-6 top-1/2 z-30 hidden max-h-[80vh] w-56 -translate-y-1/2 flex-col gap-5 overflow-y-auto text-right text-white mix-blend-difference lg:flex xl:w-64"
      >
        {projects.map((p, index) => {
          const isActive = index === active;
          return (
            <div key={p.id} className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => openProject(index)}
                className="pointer-events-auto w-full min-w-0 cursor-pointer text-right text-xs uppercase tracking-wide transition-opacity duration-300"
                style={{ opacity: isActive ? 1 : 0.4 }}
                aria-current={isActive ? "true" : undefined}
              >
                {p.title}
              </button>
              {isActive && !showInfo && (description || counter) && (
                <div className="flex flex-col gap-1 text-xs leading-relaxed">
                  {description && <p>{description}</p>}
                  {counter && <p className="tabular-nums">{counter}</p>}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * One image or film, as tall as the window and never wider than it. Films
 * try to play with sound; if the browser refuses (no interaction yet) they
 * fall back to playing muted.
 */
function StageMedia({
  media,
  soundOn,
  videoRef,
  onAudibleChange,
  onClick,
  clickable,
}: {
  media: ProjectMedia;
  soundOn: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onAudibleChange: (audible: boolean) => void;
  onClick: () => void;
  clickable: boolean;
}) {
  const className = `stage-media h-[100dvh] w-auto max-w-full object-contain ${
    clickable ? "cursor-e-resize" : ""
  }`;

  useEffect(() => {
    const video = videoRef.current;
    if (media.type !== "video" || !video) return;
    video.muted = !soundOn;
    video
      .play()
      .then(() => onAudibleChange(!video.muted))
      .catch((error: unknown) => {
        // Only a policy refusal means "no sound yet"; an AbortError just means
        // this play() was interrupted (e.g. the media changed).
        if ((error as DOMException)?.name !== "NotAllowedError") return;
        // Sound refused before any interaction: play silently instead.
        video.muted = true;
        onAudibleChange(false);
        void video.play().catch(() => {});
      });
    return () => {
      video.pause();
    };
    // Run once per mounted media; sound changes are applied by the toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (media.type === "video") {
    return (
      <video
        ref={videoRef}
        className={className}
        src={media.url}
        poster={media.posterUrl}
        onClick={onClick}
        muted
        loop
        playsInline
        preload="auto"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={media.url}
      alt=""
      width={media.width}
      height={media.height}
      onClick={onClick}
      draggable={false}
    />
  );
}

/** Role, location and contact links, shared by both layouts. */
function InfoBlock() {
  const { contact } = siteConfig;

  return (
    <div className="flex flex-col gap-4 text-sm leading-relaxed">
      <div className="flex flex-col">
        <p>{siteConfig.role}</p>
        <p className="text-muted">{siteConfig.location}</p>
      </div>

      <div className="flex flex-col gap-1">
        {contact.email && (
          <a className="w-fit hover:underline" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        )}
        {contact.instagram && (
          <a
            className="w-fit hover:underline"
            href={contact.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        )}
        {contact.linkedin && (
          <a
            className="w-fit hover:underline"
            href={contact.linkedin}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        )}
        <Link className="w-fit text-muted hover:underline" href="/info">
          Info &amp; Contact →
        </Link>
      </div>
    </div>
  );
}
