export type MediaType = "image" | "video";

export interface ProjectMedia {
  /** Object key inside the R2 bucket, e.g. "media/abc123.jpg" */
  key: string;
  /** Fully-qualified public URL derived from key + R2_PUBLIC_URL */
  url: string;
  type: MediaType;
  width?: number;
  height?: number;
  /** Optional poster image key for videos */
  posterKey?: string;
  posterUrl?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  /** Free-form date label, e.g. "2026" or "Mars 2026" */
  date: string;
  /** Tools / medium tags, e.g. ["3D", "Cinema 4D", "Octane"] */
  tags: string[];
  description?: string;
  media: ProjectMedia[];
  /** Lower = shown first */
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Manifest {
  projects: Project[];
}

export const EMPTY_MANIFEST: Manifest = { projects: [] };
