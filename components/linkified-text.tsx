const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g

interface Props {
  text: string
  className?: string
}

export function LinkifiedText({ text, className }: Props) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const url = match[0]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 break-all hover:opacity-70"
      >
        {url}
      </a>
    )
    lastIndex = match.index + url.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <p className={`whitespace-pre-wrap ${className ?? ''}`}>{parts}</p>
}
