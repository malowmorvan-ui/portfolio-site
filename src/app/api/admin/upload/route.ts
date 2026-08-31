import { NextResponse } from "next/server";
import { getUploadUrl, publicUrl } from "@/lib/r2";

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  let filename = "";
  let contentType = "";
  try {
    const body = await request.json();
    filename = typeof body?.filename === "string" ? body.filename : "";
    contentType = typeof body?.contentType === "string" ? body.contentType : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename et contentType sont requis" },
      { status: 400 }
    );
  }

  const key = `media/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ key, uploadUrl, url: publicUrl(key) });
}
