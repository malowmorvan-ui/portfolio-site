"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProjectMedia } from "@/lib/types";

/**
 * Media are sized to fit within the viewport height so that each project reads
 * as a single "screen" when scrolling. Callers can override (the admin
 * dashboard uses small square thumbnails, for instance).
 */
const DEFAULT_CLASS =
  "max-h-[60vh] w-auto min-w-0 max-w-full object-contain sm:max-h-[85vh]";

export function ProjectMediaItem({
  media,
  className = DEFAULT_CLASS,
}: {
  media: ProjectMedia;
  className?: string;
}) {
  if (media.type === "video") {
    return <VideoMedia media={media} className={className} />;
  }

  // Plain <img> rather than next/image: the R2 public domain (or custom
  // domain) isn't known at build time, so this avoids remotePatterns config.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={media.url}
      alt=""
      loading="lazy"
      width={media.width}
      height={media.height}
    />
  );
}

/** Fired when a video takes the sound, so the others go quiet. */
const UNMUTE_EVENT = "portfolio:video-unmuted";

/**
 * Browsers only allow autoplay when the video is muted, so films start silent
 * and carry a small toggle. Turning the sound on here mutes every other video
 * on the page, so two soundtracks can never overlap.
 */
function VideoMedia({
  media,
  className,
}: {
  media: ProjectMedia;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const id = useId();

  // When another video takes the sound, fall back to muted here too, so the
  // toggle never shows "playing" on a silent video.
  useEffect(() => {
    function onOtherUnmuted(event: Event) {
      if ((event as CustomEvent<string>).detail === id) return;
      if (videoRef.current) videoRef.current.muted = true;
      setMuted(true);
    }
    window.addEventListener(UNMUTE_EVENT, onOtherUnmuted);
    return () => window.removeEventListener(UNMUTE_EVENT, onOtherUnmuted);
  }, [id]);

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !muted;

    if (!nextMuted) {
      window.dispatchEvent(
        new CustomEvent(UNMUTE_EVENT, { detail: id }),
      );
    }

    video.muted = nextMuted;
    setMuted(nextMuted);
    // Autoplay may have been blocked; unmuting is a user gesture, so retry.
    void video.play().catch(() => {});
  }

  return (
    <div className="relative inline-flex min-w-0 max-w-full">
      <video
        ref={videoRef}
        className={className}
        src={media.url}
        poster={media.posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        title={muted ? "Turn sound on" : "Turn sound off"}
        className="absolute bottom-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-opacity hover:bg-black/65"
      >
        {muted ? <IconMuted /> : <IconSound />}
      </button>
    </div>
  );
}

function IconMuted() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function IconSound() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}
