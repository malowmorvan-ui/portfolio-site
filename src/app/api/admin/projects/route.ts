import { NextResponse } from "next/server";
import { listProjects, createProject, type ProjectInput } from "@/lib/projects";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  let input: ProjectInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!input?.title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
  }

  const project = await createProject({
    title: input.title.trim(),
    date: input.date ?? "",
    tags: Array.isArray(input.tags) ? input.tags : [],
    description: input.description?.trim() || undefined,
    media: Array.isArray(input.media) ? input.media : [],
    published: Boolean(input.published),
  });

  return NextResponse.json({ project }, { status: 201 });
}
