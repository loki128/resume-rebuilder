"use client";

import EnhanceButton from "../components/EnhanceButton";
import InputBox from "../components/InputBox";
import OutputBox from "../components/OutputBox";
import SectionTabs from "../components/SectionTabs";
import { useState } from "react";

export default function Home() {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [strictTruthMode, setStrictTruthMode] = useState(true);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setResults(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, jobDescription, resumeText, strictTruthMode }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `API error ${res.status}`);
        setResults(null);
        return;
      }
      setResults(data);
      setError(null);
      console.log("enhance:done");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold mb-2">resume-ai-enhancer</h1>
        <p className="text-sm text-gray-600 mb-6">
          Rewrite resumes to match job descriptions without inventing facts.
        </p>

        <SectionTabs />

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputBox label="Job Title" value={jobTitle} onChange={setJobTitle} rows={1} />
          <InputBox label="Job Description" value={jobDescription} onChange={setJobDescription} rows={4} />
          <InputBox label="Resume Text" value={resumeText} onChange={setResumeText} rows={6} />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={strictTruthMode}
                onChange={(e) => setStrictTruthMode(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">Strict Truth Mode</span>
            </label>

            <EnhanceButton type="submit" disabled={loading} />
          </div>
        </form>

        <div className="mt-8">
          <h2 className="text-lg font-medium mb-2">{loading ? 'Processing...' : 'Results'}</h2>
          {results?.llmUsed === false && results?.llmError && (
            <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mb-3 text-sm">
              LLM unavailable: {results.llmError}. Results use rule-based enhancement.
            </div>
          )}
          {results?.parsedMeta && (
            <div className="text-sm text-gray-600 mb-3">
              Detected {results.parsedMeta.bulletsCount} bullet{results.parsedMeta.bulletsCount === 1 ? '' : 's'} across sections: {Array.isArray(results.parsedMeta.sectionsDetected) ? results.parsedMeta.sectionsDetected.join(', ') : 'n/a'}
              {results.parsedMeta.bulletsCount < 3 && (
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                  Fewer than 3 bullets detected — consider adding more detailed experience bullets for better results.
                </div>
              )}
            </div>
          )}
          <OutputBox data={error ? { error } : results} />
        </div>
      </div>
    </div>
  );
}
