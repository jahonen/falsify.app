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
const BOLDNESS_RATING_GUIDE = defineSecret("BOLDNESS_RATING_GUIDE");
const RELEVANCE_RATING_GUIDE = defineSecret("RELEVANCE_RATING_GUIDE");

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

export const aiAnalyze = onRequest({ secrets: [GEMINI_MODEL_NAME, GEMINI_REGION, BOLDNESS_RATING_GUIDE, RELEVANCE_RATING_GUIDE], region: "us-central1", serviceAccount: "functions-runner@falsify-app.iam.gserviceaccount.com" }, async (req: any, res: any) => {
  const origin = (req.headers.origin as string | undefined) || "";
  const allow = /^http:\/\/localhost:(3000|3001)$/.test(origin) || origin === "https://falsify-app.web.app" || origin === "https://falsify-app.firebaseapp.com";
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
    const authz = req.headers.authorization || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
    if (!token) { res.status(401).send("Missing auth"); return; }
    await admin.auth().verifyIdToken(token);
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
    const compactMetrics = metrics.map(m => ({ metric: String(m.metric), operator: String(m.operator), target: String(m.target) }));
    const prompt = `Return only one minified JSON object with keys: boldness (1-100 integer), relevance (1-100 integer), notes (array of up to 4 short strings). No extra text, no code fences. Input: summary=${summary}; metrics=${JSON.stringify(compactMetrics)}; rationale=${(body.rationale || "").trim()}; timebox=${body.timeboxISO || ""}; taxonomy=${JSON.stringify(body.taxonomy || {})}`;
    const resp = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
    });
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
      const retryResp = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 3072, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
      });
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
        const secondResp = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: secondPrompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: "application/json", responseSchema: { type: "object", properties: { boldness: { type: "integer" }, relevance: { type: "integer" }, notes: { type: "array", items: { type: "string" } } }, required: ["boldness", "relevance"], additionalProperties: false } } as any
        });
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
