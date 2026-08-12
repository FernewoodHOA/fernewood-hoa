"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendBoardEmail } from "@/lib/email";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

const MAX_MESSAGE = 5000;

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitInquiry(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: a hidden field real people never fill in. Bots do.
  // Report success so the bot doesn't learn to retry differently.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "success", message: "Thanks — your message has been sent." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!email) fieldErrors.email = "Please enter your email address.";
  else if (!isEmail(email)) fieldErrors.email = "That email doesn't look right.";
  if (!message) fieldErrors.message = "Please enter a message.";
  else if (message.length > MAX_MESSAGE)
    fieldErrors.message = "That message is too long.";

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
        "We can't accept messages right now. Please call the association " +
        "office at (337) 364-7221.",
    };
  }

  // Store first. Email is best-effort on top of a durable record, so a
  // delivery failure never loses the resident's message.
  const { data: inserted, error } = await supabase
    .from("board_inquiries")
    .insert({ name, email, subject: subject || null, message })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message:
        "Something went wrong sending your message. Please call the " +
        "association office at (337) 364-7221.",
    };
  }

  const emailed = await sendBoardEmail({
    subject: subject
      ? `Fernewood website: ${subject}`
      : `Fernewood website: message from ${name}`,
    text: [
      `From: ${name} <${email}>`,
      subject ? `Subject: ${subject}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
    replyTo: email,
  });

  if (emailed && inserted) {
    await supabase
      .from("board_inquiries")
      .update({ emailed: true })
      .eq("id", inserted.id);
  }

  return {
    status: "success",
    message:
      "Thanks — your message has been sent to the board. Someone will be " +
      "in touch.",
  };
}
