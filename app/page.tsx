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
