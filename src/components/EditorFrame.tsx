import type { PropsWithChildren } from 'react'
import type { EditorTheme } from '../lib/themes'
import { cn } from '../lib/utils'

interface EditorFrameProps extends PropsWithChildren {
  filename?: string
  chromeLabel?: string
  theme: EditorTheme
  className?: string
}

export function EditorFrame({ children, filename, chromeLabel, theme, className }: EditorFrameProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border shadow-[0_32px_80px_rgba(15,23,42,0.42)] backdrop-blur-sm',
        className,
      )}
      style={{
        background: theme.frameBackground,
        borderColor: theme.frameBorder,
      }}
    >
      <div
        className="flex h-14 items-center gap-4 border-b px-5"
        style={{
          borderColor: theme.frameBorder,
          background: 'rgba(15, 23, 42, 0.72)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="min-w-0 flex-1">
          {filename ? (
            <div className="truncate rounded-full px-4 py-1.5 text-center text-sm font-medium tracking-[0.18em] uppercase">
              {filename}
            </div>
          ) : (
            <div className="text-sm font-medium tracking-[0.18em] uppercase" style={{ color: theme.textSecondary }}>
              {chromeLabel ?? 'Editor'}
            </div>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
