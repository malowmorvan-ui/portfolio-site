import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  NotFound,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EMPTY_MANIFEST, type Manifest } from "./types";

const MANIFEST_KEY = "projects.json";

function env(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

/**
 * Lazily-created S3-compatible client pointed at the Cloudflare R2 bucket.
 * R2 speaks the S3 API, so the regular AWS SDK works against it — we just
 * point the endpoint at the account's R2 URL and use "auto" as the region.
 */
let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  const accountId = env("R2_ACCOUNT_ID");
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
  });
  return client;
}

function bucket(): string {
  return env("R2_BUCKET_NAME");
}

/** Build the public URL for an object key, using the configured public base URL. */
export function publicUrl(key: string): string {
  const base = env("R2_PUBLIC_URL").replace(/\/+$/, "");
  return `${base}/${key}`;
}

async function streamToString(body: unknown): Promise<string> {
  // The S3 SDK v3 body is a web ReadableStream in most modern runtimes
  // (including Next.js on Node 18+/edge), so we can use its own helper.
  const anyBody = body as {
    transformToString?: () => Promise<string>;
  };
  if (anyBody?.transformToString) {
    return anyBody.transformToString();
  }
  throw new Error("Unsupported response body type from R2");
}

/** Read the single JSON manifest that holds every project's metadata. */
export async function getManifest(): Promise<Manifest> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: bucket(), Key: MANIFEST_KEY })
    );
    const text = await streamToString(res.Body);
    const parsed = JSON.parse(text) as Manifest;
    if (!Array.isArray(parsed.projects)) return EMPTY_MANIFEST;
    return parsed;
  } catch (err) {
    if (err instanceof NotFound) return EMPTY_MANIFEST;
    // Some S3-compatible backends throw a generic error with a 404 status
    // instead of the typed NotFound — treat that the same way.
    const status = (err as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    if (status === 404) return EMPTY_MANIFEST;
    throw err;
  }
}

/** Overwrite the manifest. Callers are responsible for read-modify-write safety. */
export async function saveManifest(manifest: Manifest): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: MANIFEST_KEY,
      Body: JSON.stringify(manifest, null, 2),
      ContentType: "application/json",
      CacheControl: "no-store",
    })
  );
}

/** Generate a short-lived URL the browser can PUT a file to directly. */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
}

/** Delete an object (used when a project's media is removed). */
export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key })
  );
}
