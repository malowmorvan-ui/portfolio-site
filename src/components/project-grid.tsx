import type { Project } from "@/lib/types";
import { ProjectMediaItem } from "@/components/project-media";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <p className="label-caps text-muted px-5 py-16 sm:px-8">
        Aucun projet publié pour le moment.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-14 px-5 py-10 sm:grid-cols-2 sm:px-8 sm:py-14">
      {projects.map((project) => (
        <article key={project.id} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {project.media.map((media, i) => (
              <ProjectMediaItem key={media.key ?? i} media={media} />
            ))}
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="text-sm">{project.title}</h2>
            <p className="label-caps text-muted">
              {[project.date, ...project.tags].join(" · ")}
            </p>
          </div>
          {project.description && (
            <p className="text-sm text-muted">{project.description}</p>
          )}
        </article>
      ))}
    </div>
  );
}
