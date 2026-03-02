import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { sendEmailInternal } from "./email";
import { VertexAI } from "@google-cloud/vertexai";
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

export const aiScore = onRequest({ secrets: [GEMINI_MODEL_NAME, GEMINI_REGION], region: "us-central1", serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async (req: any, res: any) => {
  const origin = (req.headers.origin as string | undefined) || "";
  const allow = /^http:\/\/localhost:(3000|3001)$/.test(origin) || origin === "https://falsify-app.web.app" || origin === "https://falsify-app.firebaseapp.com";
  if (allow) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
  }
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
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
    await admin.auth().verifyIdToken(token);
    const body = (req.body ?? {}) as {
      summary?: string;
      metric?: string;
      operator?: string;
      target?: string;
      referenceValue?: string;
      timeboxISO?: string;
      taxonomy?: { domain?: string; subcategory?: string; topic?: string };
    };
    const { summary, metric, operator, target } = body;
    if (!summary || !metric || !operator || !target) {
      res.status(400).send("Missing required fields");
      return;
    }
    const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const location = process.env.GEMINI_REGION || "us-central1";
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro";
    functions.logger.info("aiScore config", { project, location, modelName });
    const vertex = new VertexAI({ project: project as string, location });
    const model = vertex.getGenerativeModel({ model: modelName });
    const prompt = `You are scoring a prediction for a public prediction market app. Return STRICT JSON only with keys: plausibility (0-10 integer), vaguenessFlag (boolean), notes (array of 1-4 short strings). Do not include any other text.\n\nPrediction:\nsummary: ${summary}\nmetric: ${metric}\noperator: ${operator}\ntarget: ${body.target}\nreference: ${body.referenceValue || ""}\ntimebox: ${body.timeboxISO || ""}\ntaxonomy: ${JSON.stringify(body.taxonomy || {})}`;
    const resp = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 256, responseMimeType: "application/json" }
    });
    const text = resp.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    functions.logger.info("aiScore model output", { textLen: jsonText.length, preview: jsonText.slice(0, 200) });
    function tryParse(t: string): any {
      try { return JSON.parse(t); } catch {}
      const m = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*([\s\S]*?)```/i);
      if (m && m[1]) { try { return JSON.parse(m[1]); } catch {} }
      const brace = t.indexOf("{");
      const last = t.lastIndexOf("}");
      if (brace >= 0 && last > brace) { try { return JSON.parse(t.slice(brace, last + 1)); } catch {} }
      return null;
    }
    const parsed = (() => { try { return JSON.parse(jsonText); } catch (_) { return tryParse(jsonText); } })();
    const out = {
      plausibility: Math.max(0, Math.min(10, Number(parsed?.plausibility ?? 5))) | 0,
      vaguenessFlag: !!parsed?.vaguenessFlag,
      notes: Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 4).map((s: any) => String(s)).filter(Boolean) : []
    };
    res.status(200).json(out);
  } catch (e: any) {
    functions.logger.error("aiScore error", { message: e?.message, code: e?.code, details: e?.details, responseData: e?.response?.data, stack: e?.stack });
    res.status(500).json({ error: "ai score failed" });
  }
});

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
