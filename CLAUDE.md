# CLAUDE.md

Guidance for Claude Code in this repository.

## Project Overview

Web-based student report peer assessment platform (互評平台). Three roles: **Student**, **Teacher**, **TA**.

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

## Auth Helper

All protected pages call `requireAuth()` to get the user profile and redirect if unauthenticated:

```ts
import { requireAuth } from '@/utils/auth'
const { userId, navUser } = await requireAuth()
// navUser: { name, email, role, avatarUrl }
```

## Documentation Index

| Topic | Location |
| ----- | -------- |
| Database schema, RLS, RPC functions | [docs/schema.md](docs/schema.md) |
| Component library reference | [docs/components.md](docs/components.md) |
| Server actions & API routes | [docs/server-actions.md](docs/server-actions.md) |
| Implemented pages | [docs/pages.md](docs/pages.md) |
| RBAC / role access rules | [.claude/skills/rbac/SKILL.md](.claude/skills/rbac/SKILL.md) |
| App Router & page conventions | [app/CLAUDE.md](app/CLAUDE.md) |
| Component & design system conventions | [components/CLAUDE.md](components/CLAUDE.md) |
| Server action conventions | [app/actions/CLAUDE.md](app/actions/CLAUDE.md) |

## Next Development Areas

- **Enrollment-gated visibility**: filter courses/assignments so students only see content for courses they enrolled in (schema and teacher-side enrollment management are in place; student-side display logic not yet scoped)
- **Notifications**: alert students when peer review is activated or grades are published
- **TA write access**: allow TA to manage stuck workflows (currently read-only)
- **Assignment excusal**: teacher ability to mark a student as excused before activating peer review
- **Grade audit log**: track previous grade values when recalculation is triggered
- **Mobile nav**: hamburger menu for Navbar on small screens (currently hidden on mobile)
