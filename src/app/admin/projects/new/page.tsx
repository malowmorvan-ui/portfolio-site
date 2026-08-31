import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="mb-6 text-sm font-medium">Nouveau projet</h1>
      <ProjectForm />
    </div>
  );
}
