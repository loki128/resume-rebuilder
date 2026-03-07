import { NextResponse } from "next/server";
import { rewriteResume, rewriteBullet } from "../../../lib/resumeRewriter";
import { rewriteWithLLM } from "../../../lib/ollamaRewriter";
import { rewriteWithOpenRouter } from "../../../lib/openRouterRewriter";
import { parseResume } from "../../../lib/parseResume";

const ENABLE_LLM = process.env.ENABLE_LLM === "true";
const LLM_PROVIDER = (process.env.LLM_PROVIDER || "openrouter").toLowerCase();

const BULLET_SECTION_NAMES = ["GENERAL", "PROJECTS", "EXPERIENCE"];

type ParsedForNormalize = { sections: { name: string; bullets: string[] }[]; sectionOrder: string[] };

/**
 * Normalize LLM rewrittenBullets into { PROJECTS?: string[], EXPERIENCE?: string[], GENERAL?: string[] }.
 * Handles: array of bullets, object with numeric keys, object with section names, nested arrays.
 * For flat arrays, maps bullets to parsed sections in original parsed order.
 * If the model returns one section with too many bullets, redistributes by parsed section counts.
 */
function normalizeRewrittenBullets(
  raw: unknown,
  parsed: ParsedForNormalize
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const bulletSections = parsed.sections.filter((s) =>
    BULLET_SECTION_NAMES.includes(s.name.toUpperCase())
  );
  const sectionOrder = bulletSections.map((s) => s.name);
  const totalParsedBullets = bulletSections.reduce((n, s) => n + s.bullets.length, 0);

  // Collect a flat list of bullet strings from various LLM shapes
  let flatBullets: string[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") flatBullets.push(item.trim());
      else if (Array.isArray(item)) flatBullets.push(...item.filter((x): x is string => typeof x === "string").map((s) => s.trim()));
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const keys = Object.keys(obj);
    const allNumeric = keys.length > 0 && keys.every((k) => /^\d+$/.test(k));
    if (allNumeric) {
      const sorted = keys.map(Number).sort((a, b) => a - b);
      for (const k of sorted) {
        const v = obj[String(k)];
        if (typeof v === "string") flatBullets.push(v.trim());
        else if (Array.isArray(v)) flatBullets.push(...v.filter((x): x is string => typeof x === "string").map((s) => s.trim()));
      }
    } else {
      const allowedNames = new Set(sectionOrder.map((n) => n.toUpperCase()));
      for (const k of keys) {
        const upper = k.toUpperCase();
        if (!BULLET_SECTION_NAMES.includes(upper) || !allowedNames.has(upper)) continue;
        const v = obj[k];
        const arr = Array.isArray(v)
          ? v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean)
          : typeof v === "string" && v.trim()
            ? [v.trim()]
            : [];
        if (arr.length) out[upper] = arr;
      }
      // Redistribute: if only one section key but array length >= total parsed bullets, split across sections
      if (Object.keys(out).length === 1) {
        const onlyKey = Object.keys(out)[0];
        const arr = out[onlyKey];
        if (arr.length >= totalParsedBullets && totalParsedBullets > 0) {
          let idx = 0;
          const newOut: Record<string, string[]> = {};
          for (const sec of bulletSections) {
            const count = sec.bullets.length;
            if (count === 0) continue;
            const slice = arr.slice(idx, idx + count).filter(Boolean);
            if (slice.length) newOut[sec.name] = slice;
            idx += count;
          }
          if (Object.keys(newOut).length > 0) return newOut;
        }
      }
      if (Object.keys(out).length > 0) return out;
    }
  }

  // If we have a flat list, assign bullets to sections in parsed order by bullet count
  if (flatBullets.length > 0 && sectionOrder.length > 0) {
    let idx = 0;
    for (const sec of bulletSections) {
      const count = sec.bullets.length;
      if (count === 0) continue;
      const slice = flatBullets.slice(idx, idx + count).filter(Boolean);
      if (slice.length) out[sec.name] = slice;
      idx += count;
    }
  }

  return out;
}

const SKILL_GROUP_KEYS = ["Languages", "Frameworks", "Tools", "Platforms", "Concepts"] as const;
const JUNK_SKILL_FRAGMENTS = new Set(["functional", "collaborating", "development"]);

/** Normalize one skill label: Node -> Node.js; REST -> REST APIs; API/APIs stay unless merged later; drop junk. */
function normalizeSkillLabel(s: string): string {
  const t = (s || "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (JUNK_SKILL_FRAGMENTS.has(lower)) return "";
  if (lower === "node") return "Node.js";
  if (lower === "rest") return "REST APIs";
  if (lower === "apis") return "APIs";
  if (lower === "api") return "API";
  return t;
}

/** Normalize and dedupe a skill array; merge REST+API+APIs into one "REST APIs"; Node->Node.js; remove junk. */
function normalizeSkillArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  let hadREST = false;
  for (const s of arr) {
    const normalized = normalizeSkillLabel(s);
    if (!normalized) continue;
    if (normalized === "REST APIs") hadREST = true;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(normalized);
  }
  if (hadREST) {
    return out.filter(
      (x) => x.toLowerCase() !== "api" && x.toLowerCase() !== "apis"
    );
  }
  return out;
}

/** Apply skills normalization to a SkillGroups-like object. */
function normalizeSkills(sk: Record<string, string[]> | undefined): Record<string, string[]> {
  if (!sk || typeof sk !== "object") return { Languages: [], Frameworks: [], Tools: [], Platforms: [], Concepts: [] };
  const out: Record<string, string[]> = {};
  for (const k of SKILL_GROUP_KEYS) {
    out[k] = normalizeSkillArray(Array.isArray(sk[k]) ? sk[k] : []);
  }
  return out;
}

/** Ensure coreCompetencies is always a string[] for the UI. LLM may return a comma-separated string. */
function normalizeCoreCompetencies(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Build a single string of all final displayed content for keyword-used detection. */
function getFinalRenderedText(result: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof result.summary === "string") parts.push(result.summary);
  const cc = result.coreCompetencies;
  if (Array.isArray(cc)) parts.push(cc.join(" "));
  const rb = result.rewrittenBullets;
  if (rb && typeof rb === "object") {
    for (const bullets of Object.values(rb)) {
      if (Array.isArray(bullets)) parts.push(bullets.join(" "));
    }
  }
  const skills = result.skills;
  if (skills && typeof skills === "object") {
    for (const arr of Object.values(skills)) {
      if (Array.isArray(arr)) parts.push(arr.join(" "));
    }
  }
  return parts.join(" ").toLowerCase();
}

/** Recompute keywordsUsed and keywordsMissing from final rendered output only. */
function recomputeKeywordsReportFromOutput(result: Record<string, unknown>): void {
  const report = result.keywordsReport;
  if (!report || typeof report !== "object" || !Array.isArray((report as { keywordsDetected?: unknown }).keywordsDetected))
    return;
  const detected = (report as { keywordsDetected: string[] }).keywordsDetected;
  const text = getFinalRenderedText(result);
  const used = detected.filter((k) => text.includes(k.toLowerCase()));
  const missing = detected.filter((k) => !text.includes(k.toLowerCase())).slice(0, 25);
  (result.keywordsReport as { keywordsUsed: string[]; keywordsMissing: string[] }).keywordsUsed = used;
  (result.keywordsReport as { keywordsMissing: string[] }).keywordsMissing = missing;
}

/** If coreCompetencies is empty, fill with a short list from keywords (used first, then detected). */
function ensureCoreCompetenciesFromKeywords(
  result: Record<string, unknown>,
  maxItems = 8
): void {
  const cc = result.coreCompetencies;
  if (Array.isArray(cc) && cc.length > 0) return;
  const report = result.keywordsReport as { keywordsUsed?: string[]; keywordsDetected?: string[] } | undefined;
  const used = report?.keywordsUsed ?? [];
  const detected = report?.keywordsDetected ?? [];
  const source = used.length >= 2 ? used : detected;
  const skip = new Set(["engineer", "engineering", "developer", "development", "manager", "experience", "preferred"]);
  const list = source.filter((k) => k.length > 2 && !skip.has(k.toLowerCase())).slice(0, maxItems);
  if (list.length) result.coreCompetencies = list;
}

function isSkillsEmpty(sk: Record<string, string[]> | undefined): boolean {
  if (!sk || typeof sk !== "object") return true;
  const keys = ["Languages", "Frameworks", "Tools", "Platforms", "Concepts"];
  return keys.every((k) => !Array.isArray(sk[k]) || sk[k].length === 0);
}

/** Fill any section that has parsed bullets but no (or empty) rewritten bullets with rule-based rewrites. */
function fillMissingRewrittenSections(
  rewrittenBullets: Record<string, string[]>,
  parsed: { sections: { name: string; bullets: string[] }[] },
  strictTruthMode: boolean
): void {
  const bulletSections = parsed.sections.filter((s) =>
    BULLET_SECTION_NAMES.includes(s.name.toUpperCase())
  );
  for (const sec of bulletSections) {
    if (sec.bullets.length === 0) continue;
    const existing = rewrittenBullets[sec.name] ?? rewrittenBullets[sec.name.toUpperCase()];
    if (existing && existing.length >= sec.bullets.length) continue;
    const sectionIndex = parsed.sections.findIndex((s) => s.name === sec.name);
    const baseIdx = sectionIndex >= 0 ? sectionIndex * 100 : 0;
    const filled = sec.bullets
      .map((b, i) => rewriteBullet(b, baseIdx + i, strictTruthMode))
      .filter(Boolean);
    if (filled.length) rewrittenBullets[sec.name] = filled;
  }
}

/** Replace any LLM bullet that is identical to the original with rule-based rewrite (second pass). */
function replaceUnchangedBullets(
  rewrittenBullets: Record<string, string[]> | undefined,
  parsed: { sections: { name: string; bullets: string[] }[] },
  strictTruthMode: boolean
): void {
  if (!rewrittenBullets || typeof rewrittenBullets !== "object") return;
  for (const [secName, bullets] of Object.entries(rewrittenBullets)) {
    if (!Array.isArray(bullets)) continue;
    const origSection = parsed.sections.find((s) => s.name.toLowerCase() === secName.toLowerCase());
    const origBullets = origSection?.bullets ?? [];
    const sectionIndex = parsed.sections.findIndex((s) => s.name.toLowerCase() === secName.toLowerCase());
    const baseIdx = sectionIndex >= 0 ? sectionIndex * 100 : 0;
    for (let i = 0; i < bullets.length; i++) {
      const orig = origBullets[i]?.trim();
      if (orig !== undefined && bullets[i].trim() === orig) {
        const improved = rewriteBullet(origBullets[i], baseIdx + i, strictTruthMode);
        if (improved) bullets[i] = improved;
      }
    }
  }
}

export async function POST(req: Request) {
  console.log("enhance:start");

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    const jobTitle = body?.jobTitle || "";
    const jobDescription = body?.jobDescription || "";
    const resumeText = (body?.resumeText || "").trim();
    const strictTruthMode = body?.strictTruthMode !== false;

    if (resumeText.length < 20) {
      return NextResponse.json(
        { error: "Resume text too short (minimum 20 characters)." },
        { status: 400 }
      );
    }

    const parsed = parseResume(resumeText);
    const bulletSections = ["GENERAL", "PROJECTS", "EXPERIENCE"];
    const bulletCount = parsed.sections
      .filter((s) => bulletSections.includes(s.name.toUpperCase()))
      .reduce((n, s) => n + s.bullets.length, 0);

    const provider = ENABLE_LLM && (LLM_PROVIDER === "openrouter" || LLM_PROVIDER === "ollama") ? LLM_PROVIDER : "none";
    const modelUsed = provider === "openrouter" ? (process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini") : provider === "ollama" ? (process.env.OLLAMA_MODEL || "qwen2.5:1.5b") : "";
    console.log("LLM provider:", provider);
    if (provider !== "none") console.log(provider === "openrouter" ? "OpenRouter model:" : "Ollama model:", modelUsed);
    console.log("bulletCount:", bulletCount);

    const args = { jobTitle, jobDescription, resumeText, strictTruthMode };

    let result;
    if (bulletCount === 0) {
      result = await rewriteResume(args);
      (result as Record<string, unknown>).llmUsed = false;
      (result as Record<string, unknown>).llmError = "";
      (result as Record<string, unknown>).parsedMeta = {
        sectionsDetected: parsed.sectionOrder,
        bulletsCount: parsed.allBullets.length,
      };
      (result as Record<string, unknown>).coreCompetencies = normalizeCoreCompetencies((result as Record<string, unknown>).coreCompetencies);
      (result as Record<string, unknown>).skills = normalizeSkills(result.skills as Record<string, string[]>);
      (result as Record<string, unknown>).skillsSections = normalizeSkills(result.skillsSections as Record<string, string[]>);
      ensureCoreCompetenciesFromKeywords(result as Record<string, unknown>);
      recomputeKeywordsReportFromOutput(result as Record<string, unknown>);
      console.log("enhance: LLM skipped (bulletCount === 0), rule-based only");
      return NextResponse.json(result, { status: 200 });
    }

    const useLLM = ENABLE_LLM && (LLM_PROVIDER === "openrouter" || LLM_PROVIDER === "ollama");
    if (useLLM) {
      try {
        if (LLM_PROVIDER === "openrouter") {
          result = await rewriteWithOpenRouter(args);
        } else {
          result = await rewriteWithLLM(args);
        }
        const rawBullets = result.rewrittenBullets;
        const normalizedBullets = normalizeRewrittenBullets(rawBullets, parsed);
        result.rewrittenBullets = normalizedBullets;
        console.log("normalized rewrittenBullets =", normalizedBullets);
        replaceUnchangedBullets(result.rewrittenBullets, parsed, strictTruthMode);
        fillMissingRewrittenSections(result.rewrittenBullets, parsed, strictTruthMode);
        if (isSkillsEmpty(result.skills) || isSkillsEmpty(result.skillsSections)) {
          const ruleResult = await rewriteResume(args);
          result.skills = ruleResult.skills;
          result.skillsSections = ruleResult.skillsSections;
        }
        (result as Record<string, unknown>).llmUsed = true;
        (result as Record<string, unknown>).llmError = "";
        console.log("enhance: LLM succeeded, provider:", provider);
      } catch (llmErr) {
        const msg = llmErr instanceof Error ? llmErr.message : String(llmErr);
        console.warn("enhance: LLM failed, falling back to rule-based:", msg);
        result = await rewriteResume(args);
        (result as Record<string, unknown>).llmUsed = false;
        (result as Record<string, unknown>).llmError = msg;
        console.log("enhance: fallback used, llmError:", msg);
      }
    } else {
      result = await rewriteResume(args);
      (result as Record<string, unknown>).llmUsed = false;
      (result as Record<string, unknown>).llmError = "";
      console.log("enhance: rule-based only (ENABLE_LLM or LLM_PROVIDER=none)");
    }

    if (!("llmUsed" in (result as object))) (result as Record<string, unknown>).llmUsed = false;
    if (!("llmError" in (result as object))) (result as Record<string, unknown>).llmError = "";
    const parsedMeta = {
      sectionsDetected: parsed.sectionOrder,
      bulletsCount: parsed.allBullets.length,
    };
    (result as Record<string, unknown>).parsedMeta = parsedMeta;
    (result as Record<string, unknown>).coreCompetencies = normalizeCoreCompetencies((result as Record<string, unknown>).coreCompetencies);
    (result as Record<string, unknown>).skills = normalizeSkills(result.skills as Record<string, string[]>);
    (result as Record<string, unknown>).skillsSections = normalizeSkills(result.skillsSections as Record<string, string[]>);
    ensureCoreCompetenciesFromKeywords(result as Record<string, unknown>);
    recomputeKeywordsReportFromOutput(result as Record<string, unknown>);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in /api/enhance:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
