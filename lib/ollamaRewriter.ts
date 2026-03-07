/**
 * Ollama-based resume rewriter. Calls POST {OLLAMA_HOST}/api/generate when
 * LLM_PROVIDER=ollama. Uses shared prompt from llmPrompt.ts.
 */

import {
  RewriteArgs,
  RewriteOutput,
  buildResumeRewritePrompt,
  extractJsonFromModel,
} from "./llmPrompt";

export type { RewriteArgs, RewriteOutput, SkillGroups } from "./llmPrompt";

/** 20s default; fail fast. Override with OLLAMA_TIMEOUT_MS. At most 1 retry. */
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || "20000");
const OLLAMA_RETRIES = 1;

function getOllamaHost(): string {
  return (process.env.OLLAMA_HOST || "http://127.0.0.1:11435").replace(/\/$/, "");
}

function getOllamaEndpoint(): string {
  return `${getOllamaHost()}/api/generate`;
}

function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL || "qwen2.5:1.5b";
}

async function doOneRequest(
  endpoint: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Only call when LLM_PROVIDER=ollama. Logs OLLAMA_HOST and OLLAMA_MODEL. */
export async function rewriteWithLLM(args: RewriteArgs): Promise<RewriteOutput> {
  const resolvedHost = getOllamaHost();
  const resolvedModel = getOllamaModel();
  console.log("LLM provider: ollama");
  console.log("Ollama host:", resolvedHost, "model:", resolvedModel);

  const prompt = buildResumeRewritePrompt(args);
  const body = {
    model: resolvedModel,
    prompt,
    stream: false,
    options: { num_predict: 220, temperature: 0.2 },
  };
  const endpoint = getOllamaEndpoint();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= OLLAMA_RETRIES; attempt++) {
    try {
      const res = await doOneRequest(endpoint, body, OLLAMA_TIMEOUT_MS);
      if (!res.ok) {
        const text = await res.text();
        lastError = new Error(`Ollama request failed: ${res.status} ${res.statusText}. ${text.slice(0, 300)}`);
        console.error("[ollamaRewriter]", lastError.message);
        if (attempt < OLLAMA_RETRIES) await sleep(2000);
        continue;
      }
      const raw = await res.json();
      const content = raw?.response ?? "";
      if (typeof content !== "string") {
        lastError = new Error("Ollama response missing response string");
        if (attempt < OLLAMA_RETRIES) await sleep(2000);
        continue;
      }
      let parsed: unknown;
      try {
        const jsonStr = extractJsonFromModel(content);
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        console.error("[ollamaRewriter] JSON parse failed. Raw (first 1500 chars):", String(content).slice(0, 1500));
        lastError = new Error(`Ollama response is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
        if (attempt < OLLAMA_RETRIES) await sleep(2000);
        continue;
      }
      if (!parsed || typeof parsed !== "object" || !("summary" in (parsed as object))) {
        lastError = new Error("Ollama response JSON missing required fields (e.g. summary)");
        if (attempt < OLLAMA_RETRIES) await sleep(2000);
        continue;
      }
      return parsed as RewriteOutput;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      const isTimeout = err.name === "AbortError" || (e as { code?: string })?.code === "ABORT_ERR";
      lastError = isTimeout ? new Error("Ollama timeout (no response in time)") : err;
      console.warn("[ollamaRewriter] attempt", attempt + 1, "failed:", lastError.message);
      if (attempt < OLLAMA_RETRIES) await sleep(2000);
    }
  }
  throw lastError ?? new Error("Ollama request failed after retries");
}
