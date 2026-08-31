"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Project, ProjectMedia } from "@/lib/types";
import { uploadMedia } from "@/lib/upload-client";

export interface ProjectFormValues {
  title: string;
  date: string;
  tagsText: string;
  description: string;
  published: boolean;
  media: ProjectMedia[];
}

function toFormValues(project?: Project): ProjectFormValues {
  return {
    title: project?.title ?? "",
    date: project?.date ?? "",
    tagsText: project?.tags.join(", ") ?? "",
    description: project?.description ?? "",
    published: project?.published ?? false,
    media: project?.media ?? [],
  };
}

export function ProjectForm({ project }: { project?: Project }) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>(() => toFormValues(project));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(project);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: ProjectMedia[] = [];
      for (const file of Array.from(fileList)) {
        uploaded.push(await uploadMedia(file));
      }
      setValues((v) => ({ ...v, media: [...v.media, ...uploaded] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  }

  function moveMedia(index: number, direction: -1 | 1) {
    setValues((v) => {
      const media = [...v.media];
      const target = index + direction;
      if (target < 0 || target >= media.length) return v;
      [media[index], media[target]] = [media[target], media[index]];
      return { ...v, media };
    });
  }

  function removeMedia(index: number) {
    setValues((v) => ({ ...v, media: v.media.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: values.title,
      date: values.date,
      tags: values.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      description: values.description,
      published: values.published,
      media: values.media,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/admin/projects/${project!.id}` : "/api/admin/projects",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Échec de l'enregistrement");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Titre
        <input
          className="border border-border px-3 py-2 text-sm"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Date (ex : 2026 ou Mars 2026)
        <input
          className="border border-border px-3 py-2 text-sm"
          value={values.date}
          onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Tags / outils (séparés par des virgules)
        <input
          className="border border-border px-3 py-2 text-sm"
          placeholder="3D, Cinema 4D, Octane"
          value={values.tagsText}
          onChange={(e) => setValues((v) => ({ ...v, tagsText: e.target.value }))}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optionnelle)
        <textarea
          className="border border-border px-3 py-2 text-sm"
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.published}
          onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
        />
        Publié (visible sur le site)
      </label>

      <div className="flex flex-col gap-3">
        <p className="label-caps text-muted">Médias</p>

        {values.media.length > 0 && (
          <ul className="flex flex-col gap-2">
            {values.media.map((media, i) => (
              <li
                key={media.key}
                className="flex items-center gap-3 border border-border p-2 text-sm"
              >
                {media.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={media.url} alt="" className="h-12 w-12 object-cover" />
                ) : (
                  <video src={media.url} className="h-12 w-12 object-cover" muted />
                )}
                <span className="flex-1 truncate text-muted">{media.key}</span>
                <button type="button" onClick={() => moveMedia(i, -1)} className="px-1">
                  ↑
                </button>
                <button type="button" onClick={() => moveMedia(i, 1)} className="px-1">
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="px-1 text-red-600"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-muted">Envoi en cours…</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="border border-border px-4 py-2 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
