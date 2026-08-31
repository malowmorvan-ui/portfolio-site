import { NextResponse } from "next/server";
import { reorderProjects } from "@/lib/projects";

export async function POST(request: Request) {
  let orderedIds: string[];
  try {
    const body = await request.json();
    orderedIds = body?.orderedIds;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds doit être un tableau" }, { status: 400 });
  }

  await reorderProjects(orderedIds);
  return NextResponse.json({ ok: true });
}
