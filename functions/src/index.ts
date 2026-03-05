import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { sendEmailInternal } from "./email";
import { VertexAI } from "@google-cloud/vertexai";
import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentDeleted, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const health = functions.https.onRequest((_: any, res: any) => {
  res.status(200).send("ok");
});

const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const GEMINI_MODEL_NAME = defineSecret("GEMINI_MODEL_NAME");
const GEMINI_REGION = defineSecret("GEMINI_REGION");
const BOLDNESS_RATING_GUIDE = defineSecret("BOLDNESS_RATING_GUIDE");
const RELEVANCE_RATING_GUIDE = defineSecret("RELEVANCE_RATING_GUIDE");

export const aiScore = onRequest({ secrets: [GEMINI_MODEL_NAME, GEMINI_REGION], region: "us-central1", serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async (req: any, res: any) => {
  const origin = (req.headers.origin as string | undefined) || "";
  const allow =
    /^http:\/\/localhost:(3000|3001)$/.test(origin) ||
    origin === "https://falsify-app.web.app" ||
    origin === "https://falsify-app.firebaseapp.com" ||
    origin === "https://falsify.app" ||
    origin === "https://www.falsify.app";
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
    const model = vertex.getGenerativeModel({
      model: modelName,
      // Enforce JSON-only behavior
      systemInstruction: {
        role: "system",
        parts: [
          {
            text:
              "You are a JSON function. Always return a single valid JSON object that exactly matches the provided schema. Do not include ANY prose, explanations, markdown, or code fences. The first character must be '{' and the last must be '}'."
          }
        ]
      }
    } as any);
    const prompt = `Return only a single minified JSON object with keys: plausibility (0-10 integer), vaguenessFlag (boolean), notes (array of 1-4 short strings). No extra text, no code fences. Input: summary=${summary}; metric=${metric}; operator=${operator}; target=${body.target}; reference=${body.referenceValue || ""}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
    const resp = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 512, responseMimeType: "application/json", responseSchema: { type: "object", properties: { plausibility: { type: "integer" }, vaguenessFlag: { type: "boolean" }, notes: { type: "array", items: { type: "string" } } }, required: ["plausibility", "vaguenessFlag", "notes"], additionalProperties: false } } as any
    });
    const cand = resp.response?.candidates?.[0];
    const parts = cand?.content?.parts || [];
    functions.logger.info("aiScore candidate", { finishReason: cand?.finishReason, safetyRatings: cand?.safetyRatings });
    if (resp.response?.promptFeedback) {
      functions.logger.info("aiScore promptFeedback", resp.response.promptFeedback);
    }
    functions.logger.info("aiScore parts", { count: parts.length, kinds: parts.map((p: any) => (p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown"))) });
    parts.slice(0, 3).forEach((p: any, i: number) => {
      const kind = p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown");
      const prev = p?.text ? String(p.text).slice(0, 120) : (p?.inlineData?.data ? Buffer.from(p.inlineData.data, "base64").toString("utf8").slice(0, 120) : "");
      functions.logger.info("aiScore part preview", { i, kind, preview: prev });
    });
    let jsonText = "";
    for (const p of parts) {
      if (p?.inlineData?.mimeType === "application/json" && p?.inlineData?.data) {
        jsonText = Buffer.from(p.inlineData.data, "base64").toString("utf8");
        break;
      }
      if (p?.text) jsonText += p.text;
    }
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
    let parsed = (() => { try { return JSON.parse(jsonText); } catch (_) { return tryParse(jsonText); } })();
    if (parsed) {
      functions.logger.info("aiScore parsed", { parsed });
    }
    const needsRetry = !parsed || typeof parsed.plausibility === "undefined" || typeof parsed.vaguenessFlag === "undefined" || !Array.isArray(parsed.notes);
    if (needsRetry) {
      const retryPrompt = `Output only one minified JSON object exactly matching this schema and nothing else: {"plausibility": int (0-10), "vaguenessFlag": boolean, "notes": string[1..4]}. Input: summary=${summary}; metric=${metric}; operator=${operator}; target=${body.target}; reference=${body.referenceValue || ""}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
      const retryResp = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: "application/json", responseSchema: { type: "object", properties: { plausibility: { type: "integer" }, vaguenessFlag: { type: "boolean" }, notes: { type: "array", items: { type: "string" } } }, required: ["plausibility", "vaguenessFlag", "notes"], additionalProperties: false } } as any
      });
      const rcand = retryResp.response?.candidates?.[0];
      const rparts = rcand?.content?.parts || [];
      functions.logger.info("aiScore retry candidate", { finishReason: rcand?.finishReason, safetyRatings: rcand?.safetyRatings });
      if (retryResp.response?.promptFeedback) {
        functions.logger.info("aiScore retry promptFeedback", retryResp.response.promptFeedback);
      }
      functions.logger.info("aiScore retry parts", { count: rparts.length, kinds: rparts.map((p: any) => (p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown"))) });
      rparts.slice(0, 3).forEach((p: any, i: number) => {
        const kind = p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown");
        const prev = p?.text ? String(p.text).slice(0, 120) : (p?.inlineData?.data ? Buffer.from(p.inlineData.data, "base64").toString("utf8").slice(0, 120) : "");
        functions.logger.info("aiScore retry part preview", { i, kind, preview: prev });
      });
      let rjsonText = "";
      for (const p of rparts) {
        if (p?.inlineData?.mimeType === "application/json" && p?.inlineData?.data) {
          rjsonText = Buffer.from(p.inlineData.data, "base64").toString("utf8");
          break;
        }
        if (p?.text) rjsonText += p.text;
      }
      functions.logger.info("aiScore retry model output", { textLen: rjsonText.length, preview: rjsonText.slice(0, 200) });
      parsed = (() => { try { return JSON.parse(rjsonText); } catch (_) { return tryParse(rjsonText); } })();
      if (parsed) {
        functions.logger.info("aiScore retry parsed", { parsed });
      }
    }
    const out = {
      plausibility: Math.max(0, Math.min(10, Number(parsed?.plausibility ?? 5))) | 0,
      vaguenessFlag: !!parsed?.vaguenessFlag,
      notes: Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 4).map((s: any) => String(s)).filter(Boolean) : []
    };
    functions.logger.info("aiScore out", out);
    res.status(200).json(out);
  } catch (e: any) {
    functions.logger.error("aiScore error", { message: e?.message, code: e?.code, details: e?.details, responseData: e?.response?.data, stack: e?.stack });
    res.status(500).json({ error: "ai score failed" });
  }
});

// ----- Email digests: daily, weekly, monthly (summaries of unread notifications) -----
function renderDigestEmail(params: { cadence: "daily" | "weekly" | "monthly"; count: number; items: Array<{ type: string; text?: string; predictionId?: string }>; baseUrl?: string }) {
  const { cadence, count, items } = params;
  const baseUrl = params.baseUrl || "https://falsify.app";
  const title = `Your ${cadence} Falsify summary (${count} unread)`;
  const consentUrl = `${baseUrl}/consent`;
  const lines = items.slice(0, 10).map((n, i) => `• ${n.type === "comment" ? "Comment" : n.type === "term" ? "Prediction reached term" : n.type} ${n.text ? `– ${String(n.text).slice(0, 120)}` : ""}`);
  const text = [
    "Falsify",
    title,
    "",
    ...lines,
    "",
    `View all notifications: ${baseUrl}/notifications`,
    "",
    `Manage your email settings: ${consentUrl}`
  ].join("\n");
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><meta charSet="utf-8" />
  <title>${title}</title>
  <style>
    body{background:#f6f7fb;margin:0;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans','Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';color:#111827}
    .container{max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.08);overflow:hidden}
    .brand{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #e5e7eb;background:#0f172a;color:#fff}
    .brand img{width:28px;height:28px;border-radius:6px;background:#fff}
    .content{padding:20px}
    h1{font-size:18px;margin:0 0 12px 0}
    ul{padding-left:20px;margin:12px 0}
    li{margin:6px 0}
    .footer{padding:16px 20px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280}
    a{color:#2563eb;text-decoration:none}
  </style></head>
  <body>
   <div class="container">
     <div class="brand">
       <img src="${baseUrl}/android-chrome-192x192.png" alt="Falsify" />
       <strong>Falsify</strong>
     </div>
     <div class="content">
       <h1>${title}</h1>
       <p>Here are your latest unread notifications:</p>
       ${items.length ? `<ul>${lines.map(l => `<li>${l.replace(/^•\s*/, "")}</li>`).join("")}</ul>` : `<p>No new items.</p>`}
       <p><a href="${baseUrl}/notifications">View all notifications</a></p>
     </div>
     <div class="footer">
       You are receiving this email because you opted in to ${cadence} summaries. You can <a href="${consentUrl}">manage your email settings</a> anytime.
     </div>
   </div>
  </body></html>`;
  return { subject: title, text, html };
}

async function sendDigestForCadence(cadence: "daily" | "weekly" | "monthly") {
  const db = admin.firestore();
  const consentField = cadence === "daily" ? "consents.digestDaily" : cadence === "weekly" ? "consents.digestWeekly" : "consents.digestMonthly";
  const usersSnap = await db.collection("users").where(consentField, "==", true).limit(1000).get();
  functions.logger.info("digest users", { cadence, count: usersSnap.size });
  for (const u of usersSnap.docs) {
    const uid = u.id;
    const userData = (u.data() as any) || {};
    const email = userData.email || (await admin.auth().getUser(uid).then(r => r.email).catch(() => null));
    if (!email) continue;
    const notifsSnap = await db.collection("users").doc(uid).collection("notifications").where("read", "==", false).orderBy("createdAt", "desc").limit(50).get();
    const items = notifsSnap.docs.map(d => ({ type: String((d.data() as any)?.type || "notification"), text: (d.data() as any)?.text || "", predictionId: (d.data() as any)?.predictionId || undefined }));
    const count = notifsSnap.size;
    if (count < 1) continue;
    const { subject, text, html } = renderDigestEmail({ cadence, count, items });
    try {
      const result = await sendEmailInternal({ to: email, from: "no-reply@falsify.app", subject, text, html });
      functions.logger.info("digest sent", { cadence, uid, email, status: result.status, count });
    } catch (e: any) {
      functions.logger.error("digest send failed", { cadence, uid, email, message: e?.message });
    }
  }
}

export const sendDailyDigest = onSchedule({ schedule: "0 8 * * *", timeZone: "Etc/UTC", region: "us-central1", secrets: [SENDGRID_API_KEY] }, async () => {
  await sendDigestForCadence("daily");
});

export const sendWeeklyDigest = onSchedule({ schedule: "0 8 * * 1", timeZone: "Etc/UTC", region: "us-central1", secrets: [SENDGRID_API_KEY] }, async () => {
  await sendDigestForCadence("weekly");
});

export const sendMonthlyDigest = onSchedule({ schedule: "0 8 1 * *", timeZone: "Etc/UTC", region: "us-central1", secrets: [SENDGRID_API_KEY] }, async () => {
  await sendDigestForCadence("monthly");
});

// ----- Leaderboards v1: daily/weekly/monthly/all-time snapshots -----
function formatDateUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return { y, m, day, ymd: `${y}-${m}-${day}` };
}

function getWeekKeyUTC(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  const year = monday.getUTCFullYear();
  const oneJan = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((monday.getTime() - oneJan.getTime()) / 86400000) + oneJan.getUTCDay() + 1) / 7);
  return { year, week, key: `${year}-W${String(week).padStart(2, "0")}` };
}

async function computeAndWriteLeaderboards() {
  const db = admin.firestore();
  const now = new Date();
  const { ymd } = formatDateUTC(now);
  const { year, week, key: weekKey } = getWeekKeyUTC(now);
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const usersSnap = await db.collection("users").orderBy("reputation", "desc").limit(100).get();
  const top = usersSnap.docs.map((d, i) => {
    const u = (d.data() as any) || {};
    return {
      uid: d.id,
      rank: i + 1,
      score: Number(u.reputation || 0),
      displayName: u.displayName || null,
      avatarUrl: u.photoURL || null,
      followersCount: Number(u.followersCount || 0)
    };
  });

  const base = {
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    top,
    totalUsers: usersSnap.size
  } as any;

  const batch = db.batch();
  // Daily
  const dailyDoc = db.doc(`leaderboards/daily-${ymd}`);
  batch.set(dailyDoc, { ...base, period: "daily", periodKey: ymd });
  batch.set(db.doc("leaderboards/daily-latest"), { ...base, period: "daily", periodKey: ymd });
  // Weekly
  const weeklyDoc = db.doc(`leaderboards/weekly-${weekKey}`);
  batch.set(weeklyDoc, { ...base, period: "weekly", periodKey: weekKey, year, week });
  batch.set(db.doc("leaderboards/weekly-latest"), { ...base, period: "weekly", periodKey: weekKey, year, week });
  // Monthly
  const monthlyDoc = db.doc(`leaderboards/monthly-${monthKey}`);
  batch.set(monthlyDoc, { ...base, period: "monthly", periodKey: monthKey });
  batch.set(db.doc("leaderboards/monthly-latest"), { ...base, period: "monthly", periodKey: monthKey });
  // All-time
  const alltimeDoc = db.doc("leaderboards/all-time");
  batch.set(alltimeDoc, { ...base, period: "all-time", periodKey: "all-time" });

  await batch.commit();
  functions.logger.info("leaderboards computed", { top: top.length, daily: dailyDoc.id, weekly: weeklyDoc.id, monthly: monthlyDoc.id });
}

// Run daily at 00:10 UTC to refresh all periods
export const computeLeaderboardsDaily = onSchedule({ schedule: "10 0 * * *", timeZone: "Etc/UTC", region: "us-central1" }, async () => {
  try {
    await computeAndWriteLeaderboards();
  } catch (e) {
    functions.logger.error("computeLeaderboardsDaily failed", { message: (e as any)?.message });
  }
});

export const aiAnalyze = onRequest({ secrets: [GEMINI_MODEL_NAME, GEMINI_REGION, BOLDNESS_RATING_GUIDE, RELEVANCE_RATING_GUIDE], region: "us-central1", serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async (req: any, res: any) => {
  const origin = (req.headers.origin as string | undefined) || "";
  const allow =
    /^http:\/\/localhost:(3000|3001)$/.test(origin) ||
    origin === "https://falsify-app.web.app" ||
    origin === "https://falsify-app.firebaseapp.com" ||
    origin === "https://falsify.app" ||
    origin === "https://www.falsify.app";
  if (allow) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
  }
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).send("POST required"); return; }
  try {
    // Public endpoint (no auth), CORS-restricted to allowed origins
    const body = (req.body ?? {}) as {
      summary?: string;
      metrics?: Array<{ metric?: string; operator?: string; target?: string }>;
      rationale?: string;
      timeboxISO?: string;
      taxonomy?: { domain?: string; subcategory?: string; topic?: string };
    };
    const summary = body.summary?.trim() || "";
    const metrics = Array.isArray(body.metrics) ? body.metrics.filter(m => (m?.metric || "").trim() && (m?.operator || "").trim() && (m?.target || "").trim()).slice(0, 3) : [];
    if (!summary || metrics.length < 1) { res.status(400).send("Missing summary or metrics"); return; }
    const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const location = process.env.GEMINI_REGION || "us-central1";
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-pro";
    // Load guides from Secret Manager if present
    let guideText = ""; // boldness guide JSON string (minified)
    let relevanceGuideText = ""; // relevance guide JSON string (minified)
    try {
      const raw = process.env.BOLDNESS_RATING_GUIDE || "";
      if (raw) {
        try { guideText = JSON.stringify(JSON.parse(raw)); } catch { guideText = String(raw); }
      }
      const rraw = process.env.RELEVANCE_RATING_GUIDE || "";
      if (rraw) {
        try { relevanceGuideText = JSON.stringify(JSON.parse(rraw)); } catch { relevanceGuideText = String(rraw); }
      }
    } catch (_) { /* ignore */ }
    functions.logger.info("aiAnalyze config", { project, location, modelName, boldnessGuideLoaded: !!guideText, boldnessGuideLen: guideText.length, relevanceGuideLoaded: !!relevanceGuideText, relevanceGuideLen: relevanceGuideText.length });
    const vertex = new VertexAI({ project: project as string, location });
    const sysParts: Array<{ text: string }> = [
      { text: "You are a JSON function. Always return a single valid JSON object matching the provided schema. No prose, no markdown, no code fences. Output must start with '{' and end with '}'." },
    ];
    if (guideText) {
      sysParts.push({ text: `BOLDNESS_RATING_GUIDE_JSON=${guideText}` });
    }
    if (relevanceGuideText) {
      sysParts.push({ text: `RELEVANCE_RATING_GUIDE_JSON=${relevanceGuideText}` });
    }
    const model = vertex.getGenerativeModel({
      model: modelName,
      systemInstruction: { role: "system", parts: sysParts as any }
    } as any);
    async function callWithBackoff<T>(fn: () => Promise<T>, label: string): Promise<T> {
      let delay = 400;
      for (let i = 0; i < 3; i++) {
        try {
          return await fn();
        } catch (e: any) {
          const code = e?.code || e?.status || e?.response?.status;
          const msg = String(e?.message || "");
          const status = String(e?.status || e?.details || "");
          const is429 = code === 429 || /RESOURCE_EXHAUSTED/i.test(msg) || /Too Many Requests/i.test(msg);
          const retryable = is429 || /UNAVAILABLE|DEADLINE_EXCEEDED/i.test(status) || /ECONNRESET|ETIMEDOUT|ETIMEOUT|EAI_AGAIN/i.test(msg);
          if (i < 2 && retryable) {
            functions.logger.warn("aiAnalyze backoff", { label, attempt: i + 1, delayMs: delay, code, status, preview: msg.slice(0, 120) });
            await new Promise(r => setTimeout(r, delay));
            delay *= 2;
            continue;
          }
          throw e;
        }
      }
      return await fn();
    }
    const compactMetrics = metrics.map(m => ({ metric: String(m.metric), operator: String(m.operator), target: String(m.target) }));
    const prompt = `Return only one minified JSON object with keys: boldness (1-100 integer), relevance (1-100 integer), notes (array of up to 4 short strings). No extra text, no code fences. Input: summary=${summary}; metrics=${JSON.stringify(compactMetrics)}; rationale=${(body.rationale || "").trim()}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
    const resp = await callWithBackoff(() => model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
    }), "primary");
    const cand = resp.response?.candidates?.[0];
    const parts = cand?.content?.parts || [];
    functions.logger.info("aiAnalyze candidate", { finishReason: cand?.finishReason, safetyRatings: cand?.safetyRatings });
    if (resp.response?.promptFeedback) { functions.logger.info("aiAnalyze promptFeedback", resp.response.promptFeedback); }
    functions.logger.info("aiAnalyze parts", { count: parts.length, kinds: parts.map((p: any) => (p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown"))) });
    parts.slice(0, 3).forEach((p: any, i: number) => {
      const kind = p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown");
      const prev = p?.text ? String(p.text).slice(0, 120) : (p?.inlineData?.data ? Buffer.from(p.inlineData.data, "base64").toString("utf8").slice(0, 120) : "");
      functions.logger.info("aiAnalyze part preview", { i, kind, preview: prev });
    });
    let jsonText = "";
    for (const p of parts) {
      if (p?.inlineData?.mimeType === "application/json" && p?.inlineData?.data) { jsonText = Buffer.from(p.inlineData.data, "base64").toString("utf8"); break; }
      if (p?.text) jsonText += p.text;
    }
    functions.logger.info("aiAnalyze model output", { textLen: jsonText.length, preview: jsonText.slice(0, 200) });
    function tryParse(t: string): any {
      try { return JSON.parse(t); } catch {}
      const m = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*([\s\S]*?)```/i);
      if (m && m[1]) { try { return JSON.parse(m[1]); } catch {} }
      const brace = t.indexOf("{");
      const last = t.lastIndexOf("}");
      if (brace >= 0 && last > brace) { try { return JSON.parse(t.slice(brace, last + 1)); } catch {} }
      return null;
    }
    let parsed = (() => { try { return JSON.parse(jsonText); } catch (_) { return tryParse(jsonText); } })();
    let rtext = "";
    if (!parsed || typeof parsed.boldness === "undefined" || typeof parsed.relevance === "undefined") {
      const retryPrompt = `Output only one minified JSON object exactly matching this schema and nothing else: {"boldness": int (1-100), "relevance": int (1-100), "notes": string[0..4]}. Input: summary=${summary}; metrics=${JSON.stringify(compactMetrics)}; rationale=${(body.rationale || "").trim()}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
      const retryResp = await callWithBackoff(() => model.generateContent({
        contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 3072, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
      }), "retry1");
      const rc = retryResp.response?.candidates?.[0];
      const rp = rc?.content?.parts || [];
      functions.logger.info("aiAnalyze retry candidate", { finishReason: rc?.finishReason, safetyRatings: rc?.safetyRatings });
      if (retryResp.response?.promptFeedback) { functions.logger.info("aiAnalyze retry promptFeedback", retryResp.response.promptFeedback); }
      functions.logger.info("aiAnalyze retry parts", { count: rp.length, kinds: rp.map((p: any) => (p?.inlineData?.mimeType || (p?.text ? "text/plain" : "unknown"))) });
      for (const p of rp) { if (p?.inlineData?.mimeType === "application/json" && p?.inlineData?.data) { rtext = Buffer.from(p.inlineData.data, "base64").toString("utf8"); break; } if (p?.text) rtext += p.text; }
      functions.logger.info("aiAnalyze retry model output", { textLen: rtext.length, preview: rtext.slice(0, 200) });
      parsed = (() => { try { return JSON.parse(rtext); } catch (_) { return tryParse(rtext); } })();
      // Second ultra-strict retry if still not parsable
      if (!parsed || typeof parsed.boldness === "undefined" || typeof parsed.relevance === "undefined") {
        const secondPrompt = `Only output a single JSON object without any extra characters. Schema: {"boldness": integer 1-100, "relevance": integer 1-100, "notes": string[0..4]}. Do not include explanations or markdown. Input: summary=${summary}; metrics=${JSON.stringify(compactMetrics)}; rationale=${(body.rationale || "").trim()}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
        const secondResp = await callWithBackoff(() => model.generateContent({
          contents: [{ role: "user", parts: [{ text: secondPrompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
        }), "retry2");
        const sc = secondResp.response?.candidates?.[0];
        const sp = sc?.content?.parts || [];
        functions.logger.info("aiAnalyze second retry candidate", { finishReason: sc?.finishReason, safetyRatings: sc?.safetyRatings });
        let stext = "";
        for (const p of sp) { if (p?.inlineData?.mimeType === "application/json" && p?.inlineData?.data) { stext = Buffer.from(p.inlineData.data, "base64").toString("utf8"); break; } if (p?.text) stext += p.text; }
        functions.logger.info("aiAnalyze second retry model output", { textLen: stext.length, preview: stext.slice(0, 200) });
        parsed = (() => { try { return JSON.parse(stext); } catch (_) { return tryParse(stext); } })();
      }
    }
    const usedDefaults = !parsed || typeof parsed.boldness === "undefined" || typeof parsed.relevance === "undefined";
    if (usedDefaults) {
      functions.logger.info("aiAnalyze fallback", { reason: "parse_failed", initialPreviewLen: jsonText.length, retryPreviewLen: rtext.length });
    }
    const out = {
      boldness: Math.max(1, Math.min(100, Number(parsed?.boldness ?? 50))) | 0,
      relevance: Math.max(1, Math.min(100, Number(parsed?.relevance ?? 50))) | 0,
      notes: Array.isArray(parsed?.notes) ? parsed.notes.slice(0, 4).map((s: any) => String(s)).filter(Boolean) : [],
      fallbackUsed: usedDefaults
    } as any;
    functions.logger.info("aiAnalyze out", out);
    res.status(200).json(out);
  } catch (e: any) {
    const msg = String(e?.message || "");
    const code = e?.code || e?.status || e?.response?.status;
    const status = String(e?.status || e?.details || "");
    const is429 = code === 429 || /RESOURCE_EXHAUSTED/i.test(msg) || /Too Many Requests/i.test(msg);
    const transient = is429 || /UNAVAILABLE|DEADLINE_EXCEEDED/i.test(status);
    if (transient) {
      const out = { boldness: 50, relevance: 50, notes: [], fallbackUsed: true } as any;
      functions.logger.warn("aiAnalyze final fallback", { code, status, preview: msg.slice(0, 200) });
      res.status(200).json(out);
      return;
    }
    functions.logger.error("aiAnalyze error", { message: e?.message, code: e?.code, details: e?.details, responseData: e?.response?.data, stack: e?.stack });
    res.status(500).json({ error: "ai analyze failed" });
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

// Notifications: comment on your prediction
export const notifyOnComment = onDocumentCreated("predictions/{predictionId}/comments/{commentId}", async (event) => {
  try {
    const snap = event.data;
    if (!snap) return;
    const { predictionId } = event.params as { predictionId: string };
    const data = snap.data() as { userId?: string; text?: string } | undefined;
    if (!data) return;
    const db = admin.firestore();
    const pred = await db.doc(`predictions/${predictionId}`).get();
    if (!pred.exists) return;
    const authorId = (pred.data() as any)?.authorId as string | undefined;
    if (!authorId) return;
    // Skip self-notifications
    if (data.userId && data.userId === authorId) return;
    const text = (data.text || "").slice(0, 200);
    await db.collection("users").doc(authorId).collection("notifications").add({
      type: "comment",
      predictionId,
      commentId: snap.id,
      fromUserId: data.userId || null,
      text,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
  } catch (e) {
    functions.logger.error("notifyOnComment failed", { message: (e as any)?.message });
  }
});

// Notifications: prediction reached term (timebox)
export const notifyPredictionTerm = onSchedule({ schedule: "every 5 minutes", region: "us-central1", timeZone: "Etc/UTC", secrets: [SENDGRID_API_KEY], serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async () => {
  try {
    const db = admin.firestore();
    const now = new Date();
    functions.logger.info("notifyPredictionTerm start", { hasSendgridKey: !!process.env.SENDGRID_API_KEY, nowISO: now.toISOString() });
    // Query pending predictions; filter timebox/termNotified in code to avoid composite indexes
    const qs = await db
      .collection("predictions")
      .where("status", "==", "pending")
      .limit(500)
      .get();
    functions.logger.info("notifyPredictionTerm fetched", { count: qs.size });
    const batch = db.batch();
    let notifyCount = 0;
    const emailQueue: Array<{ authorId: string; predictionId: string }> = [];
    for (const doc of qs.docs) {
      const d = doc.data() as any;
      const tb = d?.timebox;
      let timeboxDate: Date | null = null;
      if (tb && typeof (tb as any)?.toDate === "function") {
        try { timeboxDate = (tb as any).toDate(); } catch { timeboxDate = null; }
      } else if (typeof tb === "string") {
        const dt = new Date(tb);
        if (!isNaN(dt.getTime())) timeboxDate = dt; else timeboxDate = null;
      }
      const authorId: string | undefined = d?.authorId;
      const termNotified: boolean = !!d?.termNotified;
      if (!timeboxDate || !authorId || termNotified) continue;
      // timebox reached
      if (timeboxDate.getTime() <= now.getTime()) {
        const notifRef = db.collection("users").doc(authorId).collection("notifications").doc();
        batch.set(notifRef, {
          type: "term",
          predictionId: doc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
        batch.update(doc.ref, { termNotified: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        emailQueue.push({ authorId, predictionId: doc.id });
        notifyCount++;
      }
    }
    if (notifyCount > 0) {
      await batch.commit();
    }
    // Send immediate emails to authors for reached-term predictions (best-effort)
    if (emailQueue.length > 0) {
      const baseUrl = process.env.PUBLIC_SITE_URL || "https://falsify.app";
      for (const item of emailQueue) {
        try {
          const userSnap = await db.collection("users").doc(item.authorId).get();
          const userData = (userSnap.data() as any) || {};
          const consent = (userData?.consents || {}) as any;
          // Optional consent gate: if user has explicitly disabled term emails, skip
          if (consent && consent.termImmediateEmail === false) continue;
          let email: string | null = userData.email || null;
          if (!email) {
            try { email = (await admin.auth().getUser(item.authorId)).email || null; } catch { email = null; }
          }
          if (!email) continue;
          const predictionUrl = `${baseUrl}/p/${encodeURIComponent(item.predictionId)}`;
          const subject = "Your prediction reached its deadline";
          const text = [
            "Your prediction on Falsify has reached its deadline.",
            "",
            `View it: ${predictionUrl}`
          ].join("\n");
          const html = `<!DOCTYPE html><html><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="background:#f6f7fb;margin:0;padding:24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',Arial,'Noto Sans'">
            <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(15,23,42,.08);overflow:hidden">
              <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #e5e7eb;background:#0f172a;color:#fff">
                <strong>Falsify</strong>
              </div>
              <div style="padding:20px">
                <h1 style="font-size:18px;margin:0 0 12px 0;color:#111827">Your prediction reached its deadline</h1>
                <p style="margin:8px 0 16px 0;color:#374151">Review the outcome and finalize a verdict.</p>
                <p style="margin:0 0 16px 0"><a href="${predictionUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">Open prediction</a></p>
                <p style="margin:0;color:#6b7280">If the button doesn't work, copy/paste this link:<br/><a href="${predictionUrl}">${predictionUrl}</a></p>
              </div>
            </div>
          </body></html>`;
          const result = await sendEmailInternal({ to: email, from: "no-reply@falsify.app", subject, text, html });
          functions.logger.info("term email sent", { authorId: item.authorId, predictionId: item.predictionId, status: result.status });
        } catch (e: any) {
          functions.logger.error("term email failed", { authorId: item.authorId, predictionId: item.predictionId, message: e?.message });
        }
      }
    }
    functions.logger.info("notifyPredictionTerm", { checked: qs.size, notified: notifyCount, emailed: emailQueue.length });
  } catch (e) {
    const err: any = e;
    functions.logger.error("notifyPredictionTerm failed", { message: err?.message, error: String(err), stack: err?.stack });
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

// Reputation v1: adjust author reputation on vote create/update
export const updateReputationOnVoteWrite = onDocumentWritten("predictions/{predictionId}/votes/{voterId}", async (event) => {
  try {
    const before = event.data?.before?.data() as any | undefined;
    const after = event.data?.after?.data() as any | undefined;
    const prevType = before?.type as ("calledIt" | "botched" | "fence" | string | undefined);
    const nextType = after?.type as ("calledIt" | "botched" | "fence" | string | undefined);
    const score = (t?: string) => (t === "calledIt" ? 1 : t === "botched" ? -1 : 0);
    const delta = score(nextType) - score(prevType);
    if (!delta) return;
    const { predictionId, voterId } = event.params as { predictionId: string; voterId: string };
    const db = admin.firestore();
    const predSnap = await db.doc(`predictions/${predictionId}`).get();
    if (!predSnap.exists) return;
    const authorId = (predSnap.data() as any)?.authorId as string | undefined;
    if (!authorId || authorId === voterId) return; // skip self-votes and missing author
    await db.doc(`users/${authorId}`).set({
      reputation: admin.firestore.FieldValue.increment(delta),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    functions.logger.info("updateReputationOnVoteWrite", { authorId, voterId, predictionId, delta, prevType, nextType });
  } catch (e) {
    functions.logger.error("updateReputationOnVoteWrite failed", { message: (e as any)?.message });
  }
});

// Follow graph counters: increment/decrement followersCount and followingCount
export const onFollowCreated = onDocumentCreated("users/{userId}/following/{targetId}", async (event) => {
  try {
    const { userId, targetId } = event.params as { userId: string; targetId: string };
    if (!userId || !targetId || userId === targetId) return;
    const db = admin.firestore();
    const batch = db.batch();
    const userRef = db.doc(`users/${userId}`);
    const targetRef = db.doc(`users/${targetId}`);
    batch.set(userRef, { followingCount: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    batch.set(targetRef, { followersCount: admin.firestore.FieldValue.increment(1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    functions.logger.info("onFollowCreated updated counters", { userId, targetId });
  } catch (e) {
    functions.logger.error("onFollowCreated failed", { message: (e as any)?.message });
  }
});

export const onFollowDeleted = onDocumentDeleted("users/{userId}/following/{targetId}", async (event) => {
  try {
    const { userId, targetId } = event.params as { userId: string; targetId: string };
    if (!userId || !targetId || userId === targetId) return;
    const db = admin.firestore();
    const batch = db.batch();
    const userRef = db.doc(`users/${userId}`);
    const targetRef = db.doc(`users/${targetId}`);
    batch.set(userRef, { followingCount: admin.firestore.FieldValue.increment(-1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    batch.set(targetRef, { followersCount: admin.firestore.FieldValue.increment(-1), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    functions.logger.info("onFollowDeleted updated counters", { userId, targetId });
  } catch (e) {
    functions.logger.error("onFollowDeleted failed", { message: (e as any)?.message });
  }
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
