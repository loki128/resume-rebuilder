# resume-ai-enhancer — Quick Start

## What This Is

A clean, minimal foundation for an AI resume enhancement tool. **No AI logic yet** — just structure.

## What You Get

```
✅ Next.js 14 App Router setup
✅ TypeScript strict mode
✅ Tailwind CSS styling
✅ Clean component architecture
✅ API endpoint structure (/api/enhance)
✅ Placeholder response system
✅ Git history with logical commits
```

## Files Overview

### Core App
- **`app/page.tsx`** — Homepage with 3 inputs + toggle + button
- **`app/layout.tsx`** — Root layout wrapper
- **`app/api/enhance/route.ts`** — POST endpoint (placeholder response)

### Components (Reusable)
- **`components/InputBox.tsx`** — Textarea wrapper with label
- **`components/OutputBox.tsx`** — Display results (bullets, skills, keywords)
- **`components/EnhanceButton.tsx`** — Main CTA button
- **`components/SectionTabs.tsx`** — Tab navigation stub

### Utilities (Placeholder)
- **`lib/keywordExtractor.ts`** — Keyword parsing (dummy)
- **`lib/resumeRewriter.ts`** — Resume rewriting (dummy)

### Config
- **`tailwind.config.ts`** — Tailwind setup
- **`tsconfig.json`** — TypeScript strict config
- **`next.config.js`** — Next.js options
- **`postcss.config.js`** — PostCSS with Tailwind

## Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Test the UI
- Fill in Job Title, Job Description, Resume Text
- Toggle "Strict Truth Mode"
- Click "Enhance Resume"
- See placeholder JSON response in Results section

### 4. Replace Placeholder Logic

When ready to add AI:

1. **`lib/resumeRewriter.ts`** — Integrate LLM API (OpenAI, Claude, etc.)
2. **`lib/keywordExtractor.ts`** — Improve keyword matching
3. **`app/api/enhance/route.ts`** — Call your new functions instead of returning static response

### 5. Add Features

Current structure supports:
- ✅ Resume input (text)
- ✅ Job description input
- ✅ Settings toggle (Strict Truth Mode)
- ✅ Async API calls
- ✅ Results display

Easy to add:
- [ ] File upload (PDF/DOCX resume parsing)
- [ ] Multiple job comparisons
- [ ] Export to PDF/DOCX
- [ ] User accounts + history
- [ ] Real-time preview

## Git Commits

Clean history for reference:

```
b0dcea1 docs: Add comprehensive project README with overview and roadmap
2e2fa3c lib: Add placeholder utilities for keyword extraction and resume rewriting
fe5ecc0 api: Add /api/enhance POST endpoint with placeholder JSON response
fc46e6a feat: Build homepage with form UI, inputs, and results section
044d2db feat: Create reusable UI components (InputBox, OutputBox, EnhanceButton, SectionTabs)
63b287f style: Setup Tailwind CSS and PostCSS configuration with global styles
c67cabb chore: Initial project setup with Next.js 14, TypeScript, and Tailwind CSS config
```

## Styling Notes

- **Layout:** Centered form (max-width 3xl) on gray background
- **Colors:** Indigo primary, gray accents
- **Inputs:** Tailwind textarea with focus ring
- **Buttons:** Indigo background with hover state
- **Results:** Card-based with sections for bullets, skills, keywords

## Architecture Decision

### Why This Structure?

1. **Components** — Reusable across pages
2. **Lib utilities** — Easy to swap out implementation
3. **API route** — Backend placeholder ready for real logic
4. **Tailwind** — Minimal, utility-first styling
5. **TypeScript** — Strict type safety from day one

### Separation of Concerns

```
UI (components) → State (page.tsx) → API (route.ts) → Logic (lib/*.ts)
```

No circular dependencies. Easy to test each layer.

## Common Tasks

### Add a new input field
```tsx
// app/page.tsx
const [newField, setNewField] = useState("");

<InputBox 
  label="New Field" 
  value={newField} 
  onChange={setNewField} 
/>
```

### Update API response
```ts
// app/api/enhance/route.ts
return NextResponse.json({
  // your response here
});
```

### Add a new component
```tsx
// components/NewComponent.tsx
export default function NewComponent() {
  return <div>...</div>;
}

// app/page.tsx
import NewComponent from "@/components/NewComponent";
```

### Customize styling
Edit `tailwind.config.ts` for theme, or add `@layer components` in `app/globals.css`.

## Production Ready?

**Not yet.** This is a foundation:
- ✅ Code structure
- ✅ Type safety
- ✅ Build configuration
- ❌ AI logic
- ❌ Error handling
- ❌ Loading states
- ❌ Input validation
- ❌ Security (rate limiting, auth)

## Resources

- [Next.js Docs](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [resume-rebuilder](https://github.com/loki128/resume-rebuilder) — Reference implementation

---

**Ready to build?** Start with replacing the placeholder logic in `lib/resumeRewriter.ts`.
