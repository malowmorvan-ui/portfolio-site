"use client";

import type { ProjectMedia } from "./types";

async function readImageSize(
  file: File
): Promise<{ width?: number; height?: number }> {
  try {
    const url = URL.createObjectURL(file);
    const size = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = url;
      }
    );
    URL.revokeObjectURL(url);
    return size;
  } catch {
    return {};
  }
}

/**
 * Ask the server for a short-lived R2 upload URL, then PUT the file to it
 * directly from the browser (the file never passes through our server).
 */
export async function uploadMedia(file: File): Promise<ProjectMedia> {
  const presignRes = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!presignRes.ok) {
    throw new Error("Impossible d'obtenir une URL d'upload");
  }
  const { key, uploadUrl, url } = await presignRes.json();

  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(
      "L'upload vers R2 a échoué (vérifiez la configuration CORS du bucket)"
    );
  }

  const isVideo = file.type.startsWith("video/");
  const dims = isVideo ? {} : await readImageSize(file);

  return {
    key,
    url,
    type: isVideo ? "video" : "image",
    width: dims.width,
    height: dims.height,
  };
}
