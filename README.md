# resume-ai-enhancer

An AI-powered resume rewriting tool that tailors your resume to match specific job descriptions **without inventing facts**. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

`resume-ai-enhancer` helps job seekers optimize their existing resumes by:
- Extracting keywords from job descriptions
- Highlighting relevant skills and achievements
- Suggesting resume improvements while maintaining truthfulness
- Providing a keyword match report (matched/missing)
- Offering a Strict Truth Mode to ensure no fabrications

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **API:** REST API endpoints in `/api/enhance`

## Project Structure

```
resume-ai-enhancer/
├── app/
│   ├── page.tsx              # Homepage with UI form
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global Tailwind styles
│   └── api/
│       └── enhance/
│           └── route.ts      # POST endpoint for resume enhancement
├── components/
│   ├── InputBox.tsx          # Textarea input wrapper
│   ├── OutputBox.tsx         # Results display
│   ├── EnhanceButton.tsx     # Main CTA button
│   └── SectionTabs.tsx       # Tab navigation
├── lib/
│   ├── keywordExtractor.ts   # Keyword extraction logic
│   └── resumeRewriter.ts     # Resume rewriting logic
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── README.md
```

## Features

### Current (Foundation)
- ✅ Clean minimal UI with three text inputs
  - Job Title
  - Job Description
  - Resume Text
- ✅ Toggle for "Strict Truth Mode" (default: enabled)
- ✅ "Enhance Resume" button with POST request to `/api/enhance`
- ✅ Placeholder API response with structure:
  - Summary bullets
  - Skills list
  - Keywords report (matched/missing)
- ✅ Results section displaying API output

### Upcoming
- [ ] AI-powered resume rewriting using LLM API
- [ ] Keyword extraction and matching algorithm
- [ ] Factuality validation in Strict Truth Mode
- [ ] Resume section prioritization
- [ ] Downloadable enhanced resume (PDF/DOCX)
- [ ] Resume upload support
- [ ] Multiple job comparison

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository (or create new Next.js project)
git clone <repo-url>
cd resume-ai-enhancer

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Deploy

```bash
npm run build
npm start
```

## API Reference

### POST `/api/enhance`

Submits resume and job description for enhancement.

**Request:**
```json
{
  "jobTitle": "Senior Full Stack Engineer",
  "jobDescription": "We're looking for a full stack engineer...",
  "resumeText": "John Doe\nExperienced software engineer...",
  "strictTruthMode": true
}
```

**Response (Placeholder):**
```json
{
  "summaryBullets": [
    "Tailored summary for Senior Full Stack Engineer",
    "Focused on relevant achievements and metrics"
  ],
  "skills": ["JavaScript", "TypeScript", "React", "Next.js"],
  "keywordsReport": {
    "matchedKeywords": ["react", "next.js"],
    "missingKeywords": ["graphql"]
  },
  "meta": {
    "jobTitle": "Senior Full Stack Engineer",
    "strictTruthMode": true
  }
}
```

## Component Guide

### InputBox
Reusable textarea component with label and customizable rows.

```tsx
<InputBox 
  label="Resume Text" 
  value={resumeText} 
  onChange={setResumeText} 
  rows={6} 
/>
```

### OutputBox
Displays enhancement results with summary bullets, skills, and keyword report.

```tsx
<OutputBox data={results} />
```

### EnhanceButton
Main call-to-action button that triggers the API request.

### SectionTabs
Navigation tabs for future multi-section layout.

## Code Quality

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint ready
- **Formatting:** Tailwind best practices
- **Structure:** Modular, reusable components

## Git Commit History

```
Commits made in logical stages:
1. Initial project setup (Next.js, TypeScript, Tailwind)
2. Create component structure (InputBox, OutputBox, etc.)
3. Implement homepage form UI
4. Add API route with placeholder response
5. Create utility libraries (keywordExtractor, resumeRewriter)
6. Add configuration files and documentation
```

## Future Roadmap

- [ ] LLM integration (OpenAI, Claude, Cohere)
- [ ] Advanced NLP for keyword extraction
- [ ] Resume parsing from PDF/DOCX
- [ ] Fact-checking engine
- [ ] User authentication
- [ ] Resume history and versioning
- [ ] Analytics and metrics
- [ ] Export to multiple formats

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improvement`)
3. Make changes with clear commit messages
4. Submit a pull request

## License

MIT

---

**Note:** This is a foundation project. AI logic and advanced features will be implemented in subsequent phases.
