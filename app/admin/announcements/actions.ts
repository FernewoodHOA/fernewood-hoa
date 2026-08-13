"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendBoardEmail } from "@/lib/email";
import { processAndStorePhotos, deletePhotos } from "@/lib/photos";

export type AnnouncementState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function postAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const author = await getCurrentProfile();
  if (!author?.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const notify = formData.get("notify") === "on";

  if (!title) return { status: "error", message: "Please give it a title." };
  if (!body) return { status: "error", message: "Please write the announcement." };

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File);
  const photos = await processAndStorePhotos(files, `announcements/${author.id}`);
  if (!photos.ok) return { status: "error", message: photos.message };

  const supabase = createAdminClient();

  const { data: created, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      pinned,
      author_id: author.id,
      author_name: author.full_name,
      photo_paths: photos.paths,
    })
    .select("id")
    .single();

  if (error || !created) {
    await deletePhotos(photos.paths);
    return { status: "error", message: "Couldn't save the announcement." };
  }

  if (!notify) {
    revalidatePath("/admin/announcements");
    revalidatePath("/portal/announcements");
    return { status: "ok", message: "Posted to the portal." };
  }

  // Email only residents who are actually listed with an address we can use.
  // Board members' own accounts are included — they're residents too.
  const { data: recipients } = await supabase
    .from("profiles")
    .select("email")
    .not("email", "is", null);

  const addresses = [
    ...new Set(
      (recipients ?? [])
        .map((r) => (r.email ?? "").trim())
        .filter((e) => e.length > 0)
    ),
  ];

  if (addresses.length === 0) {
    revalidatePath("/admin/announcements");
    revalidatePath("/portal/announcements");
    return {
      status: "ok",
      message: "Posted, but no residents have an email on file yet.",
    };
  }

  // One message per resident rather than one with everyone in the To line —
  // otherwise every resident's address is exposed to all the others.
  let sent = 0;
  for (const address of addresses) {
    const ok = await sendBoardEmail({
      to: [address],
      subject: `Fernewood HOA: ${title}`,
      text: [
        title,
        "",
        body,
        "",
        "—",
        `Posted by ${author.full_name}, Fernewood Homeowners Association.`,
        "You're receiving this because you have a Fernewood resident portal account.",
        "View announcements: https://www.fernewood.org/portal/announcements",
      ].join("\n"),
    });
    if (ok) sent++;
  }

  await supabase
    .from("announcements")
    .update({ emailed_at: new Date().toISOString(), recipients: sent })
    .eq("id", created.id);

  revalidatePath("/admin/announcements");
  revalidatePath("/portal/announcements");
  return {
    status: "ok",
    message: `Posted and emailed to ${sent} resident${sent === 1 ? "" : "s"}.`,
  };
}

export async function deleteAnnouncement(
  _prev: AnnouncementState,
  formData: FormData
): Promise<AnnouncementState> {
  const admin = await getCurrentProfile();
  if (!admin?.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();

  // Free the storage too, or deleted announcements leave orphaned photos
  // that nobody can see but still count against the 1 GB allowance.
  const { data: existing } = await supabase
    .from("announcements")
    .select("photo_paths")
    .eq("id", id)
    .single();
  if (existing?.photo_paths?.length) {
    await deletePhotos(existing.photo_paths);
  }

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "Couldn't delete that announcement." };
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/portal/announcements");
  return { status: "ok", message: "Announcement deleted." };
}
