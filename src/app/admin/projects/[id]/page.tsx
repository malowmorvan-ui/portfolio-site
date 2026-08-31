import { notFound } from "next/navigation";
import { getManifest } from "@/lib/r2";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { projects } = await getManifest();
  const project = projects.find((p) => p.id === id);

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="mb-6 text-sm font-medium">Modifier le projet</h1>
      <ProjectForm project={project} />
    </div>
  );
}
