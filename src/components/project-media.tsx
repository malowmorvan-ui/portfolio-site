import type { ProjectMedia } from "@/lib/types";

export function ProjectMediaItem({ media }: { media: ProjectMedia }) {
  if (media.type === "video") {
    return (
      <video
        className="w-full h-auto"
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
      className="w-full h-auto"
      src={media.url}
      alt=""
      loading="lazy"
      width={media.width}
      height={media.height}
    />
  );
}
