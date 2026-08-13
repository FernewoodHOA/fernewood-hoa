"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendBoardEmail } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/reservations";

export type RequestState = {
  status: "idle" | "ok" | "error";
  message?: string;
};

export async function requestReservation(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const eventDate = String(formData.get("event_date") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim();
  const headcountRaw = String(formData.get("headcount") ?? "").trim();

  if (!eventDate) return { status: "error", message: "Pick a date." };
  if (!startsAt || !endsAt)
    return { status: "error", message: "Pick a start and end time." };
  if (endsAt <= startsAt)
    return { status: "error", message: "The end time must be after the start time." };
  if (!purpose)
    return { status: "error", message: "Tell the board what it's for." };

  const supabase = createAdminClient();

  // Warn about a clash up front rather than letting the board discover it.
  // The database's exclusion constraint is the real guarantee; this is just
  // a courtesy so the resident can pick another slot immediately.
  const { data: clashes } = await supabase
    .from("reservations")
    .select("starts_at, ends_at, requester_name")
    .eq("event_date", eventDate)
    .eq("status", "approved");

  const overlap = (clashes ?? []).find(
    (c) => startsAt < c.ends_at && endsAt > c.starts_at
  );
  if (overlap) {
    return {
      status: "error",
      message:
        `The pavilion is already booked that day from ` +
        `${formatTime(overlap.starts_at)} to ${formatTime(overlap.ends_at)}. ` +
        `Please choose a different time.`,
    };
  }

  const { error } = await supabase.from("reservations").insert({
    profile_id: profile.id,
    requester_name: profile.full_name,
    event_date: eventDate,
    starts_at: startsAt,
    ends_at: endsAt,
    purpose,
    headcount: headcountRaw ? Number(headcountRaw) : null,
  });

  if (error) {
    return { status: "error", message: "Couldn't submit that request." };
  }

  const origin = (await headers()).get("origin") ?? "https://www.fernewood.org";
  await sendBoardEmail({
    subject: `Pavilion request: ${profile.full_name}, ${formatDate(eventDate)}`,
    text: [
      "A resident has requested the park pavilion.",
      "",
      `Resident: ${profile.full_name}`,
      `Date:     ${formatDate(eventDate)}`,
      `Time:     ${formatTime(startsAt)} – ${formatTime(endsAt)}`,
      `Purpose:  ${purpose}`,
      headcountRaw ? `Expected: ${headcountRaw} people` : null,
      "",
      `Review it here: ${origin}/admin/reservations`,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  revalidatePath("/portal/pavilion");
  revalidatePath("/admin/reservations");
  return {
    status: "ok",
    message:
      "Request submitted. A board member will review it and you'll get an " +
      "email once it's decided.",
  };
}

export async function cancelReservation(
  _prev: RequestState,
  formData: FormData
): Promise<RequestState> {
  const profile = await getCurrentProfile();
  if (!profile) return { status: "error", message: "You're not signed in." };

  const id = String(formData.get("id") ?? "");
  const supabase = createAdminClient();

  // Scoped to the caller's own booking — an admin cancelling someone else's
  // goes through the admin screen, which records who did it.
  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("profile_id", profile.id);

  if (error) return { status: "error", message: "Couldn't cancel that." };

  revalidatePath("/portal/pavilion");
  revalidatePath("/admin/reservations");
  return { status: "ok", message: "Reservation cancelled." };
}
