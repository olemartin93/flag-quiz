import { flagUrl } from '../lib/flags'

interface FlagProps {
  readonly code: string
  readonly className?: string
  readonly alt?: string
  readonly lazy?: boolean
}

export function Flag({ code, className = '', alt = 'Flag', lazy = false }: FlagProps) {
  return (
    <img
      src={flagUrl(code)}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      draggable={false}
      className={`aspect-[4/3] w-full rounded-lg object-cover shadow-md ring-1 ring-black/10 select-none dark:ring-white/10 ${className}`}
    />
  )
}
