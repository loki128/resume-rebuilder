export type ParsedResumeSection = {
  name: string;
  header: string;
  bullets: string[];
  lines: string[]; // raw lines (non-empty) within the section
};

export type ParsedResume = {
  sections: ParsedResumeSection[];
  allBullets: string[];
  sectionOrder: string[];
};

const HEADER_ALIASES: Record<string, string> = {
  summary: "SUMMARY",
  objective: "SUMMARY",
  experience: "EXPERIENCE",
  work: "EXPERIENCE",
  employment: "EXPERIENCE",
  projects: "PROJECTS",
  skills: "SKILLS",
  tech: "SKILLS",
  technologies: "SKILLS",
  education: "EDUCATION",
  certs: "CERTIFICATIONS",
  certifications: "CERTIFICATIONS",
  awards: "AWARDS",
};

const HEADER_REGEX = /^(summary|objective|experience|work|employment|projects|skills|tech|technologies|education|certs|certifications|awards)\b[:\-\s]*$/i;

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase();
  return HEADER_ALIASES[key] || h.trim().toUpperCase();
}

function isBullet(line: string): boolean {
  return /^\s*[-•]\s+/.test(line);
}

export function parseResume(resumeText?: string): ParsedResume {
  const text = (resumeText || "").replace(/\r\n?/g, "\n");
  const lines = text.split(/\n/);

  const sections: ParsedResumeSection[] = [];
  let current: ParsedResumeSection | null = null;

  const pushCurrent = () => {
    if (current) {
      // trim bullets and lines
      current.bullets = current.bullets.map((b) => b.replace(/^\s*[-•]\s+/, "").trim()).filter(Boolean);
      current.lines = current.lines.map((l) => l.trim()).filter(Boolean);
      sections.push(current);
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // Blank line → separate blocks; continue accumulating within section
    if (line.length === 0) {
      // treat as separator but don't force push; next header will push
      continue;
    }

    // Header detection
    if (HEADER_REGEX.test(line)) {
      // start a new section
      pushCurrent();
      const name = normalizeHeader(line.replace(/[:\-\s]+$/,'').trim());
      current = { name, header: name, bullets: [], lines: [] };
      continue;
    }

    // If no current section, create a default one
    if (!current) {
      current = { name: "GENERAL", header: "GENERAL", bullets: [], lines: [] };
    }

    if (isBullet(line)) {
      current.bullets.push(line);
    }

    // capture all non-empty lines
    current.lines.push(line);
  }

  // push last
  pushCurrent();

  // If nothing parsed, return default
  if (sections.length === 0) {
    return { sections: [{ name: "GENERAL", header: "GENERAL", bullets: [], lines: [] }], allBullets: [], sectionOrder: ["GENERAL"] };
  }

  // Remove duplicate sections (e.g. pasted resume twice): same name + same content = keep first only
  const seen = new Set<string>();
  const deduped: ParsedResumeSection[] = [];
  for (const s of sections) {
    const sig = `${s.name.toUpperCase()}\n${s.bullets.join("\n")}\n${s.lines.join("\n")}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    deduped.push(s);
  }

  const allBullets = deduped.flatMap((s) => s.bullets);
  const sectionOrder = deduped.map((s) => s.name);

  return { sections: deduped, allBullets, sectionOrder };
}
