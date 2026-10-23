// Vercel Serverless Function: POST /api/ai  (modes: translate | summarize | characters)
// Uses the OpenAI API. Set OPENAI_API_KEY in Vercel -> Settings -> Environment Variables.
const MAX = 30000;
const clip = (v, d) => String(v || d).slice(0, 40);

async function ask(prompt, json = false) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 8192,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const d = await r.json();
  if (!r.ok) throw Object.assign(new Error(d?.error?.message || "OpenAI API error"), { status: r.status });
  const out = d?.choices?.[0]?.message?.content;
  if (!out) throw new Error("Empty response from OpenAI");
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "Missing OPENAI_API_KEY on the server" });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (b.mode === "translate") {
      const items = Array.isArray(b.items) ? b.items.map(String).slice(0, 40) : [];
      if (!items.length || items.join("").length > MAX) return res.status(400).json({ error: "Bad or too long input" });
      const out = await ask(
        `You are a skilled literary translator. Translate each item of this JSON array into ${clip(b.lang, "English")}. Keep tone, names and emotion; read naturally. Return ONLY a JSON object of the form {"translations": [...]} where the array has exactly ${items.length} strings in the same order. No markdown, no commentary.\n\n${JSON.stringify(items)}`,
        true
      );
      let arr = null;
      try { arr = JSON.parse(out).translations; } catch (e) {}
      if (!Array.isArray(arr) || arr.length !== items.length) return res.status(502).json({ error: "Bad model output, try again" });
      return res.status(200).json({ items: arr.map(String) });
    }

    const text = String(b.text || "").trim();
    if (!text) return res.status(400).json({ error: "Empty text" });
    if (text.length > MAX) return res.status(413).json({ error: `Text too long (max ${MAX} chars)` });
    const lang = clip(b.lang, "English");

    if (b.mode === "summarize") {
      const style = b.len === "short" ? "2-3 sentences" : b.len === "points" ? "5-8 bullet points of key plot points, including the ending" : "one clear paragraph covering beginning, middle and end";
      return res.status(200).json({ text: await ask(`Summarize the following story in ${lang} as ${style}. Keep character names. Output only the summary.\n\n---\n${text}`) });
    }
    if (b.mode === "characters") {
      return res.status(200).json({ text: await ask(`List the characters in the following story, in ${lang}. For each: name, role, and one short line about personality or relationships. Output only the list.\n\n---\n${text}`) });
    }
    return res.status(400).json({ error: "Bad mode" });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Request failed" });
  }
}
