import "server-only";

/**
 * Best-effort transactional email via Resend.
 *
 * Returns false rather than throwing when email isn't configured or the send
 * fails — callers are expected to have already stored the message durably, so
 * a delivery problem must never lose it or break the user's submission.
 */
export async function sendBoardEmail({
  subject,
  text,
  replyTo,
  to: toOverride,
}: {
  subject: string;
  text: string;
  replyTo?: string;
  /** Recipients. Defaults to the board (BOARD_EMAIL_TO) when omitted. */
  to?: string[];
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOARD_EMAIL_FROM;
  const to =
    toOverride && toOverride.length > 0
      ? toOverride
      : (process.env.BOARD_EMAIL_TO ?? "")
          .split(",")
          .map((address) => address.trim())
          .filter(Boolean);

  if (!apiKey || !from || to.length === 0) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
