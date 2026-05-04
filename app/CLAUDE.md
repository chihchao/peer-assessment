# App Router Conventions

## Page Structure Pattern

Every protected page follows this pattern:

```tsx
export default async function SomePage({ params, searchParams }) {
  const { navUser, userId } = await requireAuth()
  // role guard: redirect or notFound() if unauthorized

  // fetch data server-side
  const data = await someAction()

  return (
    <>
      <Navbar user={navUser} signOutAction={signOut} />
      <PageWrapper>
        <PageHeader title="..." />
        {/* content */}
      </PageWrapper>
    </>
  )
}
```

## Server/Client Boundary

Navbar is a Client Component (`usePathname`). Pass Server Actions as props:

```tsx
// Server Component
import { signOut } from '@/app/actions'
<Navbar user={navUser} signOutAction={signOut} />

// Client Component (Navbar)
<form action={signOutAction}><button type="submit">登出</button></form>
```

For interactive mutations in Client Components, import server actions directly and use `useTransition` + `useRouter().refresh()`:

```tsx
'use client'
import { deleteSubmission } from '@/app/actions/submissions'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

const [isPending, startTransition] = useTransition()
const router = useRouter()

startTransition(async () => {
  await deleteSubmission(id)
  router.refresh()
})
```

## Route-Specific Components

Co-locate small components inside `_components/` under the route directory:

```
app/courses/[id]/assignments/[aid]/
  _components/
    grade-calculation-form.tsx   ← only used by this route
  page.tsx
```

## Loading & Error Boundaries

- Add `loading.tsx` for routes with heavy data fetching
- Add `error.tsx` for routes where partial failure is recoverable
- Current: loading → `/courses`, `/assignments`, `/peer-review`, `/grades`; error → `/courses/[id]/assignments`, `/peer-review`

## Assignment Lifecycle

```
draft → open → reviewing → graded
```

- `draft`: editable; teacher can delete
- `open`: students submit; teacher can delete individual submissions
- `reviewing`: peer review active; no submission changes
- `graded`: grades calculated; read-only
