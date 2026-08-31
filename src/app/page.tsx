import { getManifest } from "@/lib/r2";
import { ProjectGrid } from "@/components/project-grid";

// Always render fresh: projects are managed live through /admin, and a
// personal portfolio gets far too little traffic to justify caching.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { projects } = await getManifest();
  const published = projects
    .filter((p) => p.published)
    .sort((a, b) => a.order - b.order);

  return <ProjectGrid projects={published} />;
}
