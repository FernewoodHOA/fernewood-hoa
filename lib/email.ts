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
  let to =
    toOverride && toOverride.length > 0
      ? toOverride
      : (process.env.BOARD_EMAIL_TO ?? "")
          .split(",")
          .map((address) => address.trim())
          .filter(Boolean);

  // Testing guard. While EMAIL_TEST_RECIPIENT is set, every outbound message
  // is redirected there instead of reaching real residents — including
  // announcement blasts, which otherwise address each resident directly and
  // bypass BOARD_EMAIL_TO entirely. Unset it to go live.
  const testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
  let redirectedFrom: string[] | null = null;
  if (testRecipient) {
    redirectedFrom = to;
    to = [testRecipient];
  }

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
        subject: redirectedFrom ? `[TEST] ${subject}` : subject,
        // Make the redirect obvious, and say who would really have got it —
        // otherwise a test blast looks indistinguishable from the real thing.
        text: redirectedFrom
          ? `[Testing mode — in production this would have gone to: ${redirectedFrom.join(", ")}]\n\n${text}`
          : text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
