import slugify from "slugify";
import { getManifest, saveManifest, deleteObject } from "./r2";
import type { Project, ProjectMedia } from "./types";

export interface ProjectInput {
  title: string;
  date: string;
  tags: string[];
  description?: string;
  media: ProjectMedia[];
  published: boolean;
}

function uniqueSlug(base: string, existing: Project[], skipId?: string): string {
  const root = slugify(base, { lower: true, strict: true }) || "projet";
  let candidate = root;
  let i = 2;
  while (existing.some((p) => p.slug === candidate && p.id !== skipId)) {
    candidate = `${root}-${i}`;
    i += 1;
  }
  return candidate;
}

export async function listProjects(): Promise<Project[]> {
  const { projects } = await getManifest();
  return [...projects].sort((a, b) => a.order - b.order);
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const manifest = await getManifest();
  const now = new Date().toISOString();
  const maxOrder = manifest.projects.reduce((max, p) => Math.max(max, p.order), -1);

  const project: Project = {
    id: crypto.randomUUID(),
    slug: uniqueSlug(input.title, manifest.projects),
    title: input.title,
    date: input.date,
    tags: input.tags,
    description: input.description,
    media: input.media,
    published: input.published,
    order: maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  manifest.projects.push(project);
  await saveManifest(manifest);
  return project;
}

export async function updateProject(
  id: string,
  input: ProjectInput
): Promise<Project> {
  const manifest = await getManifest();
  const index = manifest.projects.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Projet introuvable");

  const existing = manifest.projects[index];
  const updated: Project = {
    ...existing,
    title: input.title,
    slug: uniqueSlug(input.title, manifest.projects, id),
    date: input.date,
    tags: input.tags,
    description: input.description,
    media: input.media,
    published: input.published,
    updatedAt: new Date().toISOString(),
  };

  manifest.projects[index] = updated;
  await saveManifest(manifest);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const manifest = await getManifest();
  const project = manifest.projects.find((p) => p.id === id);
  if (!project) return;

  manifest.projects = manifest.projects.filter((p) => p.id !== id);
  await saveManifest(manifest);

  // Best-effort cleanup of the project's media objects. Failures here
  // shouldn't block the project from being removed from the manifest.
  await Promise.all(
    project.media.flatMap((m) => {
      const keys = [m.key, m.posterKey].filter(Boolean) as string[];
      return keys.map((key) => deleteObject(key).catch(() => undefined));
    })
  );
}

export async function reorderProjects(orderedIds: string[]): Promise<void> {
  const manifest = await getManifest();
  const positions = new Map(orderedIds.map((id, index) => [id, index]));
  manifest.projects = manifest.projects.map((p) => ({
    ...p,
    order: positions.has(p.id) ? (positions.get(p.id) as number) : p.order,
  }));
  await saveManifest(manifest);
}
