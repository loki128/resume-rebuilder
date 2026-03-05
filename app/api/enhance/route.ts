import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { jobTitle, jobDescription, resumeText, strictTruthMode } = body;

  // Placeholder response — AI logic not implemented yet
  const response = {
    summaryBullets: [
      `Tailored summary for ${jobTitle || "[Job Title]"}`,
      "Focused on relevant achievements and metrics",
    ],
    skills: ["JavaScript", "TypeScript", "React", "Next.js"],
    keywordsReport: {
      matchedKeywords: ["React", "Next.js"],
      missingKeywords: ["GraphQL"],
    },
    meta: { jobTitle, strictTruthMode },
  };

  return NextResponse.json(response);
}
