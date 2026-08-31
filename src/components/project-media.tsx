import type { ProjectMedia } from "@/lib/types";

/**
 * Media are sized to fit within the viewport height so that each project reads
 * as a single "screen" when scrolling. Callers can override (the admin
 * dashboard uses small square thumbnails, for instance).
 */
const DEFAULT_CLASS =
  "max-h-[55vh] w-auto min-w-0 max-w-full object-contain sm:max-h-[70vh]";

export function ProjectMediaItem({
  media,
  className = DEFAULT_CLASS,
}: {
  media: ProjectMedia;
  className?: string;
}) {
  if (media.type === "video") {
    return (
      <video
        className={className}
        src={media.url}
        poster={media.posterUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
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
