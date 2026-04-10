# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-based student report peer assessment platform (GEAI1017). Three roles: **Student**, **Teacher**, **TA**.

## Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript (strict), Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL), project ref `vspsytmlzijlocnobixg`
- **Auth**: Supabase Auth — Google OAuth only (no email/password)
- **Spec workflow**: OpenSpec (`openspec/config.yaml`, `/opsx:propose` → `/opsx:apply` → `/opsx:archive`)

## Architecture Conventions

- **Components**: Atomic Design; prefer Server Components over Client Components
- **Data mutations**: Next.js Server Actions (not API routes)
- **Security**: All tables must have RLS enabled; never bypass RLS on the client
- **Types**: No `any`; all functions and API returns must have explicit types/interfaces
- **Lint**: `eslint-config-next`; all commits must pass lint

## Database

Supabase MCP is configured in `.mcp.json`. Use `mcp__supabase__apply_migration` for DDL, `mcp__supabase__execute_sql` for queries.

### Current Schema (`public`)

**`users`** — synced from `auth.users` via trigger `on_auth_user_created`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` | |
| `name` | `text` | from `raw_user_meta_data.full_name` (Google) |
| `role` | `text` | default `'student'` |
| `created_at` | `timestamptz` | default `now()` |

RLS enabled. User row is auto-inserted on first Google login via the `handle_new_user()` trigger function.
