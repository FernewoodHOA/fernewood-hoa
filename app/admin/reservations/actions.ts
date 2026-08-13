"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/server";
import { sendBoardEmail } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/reservations";

export type DecisionState = { status: "idle" | "ok" | "error"; message?: string };

async function decide(
  id: string,
  status: "approved" | "declined",
  note: string
): Promise<DecisionState> {
  const reviewer = await getCurrentProfile();
  if (!reviewer?.is_admin) {
    return { status: "error", message: "Not authorized." };
  }

  const supabase = createAdminClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, profile_id, requester_name, event_date, starts_at, ends_at, purpose, status")
    .eq("id", id)
    .single();

  if (!reservation) return { status: "error", message: "Request not found." };
  if (reservation.status !== "pending") {
    return { status: "error", message: "That request was already decided." };
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      status,
      reviewed_by: reviewer.id,
      reviewed_at: new Date().toISOString(),
      review_note: note || null,
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) {
    // 23P01 is the exclusion constraint: another approved booking now covers
    // this slot. Say so plainly rather than showing a database error.
    if (error.code === "23P01") {
      return {
        status: "error",
        message:
          "Can't approve — the pavilion is already booked for an overlapping " +
          "time that day. Decline this one and ask them to pick another slot.",
      };
    }
    return { status: "error", message: "Couldn't update that request." };
  }

  const { data: requester } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", reservation.profile_id)
    .single();

  if (requester?.email) {
    const when = `${formatDate(reservation.event_date)}, ${formatTime(reservation.starts_at)} – ${formatTime(reservation.ends_at)}`;
    await sendBoardEmail({
      to: [requester.email],
      subject:
        status === "approved"
          ? `Pavilion reserved: ${when}`
          : `About your pavilion request for ${formatDate(reservation.event_date)}`,
      text:
        status === "approved"
          ? [
              `Hello ${reservation.requester_name},`,
              "",
              "Your park pavilion reservation has been approved:",
              "",
              `  ${when}`,
              `  ${reservation.purpose}`,
              "",
              "It now shows on the pavilion calendar for other residents.",
              "If your plans change, please cancel it so someone else can use",
              "the space: https://www.fernewood.org/portal/pavilion",
              "",
              "— Fernewood Homeowners Association",
            ].join("\n")
          : [
              `Hello ${reservation.requester_name},`,
              "",
              `The Board wasn't able to approve your pavilion request for ${when}.`,
              ...(note ? ["", `Reason given: ${note}`] : []),
              "",
              "You're welcome to request a different date or time, or get in",
              "touch if you think this was a mistake:",
              "",
              "  https://www.fernewood.org/contact",
              "",
              "— Fernewood Homeowners Association",
            ].join("\n"),
    });
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/portal/pavilion");
  return {
    status: "ok",
    message: status === "approved" ? "Reservation approved." : "Request declined.",
  };
}

export async function approveReservation(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  return decide(String(formData.get("id") ?? ""), "approved", "");
}

export async function declineReservation(
  _prev: DecisionState,
  formData: FormData
): Promise<DecisionState> {
  return decide(
    String(formData.get("id") ?? ""),
    "declined",
    String(formData.get("review_note") ?? "").trim()
  );
}
