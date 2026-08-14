import "server-only";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

export const TASK_BUCKET = "task-files";
export const MAX_FILES = 6;
export const MAX_BYTES = 15 * 1024 * 1024;

/** Longest edge for images. Renderings and plans stay readable at this size. */
const MAX_EDGE = 2000;

export type TaskFile = {
  id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by_name: string | null;
  created_at: string;
  path: string;
};

export type StoreResult =
  | { ok: true; stored: number }
  | { ok: false; message: string };

/**
 * Stores files against an action item.
 *
 * PDFs are kept byte-for-byte — a plan or quote shouldn't be re-encoded.
 * Images are resized and stripped of metadata, same as resident photos: a
 * homeowner's phone snap of their yard carries GPS coordinates, and these
 * attachments are visible to every board member and the accounting office.
 */
export async function storeTaskFiles(
  taskId: string,
  files: File[],
  uploader: { id: string; name: string }
): Promise<StoreResult> {
  const usable = files.filter((f) => f && f.size > 0);
  if (usable.length === 0) return { ok: true, stored: 0 };

  if (usable.length > MAX_FILES) {
    return { ok: false, message: `Please attach at most ${MAX_FILES} files at a time.` };
  }
  for (const f of usable) {
    if (f.size > MAX_BYTES) {
      return { ok: false, message: `"${f.name}" is larger than 15 MB.` };
    }
  }

  const supabase = createAdminClient();
  const uploaded: string[] = [];

  for (const [i, file] of usable.entries()) {
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name);

    let body: Buffer;
    let mime: string;
    let outName: string;

    try {
      const input = Buffer.from(await file.arrayBuffer());
      if (isPdf) {
        body = input;
        mime = "application/pdf";
        outName = file.name;
      } else {
        body = await sharp(input)
          .rotate()
          .resize({
            width: MAX_EDGE,
            height: MAX_EDGE,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        mime = "image/jpeg";
        outName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      }
    } catch {
      if (uploaded.length) await supabase.storage.from(TASK_BUCKET).remove(uploaded);
      return {
        ok: false,
        message: `Couldn't read "${file.name}". Try saving it as a PDF or JPEG first.`,
      };
    }

    const path = `${taskId}/${Date.now()}-${i}-${outName.replace(/[^\w.-]+/g, "_")}`;
    const { error } = await supabase.storage
      .from(TASK_BUCKET)
      .upload(path, body, { contentType: mime, upsert: false });

    if (error) {
      if (uploaded.length) await supabase.storage.from(TASK_BUCKET).remove(uploaded);
      return { ok: false, message: "Couldn't upload that file. Please try again." };
    }
    uploaded.push(path);

    const { error: rowError } = await supabase.from("board_task_files").insert({
      task_id: taskId,
      path,
      file_name: outName,
      mime_type: mime,
      size_bytes: body.length,
      uploaded_by: uploader.id,
      uploaded_by_name: uploader.name,
    });

    if (rowError) {
      // Don't leave a file in storage with no record pointing at it.
      await supabase.storage.from(TASK_BUCKET).remove(uploaded);
      return { ok: false, message: "Couldn't save that attachment." };
    }
  }

  return { ok: true, stored: uploaded.length };
}

/** Signed links for viewing. The bucket is private. */
export async function signTaskFiles(
  paths: string[]
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from(TASK_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  return new Map((data ?? []).map((d, i) => [paths[i], d.signedUrl ?? ""]));
}

export async function deleteTaskFile(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("board_task_files")
    .select("path")
    .eq("id", id)
    .single();
  if (!row) return false;

  await supabase.storage.from(TASK_BUCKET).remove([row.path]);
  const { error } = await supabase.from("board_task_files").delete().eq("id", id);
  return !error;
}

export function humanSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}
