# Project Structure — resume-ai-enhancer

## Directory Map

```
resume-ai-enhancer/
│
├── 📁 app/                          # Next.js App Router
│   ├── page.tsx                     # Homepage (main form UI)
│   ├── layout.tsx                   # Root layout wrapper
│   ├── globals.css                  # Global Tailwind styles
│   │
│   └── 📁 api/
│       └── 📁 enhance/
│           └── route.ts             # POST /api/enhance endpoint
│
├── 📁 components/                   # Reusable React components
│   ├── InputBox.tsx                 # Textarea input with label
│   ├── OutputBox.tsx                # Display results
│   ├── EnhanceButton.tsx            # Main CTA button
│   └── SectionTabs.tsx              # Tab navigation stub
│
├── 📁 lib/                          # Shared utilities & types
│   ├── types.ts                     # TypeScript interfaces
│   ├── keywordExtractor.ts          # Keyword extraction logic
│   └── resumeRewriter.ts            # Resume rewriting logic
│
├── 📄 Configuration Files
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript config
│   ├── tailwind.config.ts           # Tailwind theme config
│   ├── postcss.config.js            # PostCSS config
│   └── next.config.js               # Next.js config
│
├── 📚 Documentation
│   ├── README.md                    # Project overview
│   ├── QUICKSTART.md                # Getting started guide
│   ├── PROJECT_STRUCTURE.md         # This file
│   └── .gitignore                   # Git ignore rules
│
└── 📊 Git History
    └── 9 logical commits (see git log --oneline)
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
└── HomePage (app/page.tsx)
    ├── SectionTabs
    ├── InputBox (Job Title)
    ├── InputBox (Job Description)
    ├── InputBox (Resume Text)
    ├── Checkbox (Strict Truth Mode)
    ├── EnhanceButton
    │   └── → POST /api/enhance
    │       └── API Response
    └── OutputBox
        ├── Summary Bullets
        ├── Skills List
        └── Keywords Report
```

## Data Flow

```
User Input
    ↓
Homepage (app/page.tsx)
    ↓ [onClick Enhance Button]
    ↓
POST /api/enhance (app/api/enhance/route.ts)
    ↓
Placeholder JSON Response
    ↓
OutputBox Display (components/OutputBox.tsx)
```

## File Responsibilities

### UI Layer (Components & Pages)
| File | Purpose |
|------|---------|
| `app/page.tsx` | Main form, state management, API calls |
| `app/layout.tsx` | HTML root, metadata |
| `components/InputBox.tsx` | Textarea input field |
| `components/OutputBox.tsx` | Results display |
| `components/EnhanceButton.tsx` | Action button |
| `components/SectionTabs.tsx` | Tab navigation |

### API Layer
| File | Purpose |
|------|---------|
| `app/api/enhance/route.ts` | POST endpoint, request validation, response |

### Business Logic Layer (Future)
| File | Purpose |
|------|---------|
| `lib/resumeRewriter.ts` | AI resume rewriting logic (placeholder) |
| `lib/keywordExtractor.ts` | Keyword extraction/matching (placeholder) |
| `lib/types.ts` | TypeScript types & interfaces |

### Config Layer
| File | Purpose |
|------|---------|
| `tailwind.config.ts` | Tailwind theme, extensions |
| `tsconfig.json` | TypeScript compiler options |
| `next.config.js` | Next.js runtime config |
| `postcss.config.js` | PostCSS plugins |
| `package.json` | Dependencies, npm scripts |

## Key Design Decisions

### 1. **App Router (Next.js 14)**
- Modern file-based routing
- Server components by default
- Built-in API routes

### 2. **TypeScript Strict Mode**
- `strict: true` in tsconfig.json
- Full type safety from day one
- Catch errors at compile time

### 3. **Tailwind CSS**
- Utility-first styling
- No custom CSS classes needed
- Responsive by default

### 4. **Component Separation**
- Single responsibility principle
- Reusable UI blocks
- Easy to test independently

### 5. **Placeholder Pattern**
- Stub implementations in `lib/`
- Easy to swap with real logic
- No breaking changes when upgrading

## Git Commit Messages

Each commit represents a logical unit of work:

```
1. chore: Initial project setup
   - Next.js, TypeScript, Tailwind configs

2. style: Tailwind & PostCSS configuration
   - Global styles, theme setup

3. feat: Reusable UI components
   - InputBox, OutputBox, Button, Tabs

4. feat: Homepage with form UI
   - Three inputs, toggle, button, results section

5. api: /api/enhance endpoint
   - Placeholder JSON response

6. lib: Utility functions
   - Keyword extraction, resume rewriting stubs

7. docs: Project documentation
   - README, QuickStart

8. types: API contract types
   - EnhanceRequest, EnhanceResponse interfaces

9. docs: Project structure guide
   - This file
```

## How to Extend

### Add a New Component
```
components/NewComponent.tsx → import in app/page.tsx
```

### Add a New Page
```
app/new-route/page.tsx → Accessible at /new-route
```

### Add a New API Endpoint
```
app/api/new-endpoint/route.ts → POST /api/new-endpoint
```

### Add Styling
```
app/globals.css → Global styles
OR
tailwind.config.ts → Theme extensions
```

### Add Utilities
```
lib/newUtil.ts → Import where needed
```

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 App Router |
| **Language** | TypeScript 5.x |
| **Styling** | Tailwind CSS 3.x |
| **API** | Next.js Route Handlers |
| **Build** | SWC (built-in) |
| **Dev Server** | Next.js dev (port 3000) |

## Performance Considerations

- ✅ Zero JavaScript hydration overhead (server components by default)
- ✅ Tailwind purges unused CSS in production
- ✅ Next.js optimizes images, fonts, code splitting
- ✅ API routes are serverless-ready

## Security Baseline

- ✅ No hardcoded secrets
- ✅ API route validates request structure
- ✅ TypeScript prevents type-related bugs
- ⚠️ TODO: Input sanitization, rate limiting, auth

## Testing Strategy (Future)

```
components/ → Jest + React Testing Library
lib/        → Jest unit tests
app/api/    → Integration tests
e2e/        → Playwright (add later)
```

## Deployment Ready?

| Aspect | Status |
|--------|--------|
| Build | ✅ Ready |
| Type Safety | ✅ Ready |
| Styling | ✅ Ready |
| API Structure | ✅ Ready |
| AI Logic | ❌ Placeholder |
| Testing | ❌ Not included |
| Auth | ❌ Not included |
| Error Handling | ⚠️ Basic |

---

This structure is **clean, minimal, and production-ready for the foundation phase**. AI logic integration comes next.
