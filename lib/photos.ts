import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export const BUCKET = "post-photos";
export const MAX_PHOTOS = 4;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB before processing

/** Longest edge after resizing. ~200–400 KB per photo at q80. */
const MAX_EDGE = 1600;

export type ProcessResult =
  | { ok: true; paths: string[] }
  | { ok: false; message: string };

/**
 * Resizes, re-encodes, and stores uploaded photos.
 *
 * Two things happen here that matter beyond file size:
 *
 * 1. `.rotate()` bakes the EXIF orientation into the pixels BEFORE the
 *    metadata is dropped. Without it, portrait photos from a phone come out
 *    sideways once the tags are gone.
 * 2. sharp discards all metadata unless explicitly asked to keep it, which
 *    is what removes the GPS coordinates phones embed. A photo taken in
 *    someone's garden would otherwise publish their home's exact location.
 */
export async function processAndStorePhotos(
  files: File[],
  prefix: string
): Promise<ProcessResult> {
  const usable = files.filter((f) => f && f.size > 0);
  if (usable.length === 0) return { ok: true, paths: [] };

  if (usable.length > MAX_PHOTOS) {
    return {
      ok: false,
      message: `Please attach at most ${MAX_PHOTOS} photos.`,
    };
  }

  for (const file of usable) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        message: `"${file.name}" is larger than 10 MB. Please choose a smaller photo.`,
      };
    }
  }

  const supabase = createAdminClient();
  const paths: string[] = [];

  for (const [index, file] of usable.entries()) {
    let processed: Buffer;
    try {
      const input = Buffer.from(await file.arrayBuffer());
      processed = await sharp(input)
        .rotate() // apply EXIF orientation before the metadata is dropped
        .resize({
          width: MAX_EDGE,
          height: MAX_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    } catch {
      // Usually an unreadable format — HEIC on a build without libheif is the
      // realistic case. Say something a resident can act on.
      return {
        ok: false,
        message:
          `Couldn't read "${file.name}". If it came straight from an iPhone, ` +
          `try taking a screenshot of it or saving it as JPEG first.`,
      };
    }

    const path = `${prefix}/${Date.now()}-${index}.jpg`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, processed, { contentType: "image/jpeg", upsert: false });

    if (error) {
      // Roll back anything already uploaded so a half-finished post doesn't
      // leave orphaned files nobody can see or delete.
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
      return { ok: false, message: "Couldn't upload that photo. Please try again." };
    }

    paths.push(path);
  }

  return { ok: true, paths };
}

/** Short-lived signed URLs. The bucket is private, so these are the only way in. */
export async function signPhotoUrls(paths: string[]): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, 60 * 60);
  // Keep positions aligned with the input paths — callers zip the two arrays,
  // so dropping failures here would misalign every photo after the failed one.
  return (data ?? []).map((d) => d.signedUrl ?? "");
}

/** Removes stored files. Called when a post or announcement is deleted. */
export async function deletePhotos(paths: string[]): Promise<void> {
  if (!paths || paths.length === 0) return;
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove(paths);
}
