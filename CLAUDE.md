# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based student report peer assessment platform (GEAI1017). Three roles: **Student**, **Teacher**, **TA**.

## Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript (strict), Tailwind CSS v4
- **Backend/DB**: Supabase (PostgreSQL), project ref `vspsytmlzijlocnobixg`
- **Auth**: Supabase Auth — Google OAuth only (no email/password)
- **UI Style**: Flat Design (no shadows/blur), semantic color tokens only
- **Spec workflow**: OpenSpec (`openspec/config.yaml`, `/opsx:propose` → `/opsx:apply` → `/opsx:archive`)

## Architecture Conventions

- **Components**: Atomic Design; prefer Server Components over Client Components
- **Data mutations**: Next.js Server Actions (not API routes)
- **Security**: All tables must have RLS enabled; never bypass RLS on the client
- **Types**: No `any`; all functions and API returns must have explicit types/interfaces
- **Lint**: `eslint-config-next`; all commits must pass lint

## Tailwind CSS v4 Configuration

This project uses **Tailwind CSS v4**, which configures via CSS — NOT `tailwind.config.ts`.

- All design tokens are defined in `app/globals.css` using the `@theme {}` block
- Never create a `tailwind.config.ts` — it won't be picked up by v4
- Color tokens: `primary`, `secondary`, `accent`, `background`, `foreground`, `muted`, `border`, `destructive`
- Z-index tokens: `z-base`(0), `z-dropdown`(10), `z-sticky`(20), `z-modal`(40), `z-toast`(100)
- Font: Plus Jakarta Sans via `next/font/google`, applied via `--font-sans` CSS variable

## Design System & Component Library

Fully implemented in `components/`. All components use semantic color tokens (e.g. `bg-primary`, `text-foreground`), never raw hex.

### UI Components (`components/ui/`)

| Component | File | Key Features |
|-----------|------|--------------|
| Button | `button.tsx` | CVA variants (default/secondary/outline/ghost/destructive), sizes (sm/default/lg), `isLoading` spinner |
| Input | `input.tsx` | `React.useId()` for SSR-safe IDs, 44px height, error state with `aria-describedby` |
| Card | `card.tsx` | CardHeader/CardContent/CardFooter/CardTitle/CardDescription, Flat Design (no shadow) |
| Badge | `badge.tsx` | Role variants (student/teacher/ta/default), WCAG AA contrast; `RoleBadge` helper with Chinese labels |
| Avatar | `avatar.tsx` | next/image with fallback to initials, sizes: sm(32)/default(40)/lg(56)px |
| Toast | `toast.tsx` | `aria-live="polite"`, fixed bottom-right, 4 variants, `ToastContainer` |

Re-exported from `components/ui/index.ts`.

### Layout Components (`components/layout/`)

| Component | File | Description |
|-----------|------|-------------|
| Navbar | `navbar.tsx` | Fixed 64px top bar, role-based navigation, accepts `signOutAction: () => Promise<void>` Server Action prop; **Client Component** (`usePathname`) |
| PageWrapper | `page-wrapper.tsx` | `pt-16` for fixed Navbar + `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` |
| PageHeader | `page-header.tsx` | `<h1>` title, optional subtitle/breadcrumbs/actions slot |

Re-exported from `components/layout/index.ts`.

### Hooks (`hooks/`)

- `use-toast.ts` — `useToast()` managing toast state with 4s auto-dismiss; methods: `toast.success/error/warning/info`

### Role-based Navigation (Navbar)

```
student: 我的作業 (/assignments), 互評任務 (/peer-review), 成績查詢 (/grades)
teacher: 課程管理 (/courses), 作業管理 (/assignments), 成績總覽 (/grades), 學生名單 (/students)
ta:      互評管理 (/peer-review), 成績審核 (/grades), 學生名單 (/students)
```

Active link style: `bg-primary/10 text-primary font-medium` + `aria-current="page"`.

### Server/Client Component Boundary Pattern

Navbar is a Client Component (needs `usePathname`). Server Action (`signOut`) is passed as a prop from the Server Component page:

```tsx
// app/page.tsx (Server Component)
import { signOut } from '@/app/actions/auth'
<Navbar user={navUser} signOutAction={signOut} />

// components/layout/navbar.tsx (Client Component)
<form action={signOutAction}><button type="submit">登出</button></form>
```

## Database

Supabase MCP is configured in `.mcp.json`. Use `mcp__supabase__apply_migration` for DDL, `mcp__supabase__execute_sql` for queries.

### Current Schema (`public`)

**`users`** — synced from `auth.users` via trigger `on_auth_user_created`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | |
| `name` | `text` | from `raw_user_meta_data.full_name` (Google) |
| `role` | `text` | default `'student'`; valid values: `student`, `teacher`, `ta` |
| `created_at` | `timestamptz` | default `now()` |

RLS enabled. User row is auto-inserted on first Google login via the `handle_new_user()` trigger function.

## Implemented Pages

| Route | File | Status |
|-------|------|--------|
| `/login` | `app/login/page.tsx` | Complete — Google OAuth, Card + Button design system |
| `/` (home) | `app/page.tsx` | Complete — shows user info, Navbar, PageWrapper, PageHeader, RoleBadge |
| `/api/auth/callback` | `app/api/auth/callback/route.ts` | Complete — OAuth callback handler |

## Next Development Areas

Based on spec and navigation structure, priority features to build next:

- **Student**: 我的作業 (`/assignments`), 互評任務 (`/peer-review`), 成績查詢 (`/grades`)
- **Teacher**: 課程管理 (`/courses`), 作業管理, 成績總覽, 學生名單 (`/students`)
- **TA**: 互評管理, 成績審核, 學生名單

Use `/opsx:propose` to start a new SDD change for each feature area.
