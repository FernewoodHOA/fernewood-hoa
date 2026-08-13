"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { processAndStorePhotos, deletePhotos } from "@/lib/photos";

export type BoardState = { status: "idle" | "ok" | "error"; message?: string };

const MAX_BODY = 5000;

export async function createPost(
  _prev: BoardState,
  formData: FormData
): Promise<BoardState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const body = String(formData.get("body") ?? "").trim();
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const hasPhotos = files.some((f) => f.size > 0);

  if (!body && !hasPhotos)
    return { status: "error", message: "Write something or attach a photo." };
  if (body.length > MAX_BODY)
    return { status: "error", message: "That post is too long." };

  const photos = await processAndStorePhotos(files, `posts/${profile.id}`);
  if (!photos.ok) return { status: "error", message: photos.message };

  const supabase = createAdminClient();
  const { error } = await supabase.from("posts").insert({
    profile_id: profile.id,
    author_name: profile.full_name,
    body,
    photo_paths: photos.paths,
  });

  if (error) {
    // Don't leave uploaded files behind if the row failed to save.
    await deletePhotos(photos.paths);
    return { status: "error", message: "Couldn't post that." };
  }

  revalidatePath("/portal/board");
  return { status: "ok" };
}

export async function createReply(
  _prev: BoardState,
  formData: FormData
): Promise<BoardState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const postId = String(formData.get("post_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { status: "error", message: "Write a reply first." };
  if (body.length > MAX_BODY)
    return { status: "error", message: "That reply is too long." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("post_replies").insert({
    post_id: postId,
    profile_id: profile.id,
    author_name: profile.full_name,
    body,
  });

  if (error) return { status: "error", message: "Couldn't post that reply." };

  revalidatePath("/portal/board");
  return { status: "ok" };
}

/**
 * Authors delete their own; admins remove anyone's. An admin removal is kept
 * as a tombstone rather than erased, so a moderation decision leaves a record
 * — useful if a resident later disputes it.
 */
export async function removePost(
  _prev: BoardState,
  formData: FormData
): Promise<BoardState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "post");
  const table = kind === "reply" ? "post_replies" : "posts";
  const supabase = createAdminClient();

  // Replies have no photo_paths column, so ask for it only when it exists.
  // A conditional column list defeats Supabase's type inference, hence the
  // two explicit branches.
  const { data: row } =
    kind === "reply"
      ? await supabase
          .from("post_replies")
          .select("profile_id")
          .eq("id", id)
          .single()
      : await supabase
          .from("posts")
          .select("profile_id, photo_paths")
          .eq("id", id)
          .single();

  if (!row) return { status: "error", message: "Not found." };

  const isAuthor = row.profile_id === profile.id;
  if (!isAuthor && !profile.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  // Only a hard delete frees the storage. An admin removal keeps the row as a
  // moderation record, so its photos stay too — otherwise the record of what
  // was removed is incomplete.
  if (isAuthor && kind === "post") {
    const paths = (row as { photo_paths?: string[] }).photo_paths ?? [];
    await deletePhotos(paths);
  }

  const { error } = isAuthor
    ? await supabase.from(table).delete().eq("id", id)
    : await supabase
        .from(table)
        .update({
          removed_at: new Date().toISOString(),
          removed_by: profile.id,
        })
        .eq("id", id);

  if (error) return { status: "error", message: "Couldn't remove that." };

  revalidatePath("/portal/board");
  return { status: "ok" };
}
