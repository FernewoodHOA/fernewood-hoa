"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAddress } from "@/lib/address";

export type ApplyState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"fullName" | "address" | "email", string>>;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitApplication(
  _prev: ApplyState,
  formData: FormData
): Promise<ApplyState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  const fieldErrors: ApplyState["fieldErrors"] = {};
  if (!fullName) fieldErrors.fullName = "Please enter your name.";
  if (!address) fieldErrors.address = "Please enter your Fernewood address.";
  if (!email) fieldErrors.email = "Please enter an email address.";
  else if (!isEmail(email)) fieldErrors.email = "That email doesn't look right.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors };
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return {
      status: "error",
      message:
        "The portal isn't accepting applications yet. Please try again later.",
    };
  }

  // Match against the roster so the board sees a verification signal.
  // Done here, server-side, so the browser can't forge the match.
  const { data: residents, error: rosterError } = await supabase
    .from("residents")
    .select("id, address");

  if (rosterError) {
    return {
      status: "error",
      message: "Something went wrong submitting your application.",
    };
  }

  const target = normalizeAddress(address);
  const match = (residents ?? []).find(
    (r) => normalizeAddress(r.address ?? "") === target
  );

  const { error } = await supabase.from("applications").insert({
    full_name: fullName,
    address,
    email,
    phone: phone || null,
    note: note || null,
    matched_resident_id: match?.id ?? null,
  });

  if (error) {
    // The partial unique index rejects a second pending application from the
    // same email; tell the applicant rather than showing a generic failure.
    if (error.code === "23505") {
      return {
        status: "error",
        message:
          "We already have a pending application for that email address. " +
          "The board will review it shortly.",
      };
    }
    return {
      status: "error",
      message: "Something went wrong submitting your application.",
    };
  }

  return {
    status: "success",
    message:
      "Thanks — your application has been submitted. A board member will " +
      "review it and you'll receive an email once your access is approved.",
  };
}
