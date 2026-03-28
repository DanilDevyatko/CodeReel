import type { PropsWithChildren } from 'react'
import type { EditorTheme } from '../lib/themes'
import { cn } from '../lib/utils'

export interface EditorFrameMetrics {
  radius: number
  chromeHeight: number
  chromePaddingX: number
  trafficLightSize: number
  titleFontSize: number
}

interface EditorFrameProps extends PropsWithChildren {
  filename?: string
  theme: EditorTheme
  className?: string
  metrics: EditorFrameMetrics
}

export function EditorFrame({ children, filename, theme, className, metrics }: EditorFrameProps) {
  const tabLabel = filename?.trim()
  const chromeGap = Math.max(16, metrics.chromePaddingX * 0.28)
  const trafficLightsWidth = metrics.trafficLightSize * 3 + 24
  const titleInset = metrics.chromePaddingX + trafficLightsWidth + chromeGap

  return (
    <div
      className={cn('flex h-full min-h-0 flex-col overflow-hidden border backdrop-blur-sm', className)}
      style={{
        background: theme.frameBackground,
        borderColor: theme.frameBorder,
        borderRadius: `${metrics.radius}px`,
        boxShadow: '0 36px 120px rgba(15, 23, 42, 0.34)',
      }}
    >
      <div
        className="relative flex items-center justify-between border-b"
        style={{
          height: `${metrics.chromeHeight}px`,
          gap: `${chromeGap}px`,
          paddingInline: `${metrics.chromePaddingX}px`,
          borderColor: theme.frameBorder,
          background: 'rgba(2, 6, 23, 0.38)',
        }}
      >
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="rounded-full bg-[#ff5f56]"
            style={{ height: `${metrics.trafficLightSize}px`, width: `${metrics.trafficLightSize}px` }}
          />
          <span
            className="rounded-full bg-[#ffbd2e]"
            style={{ height: `${metrics.trafficLightSize}px`, width: `${metrics.trafficLightSize}px` }}
          />
          <span
            className="rounded-full bg-[#27c93f]"
            style={{ height: `${metrics.trafficLightSize}px`, width: `${metrics.trafficLightSize}px` }}
          />
        </div>
        {tabLabel ? (
          <div
            className="pointer-events-none absolute inset-y-0 flex items-center justify-center"
            style={{
              left: `${titleInset}px`,
              right: `${titleInset}px`,
            }}
          >
            <div
              className="max-w-full truncate rounded-full px-4 py-2 text-center font-medium uppercase"
              style={{
                background: 'rgba(148, 163, 184, 0.08)',
                color: theme.textSecondary,
                fontSize: `${metrics.titleFontSize}px`,
                letterSpacing: '0.22em',
              }}
            >
              {tabLabel}
            </div>
          </div>
        ) : null}
        <div aria-hidden="true" className="shrink-0" style={{ width: `${trafficLightsWidth}px` }} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
