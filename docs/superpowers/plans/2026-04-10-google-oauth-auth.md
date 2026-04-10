# Google OAuth Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Google-only login/logout with Supabase Auth, SSR session via cookies, and Next.js Middleware route protection.

**Architecture:** `@supabase/ssr` manages HTTP-only cookie sessions so both Server and Client Components can read auth state. A single `middleware.ts` guards all routes and refreshes tokens. The login page uses a Server Action to initiate the OAuth redirect; a Route Handler exchanges the Google callback code for a session.

**Tech Stack:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS, `@supabase/supabase-js`, `@supabase/ssr`, Vitest

---

## Prerequisites (Manual — Do Before Starting)

These require human action and cannot be scripted:

1. **Supabase Google Provider** — Supabase Dashboard → Authentication → Providers → Google → enable → fill in Client ID + Secret from Google Cloud Console. Copy the **Callback URL** shown by Supabase (e.g. `https://vspsytmlzijlocnobixg.supabase.co/auth/v1/callback`) and add it to your Google Cloud OAuth app's Authorized Redirect URIs.
2. **Get API keys** — Supabase Dashboard → Project Settings → API → copy `Project URL` and `anon public` key. You will need these in Task 2.

---

## File Map

```
<project-root>/
├── middleware.ts                      # Route guard + session refresh (modify after create-next-app)
├── utils/
│   └── supabase/
│       ├── server.ts                  # createServerClient for Server Components / Route Handlers
│       └── client.ts                  # createBrowserClient for Client Components
├── app/
│   ├── layout.tsx                     # Root layout (already created by create-next-app, minimal edit)
│   ├── page.tsx                       # Home page — shows user info + logout button
│   ├── login/
│   │   ├── page.tsx                   # Login page (Server Component — Google button)
│   │   └── actions.ts                 # Server Action: signInWithOAuth
│   └── auth/
│       └── callback/
│           └── route.ts               # Route Handler: exchange code → session → redirect /
└── __tests__/
    └── middleware.test.ts             # Unit tests for middleware redirect logic
```

---

## Task 1: Initialize Project

**Files:**
- Create: `<project-root>/` (entire Next.js scaffold)

- [ ] **Step 1.1: Run create-next-app**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --no-import-alias \
  --turbopack
```

When prompted for project name, use `.` (current directory). Answer yes to all recommended options. This creates `app/`, `public/`, `next.config.ts`, `tsconfig.json`, `package.json`, `tailwind.config.ts`.

- [ ] **Step 1.2: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 1.3: Install Vitest for testing**

```bash
npm install -D vitest @vitejs/plugin-react vite-tsconfig-paths
```

- [ ] **Step 1.4: Add vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 1.5: Add test script to package.json**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 1.6: Verify dev server starts**

```bash
npm run dev
```

Expected: `▲ Next.js 15.x.x` starts on `http://localhost:3000` without errors. Stop with Ctrl+C.

- [ ] **Step 1.7: Commit**

```bash
git init
git add .
git commit -m "feat: initialize Next.js 15 project with Supabase and Vitest"
```

---

## Task 2: Environment Setup

**Files:**
- Create: `.env.local`
- Modify: `.gitignore` (verify `.env.local` is ignored)

- [ ] **Step 2.1: Create .env.local**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://vspsytmlzijlocnobixg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
EOF
```

Replace `<paste-your-anon-key-here>` with the actual anon key from Supabase Dashboard → Project Settings → API.

- [ ] **Step 2.2: Verify .gitignore covers .env.local**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` appears. If it doesn't, add it:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 2.3: Commit (gitignore only, not .env.local)**

```bash
git add .gitignore
git commit -m "chore: ensure .env.local is gitignored"
```

---

## Task 3: Supabase Client Utilities

**Files:**
- Create: `utils/supabase/server.ts`
- Create: `utils/supabase/client.ts`

- [ ] **Step 3.1: Create utils/supabase/server.ts**

```bash
mkdir -p utils/supabase
```

`utils/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from Server Component — middleware handles refresh
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3.2: Create utils/supabase/client.ts**

`utils/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3.3: Commit**

```bash
git add utils/
git commit -m "feat: add Supabase SSR client utilities"
```

---

## Task 4: Middleware

**Files:**
- Create: `middleware.ts`
- Create: `__tests__/middleware.test.ts`

- [ ] **Step 4.1: Write the failing test**

```bash
mkdir -p __tests__
```

`__tests__/middleware.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock @supabase/ssr
const mockGetUser = vi.fn()
const mockSetAll = vi.fn()
const mockGetAll = vi.fn(() => [])

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}))

// Mock next/headers (not used in middleware, but needed if imported)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

// Import AFTER mocks are set up
const { middleware } = await import('../middleware')

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(`http://localhost:3000${path}`))
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated user from / to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    const response = await middleware(makeRequest('/'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login')
  })

  it('redirects authenticated user from /login to /', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@gmail.com' } },
      error: null,
    })
    const response = await middleware(makeRequest('/login'))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/')
    expect(response.headers.get('location')).not.toContain('/login')
  })

  it('passes through authenticated user on protected route', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@gmail.com' } },
      error: null,
    })
    const response = await middleware(makeRequest('/dashboard'))
    expect(response.status).toBe(200)
  })
})
```

- [ ] **Step 4.2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../middleware'`

- [ ] **Step 4.3: Implement middleware.ts**

`middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && pathname !== '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
```

- [ ] **Step 4.4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS — 3 tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add middleware.ts __tests__/middleware.test.ts
git commit -m "feat: add route-guarding middleware with tests"
```

---

## Task 5: Login Page + Server Action

**Files:**
- Create: `app/login/actions.ts`
- Create: `app/login/page.tsx`

- [ ] **Step 5.1: Create app/login/actions.ts**

```bash
mkdir -p app/login
```

`app/login/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}
```

- [ ] **Step 5.2: Add NEXT_PUBLIC_SITE_URL to .env.local**

Append to `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(In production, set this to your deployed domain, e.g. `https://yourdomain.com`.)

- [ ] **Step 5.3: Create app/login/page.tsx**

`app/login/page.tsx`:

```typescript
import { signInWithGoogle } from './actions'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          學習平台
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          使用 Google 帳號登入
        </p>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            使用 Google 帳號登入
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 5.4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5.5: Commit**

```bash
git add app/login/
git commit -m "feat: add login page with Google OAuth server action"
```

---

## Task 6: OAuth Callback Route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 6.1: Create the route handler**

```bash
mkdir -p app/auth/callback
```

`app/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 6.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6.3: Commit**

```bash
git add app/auth/callback/
git commit -m "feat: add OAuth callback route handler"
```

---

## Task 7: Logout + Home Page

**Files:**
- Create: `app/actions.ts` (global logout server action)
- Modify: `app/page.tsx` (replace default Next.js page)

- [ ] **Step 7.1: Create app/actions.ts**

`app/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 7.2: Replace app/page.tsx**

`app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from './actions'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-2 text-xl font-bold text-gray-900">
          歡迎，{user.user_metadata.full_name ?? user.email}
        </h1>
        <p className="mb-6 text-sm text-gray-500">{user.email}</p>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            登出
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 7.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7.4: Run all tests**

```bash
npm test
```

Expected: 3 tests pass (middleware tests).

- [ ] **Step 7.5: Commit**

```bash
git add app/page.tsx app/actions.ts
git commit -m "feat: add home page with user info and logout"
```

---

## Task 8: End-to-End Manual Verification

These steps require a browser and real Google credentials. Ensure prerequisites from the top of this plan are done first.

- [ ] **Step 8.1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 8.2: Verify redirect to /login when unauthenticated**

Open `http://localhost:3000` in browser.

Expected: Browser redirects to `http://localhost:3000/login`. Login page shows Google button.

- [ ] **Step 8.3: Complete Google OAuth login**

Click "使用 Google 帳號登入". Complete Google authentication.

Expected: Browser redirects to `http://localhost:3000/`. Home page shows your Google account name and email.

- [ ] **Step 8.4: Verify /login redirects to / when authenticated**

In the same browser session, navigate to `http://localhost:3000/login`.

Expected: Browser immediately redirects to `http://localhost:3000/`.

- [ ] **Step 8.5: Verify DB trigger fired**

Check Supabase: run this SQL in Supabase Dashboard → SQL Editor:

```sql
SELECT id, email, name, role, created_at FROM public.users;
```

Expected: One row with your Google email, full name, and `role = 'student'`.

- [ ] **Step 8.6: Verify logout**

On the home page, click "登出".

Expected: Browser redirects to `http://localhost:3000/login`. Navigating back to `/` redirects to `/login` again (session cleared).

- [ ] **Step 8.7: Final commit**

```bash
git add -A
git commit -m "chore: complete google-oauth-auth implementation"
```

---

## Self-Review Checklist

| Spec Requirement | Task |
|---|---|
| Google OAuth 登入（首次 + 再次） | Task 5 (login action) + Task 6 (callback) |
| Session 持久化（重整不登出） | Task 3 (`@supabase/ssr` cookie client) + Task 4 (middleware refresh) |
| 路由保護（未登入重導 /login） | Task 4 (middleware) |
| 已登入訪問 /login 重導 / | Task 4 (middleware) |
| 登出後 Session 清除 | Task 7 (signOut action) |
| `public.users` 自動建立記錄 | DB trigger already exists — Task 8.5 verifies |
