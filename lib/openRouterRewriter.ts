/**
 * OpenRouter-based resume rewriter. Uses POST https://openrouter.ai/api/v1/chat/completions
 * and returns the same shape as the rule-based rewriter for UI compatibility.
 */

import {
  RewriteArgs,
  RewriteOutput,
  buildResumeRewritePrompt,
  extractJsonFromModel,
} from "./llmPrompt";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS || "30000");

export async function rewriteWithOpenRouter(args: RewriteArgs): Promise<RewriteOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  console.log("LLM provider: openrouter");
  console.log("OpenRouter model:", model);

  if (!apiKey || !apiKey.trim()) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const prompt = buildResumeRewritePrompt(args);
  const body = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stream: false,
    response_format: { type: "json_object" },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    const err = e instanceof Error ? e : new Error(String(e));
    const isTimeout = err.name === "AbortError" || (e as { code?: string })?.code === "ABORT_ERR";
    throw isTimeout ? new Error("OpenRouter timeout") : err;
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const text = await res.text();
    console.error("[openRouterRewriter] request failed:", res.status, text.slice(0, 300));
    throw new Error(`OpenRouter request failed: ${res.status} ${res.statusText}. ${text.slice(0, 200)}`);
  }

  const raw = await res.json();
  const content =
    (raw as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? "";

  if (typeof content !== "string") {
    throw new Error("OpenRouter response missing choices[0].message.content");
  }

  let parsed: unknown;
  try {
    const jsonStr = extractJsonFromModel(content);
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[openRouterRewriter] JSON parse failed. Raw (first 1500 chars):", String(content).slice(0, 1500));
    throw new Error(`OpenRouter response is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!parsed || typeof parsed !== "object" || !("summary" in (parsed as object))) {
    throw new Error("OpenRouter response JSON missing required fields (e.g. summary)");
  }

  return parsed as RewriteOutput;
}
