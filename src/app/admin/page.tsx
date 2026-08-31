"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/projects");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setProjects(data.projects);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/projects");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (!cancelled) setProjects(data.projects);
      } catch (err) {
        if (!cancelled) setError(String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function move(id: string, direction: -1 | 1) {
    if (!projects) return;
    const index = projects.findIndex((p) => p.id === id);
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const reordered = [...projects];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setProjects(reordered);
    await fetch("/api/admin/projects/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce projet et ses médias ? Cette action est définitive.")) {
      return;
    }
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-medium">Projets</h1>
        <div className="flex gap-4">
          <Link href="/admin/projects/new" className="label-caps underline">
            + Nouveau projet
          </Link>
          <button onClick={logout} className="label-caps text-muted">
            Déconnexion
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!projects && !error && <p className="text-sm text-muted">Chargement…</p>}
      {projects && projects.length === 0 && (
        <p className="text-sm text-muted">Aucun projet pour le moment.</p>
      )}

      {projects && projects.length > 0 && (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center gap-3 border border-border p-3 text-sm"
            >
              {project.media[0] &&
                (project.media[0].type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.media[0].url}
                    alt=""
                    className="h-12 w-12 object-cover"
                  />
                ) : (
                  <video
                    src={project.media[0].url}
                    className="h-12 w-12 object-cover"
                    muted
                  />
                ))}
              <div className="flex-1">
                <p>{project.title}</p>
                <p className="label-caps text-muted">
                  {project.published ? "Publié" : "Brouillon"} · {project.date}
                </p>
              </div>
              <button onClick={() => move(project.id, -1)} className="px-1">
                ↑
              </button>
              <button onClick={() => move(project.id, 1)} className="px-1">
                ↓
              </button>
              <Link href={`/admin/projects/${project.id}`} className="underline">
                Modifier
              </Link>
              <button onClick={() => remove(project.id)} className="text-red-600">
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
