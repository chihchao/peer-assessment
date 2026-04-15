'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/ui/badge'

export interface NavUser {
  name: string
  email: string
  role: string
  avatarUrl?: string | null
}

interface NavItem {
  label: string
  href: string
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  student: [
    { label: '課程',     href: '/courses' },
    { label: '互評任務', href: '/peer-review' },
    { label: '成績查詢', href: '/grades' },
  ],
  teacher: [
    { label: '課程管理', href: '/courses' },
    { label: '作業管理', href: '/assignments' },
    { label: '成績總覽', href: '/grades' },
    { label: '學生名單', href: '/students' },
  ],
  ta: [
    { label: '互評管理', href: '/peer-review' },
    { label: '成績審核', href: '/grades' },
    { label: '學生名單', href: '/students' },
  ],
}

interface NavbarProps {
  user: NavUser
  signOutAction: () => Promise<void>
}

export function Navbar({ user, signOutAction }: NavbarProps) {
  const pathname = usePathname()
  const navItems = NAV_ITEMS[user.role] ?? []

  return (
    <header className="fixed top-0 left-0 right-0 z-[20] h-16 bg-white border-b border-border flex items-center px-4 sm:px-6">
      {/* Logo */}
      <Link
        href="/"
        className="text-primary font-bold text-base mr-8 shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        互評平台
      </Link>

      {/* Navigation links */}
      <nav aria-label="主導覽" className="hidden md:flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground',
              ].join(' ')}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="flex items-center gap-3 ml-auto">
        <Avatar src={user.avatarUrl} name={user.name} size="sm" />
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <RoleBadge role={user.role} />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground/60 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            登出
          </button>
        </form>
      </div>
    </header>
  )
}
