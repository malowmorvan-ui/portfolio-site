import { NextResponse } from "next/server";
import { updateProject, deleteProject, type ProjectInput } from "@/lib/projects";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let input: ProjectInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!input?.title?.trim()) {
    return NextResponse.json({ error: "Le titre est requis" }, { status: 400 });
  }

  try {
    const project = await updateProject(id, {
      title: input.title.trim(),
      date: input.date ?? "",
      tags: Array.isArray(input.tags) ? input.tags : [],
      description: input.description?.trim() || undefined,
      media: Array.isArray(input.media) ? input.media : [],
      published: Boolean(input.published),
    });
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
