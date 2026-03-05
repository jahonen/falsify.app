import sgMail from "@sendgrid/mail";

type EmailInput = {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmailInternal(input: EmailInput): Promise<{ status: number; body?: string }> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY missing");
  }
  sgMail.setApiKey(apiKey);
  const fromEmail = input.from || "no-reply@falsify.app";
  const msg = {
    to: input.to,
    from: { email: fromEmail, name: "Falsify - Better Critical Thinking" },
    subject: input.subject,
    text: input.text,
    html: input.html
  } as any;
  const [resp] = await sgMail.send(msg, false);
  const bodyStr = typeof resp.body === "string" ? resp.body : JSON.stringify(resp.body ?? "");
  return { status: resp.statusCode, body: bodyStr };
}
