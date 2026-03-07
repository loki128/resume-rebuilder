/**
 * Shared LLM prompt and types for resume enhancement.
 * Used by both OpenRouter and Ollama providers.
 */

export type RewriteArgs = {
  jobTitle?: string;
  jobDescription?: string;
  resumeText?: string;
  strictTruthMode?: boolean;
};

export type SkillGroups = {
  Languages: string[];
  Frameworks: string[];
  Tools: string[];
  Platforms: string[];
  Concepts: string[];
};

export type RewriteOutput = {
  summary: string;
  coreCompetencies: string[];
  rewrittenBullets: Record<string, string[]>;
  skillsSections: SkillGroups;
  skills: SkillGroups;
  keywordsReport: {
    keywordsDetected: string[];
    keywordsUsed: string[];
    keywordsMissing: string[];
  };
  rulesReport: string[];
  parsedMeta: { sectionsDetected: string[]; bulletsCount: number };
  optionalPlaceholders?: string[];
};

const MAX_JD_CHARS = 600;
const MAX_RESUME_CHARS = 900;

function truncate(s: string, max: number): { text: string; truncated: boolean } {
  const t = (s || "").trim();
  if (t.length <= max) return { text: t, truncated: false };
  return { text: t.slice(0, max).trim() + "\n[...truncated]", truncated: true };
}

export function buildResumeRewritePrompt(args: RewriteArgs): string {
  const { jobTitle, jobDescription, resumeText, strictTruthMode } = args;
  const jd = truncate(jobDescription || "", MAX_JD_CHARS);
  const resume = truncate(resumeText || "", MAX_RESUME_CHARS);
  return `You are a resume enhancer. Rewrite every bullet so it is stronger, clearer, and more ATS-friendly. Never return a bullet unchanged.

Strengthening rules:
- Weak or vague bullets (e.g. "Worked on", "Helped with", "Did debugging") must be expanded with stronger technical wording. Preserve the original facts but improve specificity.
- You may use technologies, tools, and skills that are already mentioned elsewhere in the resume when strengthening a bullet. Do not add technologies that do not appear in the resume.
- Example: "Helped maintain internal tools and fix bugs" → "Maintained internal web tools and resolved software defects by debugging JavaScript code and collaborating with senior developers."
- Every bullet: max 22 words. Format: ActionVerb + WhatWasDone + Context. Use strong action verbs (Maintained, Resolved, Developed, Built, Debugged, etc.). Preserve specific context from the original (e.g. "for internal tools", "with the backend team")—do not drop details that add substance.

Strict truth (do not break these):
- No invented companies, job titles, or employers.
- No invented technologies or tools that are not in the resume.
- No fake metrics or numbers (e.g. "increased by 50%" unless the resume states it).
- No fabricated experience or responsibilities.
- Only rephrase and expand using facts and technologies already present in the resume.

Job Title: ${(jobTitle || "(not provided)").slice(0, 80)}
Job Description:
${jd.text}

Resume:
${resume.text}

Strict Truth Mode: ${strictTruthMode !== false}

Return ONLY raw JSON. No markdown fences. No explanation text.
Keys: summary, coreCompetencies, rewrittenBullets (section names → string[]; every bullet must be strengthened, never copied), skillsSections (Languages,Frameworks,Tools,Platforms,Concepts), skills, keywordsReport (keywordsDetected,keywordsUsed,keywordsMissing), rulesReport, parsedMeta (sectionsDetected,bulletsCount).`;
}

/** Extract parseable JSON: support plain JSON, ```json fenced, or first "{" to last "}" */
export function extractJsonFromModel(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\s*```\s*$/, "").trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
  return s;
}
