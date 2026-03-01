import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { sendEmailInternal } from "./email";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const health = functions.https.onRequest((_: any, res: any) => {
  res.status(200).send("ok");
});

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const GEMINI_MODEL_NAME = defineSecret("GEMINI_MODEL_NAME");
const GEMINI_REGION = defineSecret("GEMINI_REGION");

export const emailTest = onRequest({ secrets: [SENDGRID_API_KEY], region: "us-central1" }, async (req: any, res: any) => {
  if (req.method !== "POST") {
    res.status(405).send("POST required");
    return;
  }
  if (!process.env.FUNCTIONS_EMULATOR) {
    res.status(403).send("Disabled in production");
    return;
  }
  try {
    const { to, subject, text, html } = (req.body ?? {}) as { to?: string; subject?: string; text?: string; html?: string };
    if (!to || (!text && !html)) {
      res.status(400).send("Missing to and content");
      return;
    }
    const result = await sendEmailInternal({
      to,
      from: "no-reply@falsify.app",
      subject: subject ?? "(no subject)",
      text,
      html
    });
    res.status(result.status).send(result.body ?? "sent");
  } catch (e: any) {
    res.status(500).send("send failed");
  }
});

export const aiConfig = onRequest({ secrets: [GEMINI_MODEL_NAME, GEMINI_REGION], region: "us-central1" }, async (req: any, res: any) => {
  if (req.method !== "GET") {
    res.status(405).send("GET required");
    return;
  }
  if (!process.env.FUNCTIONS_EMULATOR) {
    res.status(403).send("Disabled in production");
    return;
  }
  res.status(200).json({
    model: process.env.GEMINI_MODEL_NAME || null,
    region: process.env.GEMINI_REGION || null
  });
});

export const sendEmail = onRequest({ secrets: [SENDGRID_API_KEY], region: "us-central1", serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async (req: any, res: any) => {
  if (req.method !== "POST") {
    res.status(405).send("POST required");
    return;
  }
  try {
    const authz = req.headers.authorization || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) {
      res.status(401).send("Missing auth");
      return;
    }
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;
    const userRec = await admin.auth().getUser(uid);
    const email = userRec.email;
    if (!email) {
      res.status(400).send("No email on account");
      return;
    }
    const { subject, text, html, category } = (req.body ?? {}) as { subject?: string; text?: string; html?: string; category?: "own" | "news" };
    if (!subject || (!text && !html) || !category) {
      res.status(400).send("Missing subject/content/category");
      return;
    }
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    const consents = (snap.exists ? (snap.data() as any)?.consents : null) || {};
    const allow = category === "own" ? !!consents.ownContent : !!consents.news;
    if (!allow) {
      res.status(204).send("");
      return;
    }
    const consentUrl = "https://falsify.app/consent";
    const appendedText = `${text ?? ""}\n\n—\nManage your email settings: ${consentUrl}`.trim();
    const appendedHtml = `${html ?? ""}${html ? "<hr/>" : ""}<p>Manage your email settings: <a href=\"${consentUrl}\">${consentUrl}</a></p>`;
    const result = await sendEmailInternal({
      to: email,
      from: "no-reply@falsify.app",
      subject,
      text: text ? appendedText : undefined,
      html: appendedHtml
    });
    res.status(result.status).send(result.body ?? "sent");
  } catch (e: any) {
    res.status(500).send("send failed");
  }
});
