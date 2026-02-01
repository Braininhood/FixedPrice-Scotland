# Backend & Frontend Deployment Options

## Option 1: Next.js API Routes (Recommended for MVP)

**Single Deployment - Everything in Next.js**

### Architecture
- Frontend: Next.js pages/components
- Backend: Next.js API Routes (`app/api/` or `pages/api/`)
- Database: Supabase (external)
- Deployment: Vercel (one platform)

### Pros
- ✅ Single deployment (Vercel)
- ✅ No separate backend server to manage
- ✅ Simpler architecture
- ✅ Built-in API routing
- ✅ TypeScript everywhere
- ✅ Easy local development (`npm run dev`)
- ✅ Free tier on Vercel

### Cons
- ❌ No Python (use Node.js/TypeScript)
- ❌ OpenAI SDK in JavaScript instead of Python
- ❌ Less ideal for heavy AI/ML processing

### Implementation
```
frontend/
├── app/
│   ├── api/
│   │   ├── listings/
│   │   │   └── route.ts
│   │   ├── classify/
│   │   │   └── route.ts
│   │   ├── subscriptions/
│   │   │   └── route.ts
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts
│   ├── page.tsx
│   └── listings/
│       └── page.tsx
├── lib/
│   ├── openai.ts
│   ├── supabase.ts
│   └── stripe.ts
└── package.json
```

### Code Example (API Route)
```typescript
// app/api/listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('is_active', true);
  
  return NextResponse.json(data);
}
```

---

## Option 2: Next.js + Python Serverless Functions (Vercel)

**Next.js Frontend + Python Functions on Vercel**

### Architecture
- Frontend: Next.js
- Backend: Python serverless functions (Vercel)
- Database: Supabase
- Deployment: Vercel (one platform, different runtimes)

### Pros
- ✅ Single deployment platform (Vercel)
- ✅ Keep Python for AI/classification
- ✅ Next.js for frontend
- ✅ Serverless scaling
- ✅ Free tier available

### Cons
- ❌ More complex setup
- ❌ Cold starts for Python functions
- ❌ Separate codebases (but in same repo)

### Implementation
```
project/
├── frontend/          # Next.js
│   ├── app/
│   └── package.json
└── api/               # Python functions
    ├── classify/
    │   └── index.py
    ├── listings/
    │   └── index.py
    └── requirements.txt
```

### Vercel Configuration
```json
// vercel.json
{
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.11"
    }
  }
}
```

---

## Option 3: Monorepo (Separate but Together)

**Keep FastAPI + Next.js, Deploy Separately but Manage Together**

### Architecture
- Frontend: Next.js (Vercel)
- Backend: FastAPI (Railway/Render)
- Database: Supabase
- Management: Monorepo (single Git repo)

### Pros
- ✅ Best of both worlds (Python + TypeScript)
- ✅ Separate scaling
- ✅ Independent deployments
- ✅ Single codebase management

### Cons
- ❌ Two deployments to manage
- ❌ More complex setup
- ❌ Two hosting costs

### Implementation
```
fixedprice-scotland/
├── frontend/          # Next.js
│   ├── app/
│   └── package.json
├── backend/           # FastAPI
│   ├── app/
│   └── requirements.txt
└── package.json       # Root package.json (optional)
```

---

## Option 4: Next.js API Routes + External Python Service

**Next.js handles most, Python only for AI**

### Architecture
- Frontend: Next.js
- API: Next.js API Routes (most endpoints)
- AI Service: Separate Python service (only for classification)
- Database: Supabase
- Deployment: Vercel (frontend) + Railway (Python service)

### Pros
- ✅ Most logic in Next.js (simple)
- ✅ Python only where needed (AI)
- ✅ Can scale Python service independently

### Cons
- ❌ Two services to manage
- ❌ Network calls between services

---

## Recommendation: Option 1 (Next.js API Routes)

**For MVP, use Next.js API Routes because:**
1. Simplest deployment (one platform)
2. Fastest to production
3. Still professional and scalable
4. OpenAI has excellent Node.js SDK
5. Can migrate to Python later if needed

### Migration Path
- Start with Next.js API Routes (MVP)
- If Python needed later, extract to Option 2 or 3
- Easy to refactor since Supabase handles data layer

---

## Quick Comparison

| Feature    | Option 1 (Next.js API) | Option 2 (Vercel Python) | Option 3 (Monorepo) |
|---------   |----------------------  |------------------------- |-------------------|
| Deployment | 1 platform             | 1 platform               | 2 platforms |
| Complexity | Low | Medium | Medium |
| Python Support | No | Yes | Yes |
| Cost (MVP) | Free | Free | ~$10/month |
| Setup Time | Fastest | Medium | Medium |
| Best For   | MVP                    |  Python-heavy            | Production |

---

## Updated Tech Stack (Option 1)

**If choosing Next.js API Routes:**

- **Frontend:** Next.js (pages + API routes)
- **Language:** TypeScript
- **Database:** Supabase
- **AI:** OpenAI Node.js SDK
- **Payments:** Stripe Node.js SDK
- **Deployment:** Vercel
- **No separate backend needed!**
