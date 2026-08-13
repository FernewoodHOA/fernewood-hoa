"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { isOpen } from "@/lib/tasks";

export type TaskState = { status: "idle" | "ok" | "error"; message?: string };

export async function createTask(
  _prev: TaskState,
  formData: FormData
): Promise<TaskState> {
  const admin = await getCurrentProfile();
  if (!admin?.is_admin) return { status: "error", message: "Not authorized." };

  const address = String(formData.get("address") ?? "").trim();
  const homeowner = String(formData.get("homeowner") ?? "").trim();
  const issue = String(formData.get("issue") ?? "").trim();
  const todo = String(formData.get("todo") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = Number(formData.get("status") ?? 1);

  if (!address) return { status: "error", message: "Address is required." };
  if (!issue) return { status: "error", message: "Describe the issue." };

  const supabase = createAdminClient();
  const { data: created, error } = await supabase
    .from("board_tasks")
    .insert({
      address,
      homeowner: homeowner || null,
      issue,
      todo: todo || null,
      notes: notes || null,
      status,
      closed_at: isOpen(status) ? null : new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !created) {
    return { status: "error", message: "Couldn't add that item." };
  }

  await supabase.from("board_task_events").insert({
    task_id: created.id,
    from_status: null,
    to_status: status,
    note: "Item raised",
    changed_by: admin.id,
    changed_by_name: admin.full_name,
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return { status: "ok", message: "Item added." };
}

export async function updateTask(
  _prev: TaskState,
  formData: FormData
): Promise<TaskState> {
  const admin = await getCurrentProfile();
  if (!admin?.is_admin) return { status: "error", message: "Not authorized." };

  const id = String(formData.get("id") ?? "");
  const status = Number(formData.get("status") ?? 1);
  const todo = String(formData.get("todo") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("board_tasks")
    .select("status")
    .eq("id", id)
    .single();

  if (!existing) return { status: "error", message: "Item not found." };

  const statusChanged = existing.status !== status;

  const { error } = await supabase
    .from("board_tasks")
    .update({
      status,
      todo: todo || null,
      notes: notes || null,
      updated_at: new Date().toISOString(),
      // Stamp the close date the first time it leaves an open state, and
      // clear it if the item is reopened.
      closed_at: isOpen(status) ? null : new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { status: "error", message: "Couldn't save that." };

  // Only record history when the status actually moved, or a note was added.
  // Otherwise editing a typo would clutter the timeline.
  if (statusChanged || note) {
    await supabase.from("board_task_events").insert({
      task_id: id,
      from_status: existing.status,
      to_status: status,
      note: note || null,
      changed_by: admin.id,
      changed_by_name: admin.full_name,
    });
  }

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return { status: "ok", message: "Updated." };
}

export async function deleteTask(
  _prev: TaskState,
  formData: FormData
): Promise<TaskState> {
  const admin = await getCurrentProfile();
  if (!admin?.is_admin) return { status: "error", message: "Not authorized." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("board_tasks")
    .delete()
    .eq("id", String(formData.get("id") ?? ""));

  if (error) return { status: "error", message: "Couldn't delete that." };

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return { status: "ok", message: "Item deleted." };
}
