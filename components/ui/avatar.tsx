import Image from 'next/image'
import * as React from 'react'

const sizeMap = {
  sm:      { container: 'h-8 w-8',   text: 'text-xs', px: 32  },
  default: { container: 'h-10 w-10', text: 'text-sm', px: 40  },
  lg:      { container: 'h-14 w-14', text: 'text-lg', px: 56  },
} as const

type AvatarSize = keyof typeof sizeMap

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}

function Avatar({ src, name, size = 'default', className = '' }: AvatarProps) {
  const { container, text, px } = sizeMap[size]
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${container} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={name ?? '使用者頭像'}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      ) : (
        <AvatarFallback initials={initials} text={text} />
      )}
    </div>
  )
}

function AvatarFallback({ initials, text }: { initials: string; text: string }) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-foreground/70 ${text}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export { Avatar }
export type { AvatarSize }
