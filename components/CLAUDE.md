# Components — Design System Conventions

## Tailwind CSS v4

This project uses **Tailwind CSS v4**, configured via CSS — NOT `tailwind.config.ts`.

- Design tokens are defined in `app/globals.css` inside `@theme {}`
- Never create `tailwind.config.ts`
- Color tokens: `primary`, `secondary`, `accent`, `background`, `foreground`, `muted`, `border`, `destructive`
- Z-index tokens: `z-base`(0), `z-dropdown`(10), `z-sticky`(20), `z-modal`(40), `z-toast`(100)
- Font: Plus Jakarta Sans via `next/font/google`, exposed as `--font-sans`

## Rules

- Always use semantic color tokens (`bg-primary`, `text-foreground`), never raw hex or Tailwind palette colors
- Flat Design only — no `shadow`, no `backdrop-blur`
- All interactive elements must be reachable by keyboard and meet WCAG AA contrast

## Adding New UI Components

1. Place in `components/ui/`
2. Use CVA (`class-variance-authority`) for variants
3. Export from `components/ui/index.ts`
4. Use `React.useId()` for any label/input associations (SSR-safe)

## Adding New Feature Components

1. Place in `components/` (not `ui/`)
2. Default to Server Component; add `'use client'` only when needed (event handlers, hooks, browser APIs)
3. If the component is only used by one route, co-locate it in `app/[route]/_components/` instead

## Server/Client Split Pattern

Pass Server Actions as props to avoid making parent components client-side:

```tsx
// ✓ Server Component passes action as prop
<SomeClientComponent onAction={myServerAction} />

// ✗ Don't import server actions inside a file that also uses client hooks
```

For post-mutation refresh inside Client Components, use:

```tsx
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

const [isPending, startTransition] = useTransition()
const router = useRouter()

startTransition(async () => {
  await serverAction(args)
  router.refresh()
})
```
