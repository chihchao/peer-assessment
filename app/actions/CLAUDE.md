# Server Actions Conventions

## Rules

- All files must start with `'use server'`
- Never trust client-passed role or ownership claims — always re-fetch and verify server-side
- Always call `supabase.auth.getUser()` for auth; never read user from client input
- Return typed result objects (`{ error?: string }` or typed data), never throw raw errors to the client
- Call `revalidatePath(...)` after any mutation so the next page load reflects the change
- Use `redirect(...)` for post-mutation navigation (e.g. after creating a course)

## Auth & Ownership Pattern

```ts
export async function someMutation(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  // Fetch resource and verify ownership
  const { data: resource } = await supabase
    .from('resources')
    .select('owner_id')
    .eq('id', id)
    .single()

  if (!resource || resource.owner_id !== user.id) return { error: '無權限' }

  // ... perform mutation
}
```

## File Organization

| File | Domain |
| ---- | ------ |
| `app/actions.ts` | Auth (signOut) |
| `app/login/actions.ts` | Auth (signInWithGoogle) |
| `app/actions/courses.ts` | Course CRUD + enrollment management |
| `app/actions/assignments.ts` | Assignment CRUD + lifecycle transitions |
| `app/actions/submissions.ts` | Submission CRUD + peer review + grade queries |

## Naming Conventions

- Queries: `get*` prefix (e.g. `getAssignment`, `getMySubmission`)
- Mutations: verb prefix (e.g. `createCourse`, `deleteSubmission`, `activatePeerReview`)
- Status transitions: `activate*` or `publish*` (e.g. `publishAssignment`, `activatePeerReview`)
