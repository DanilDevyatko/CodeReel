import { useEffect } from 'react'
import { generatePlaceholderLines } from '../features/placeholder/generatePlaceholderLines'
import { editorThemes } from '../lib/themes'
import type { ThemeId } from '../types/scene'
import type { CodeBlockMetrics } from './CodeBlock'

interface PlaceholderCodeBlockProps {
  count: number
  seed?: number
  highlightLines?: number[]
  showLineNumbers?: boolean
  themeId: ThemeId
  metrics: CodeBlockMetrics
  dimNonHighlighted?: boolean
  onReadyChange?: (ready: boolean) => void
}

export function PlaceholderCodeBlock({
  count,
  seed,
  highlightLines,
  showLineNumbers = true,
  themeId,
  metrics,
  dimNonHighlighted,
  onReadyChange,
}: PlaceholderCodeBlockProps) {
  const lines = generatePlaceholderLines(count, seed)
  const highlighted = new Set(highlightLines ?? [])
  const theme = editorThemes[themeId]
  const rowHeight = Math.round(metrics.fontSize * metrics.lineHeight)
  const segmentHeight = Math.max(12, Math.round(metrics.fontSize * 0.48))

  useEffect(() => {
    onReadyChange?.(true)
  }, [onReadyChange])

  return (
    <div
      className="h-full overflow-hidden font-editor"
      style={{
        padding: `${metrics.contentPadding}px`,
      }}
    >
      <div className="flex h-full flex-col">
        {lines.map((line, index) => {
          const lineNumber = index + 1
          const isHighlighted = highlighted.has(lineNumber)
          const shouldDim = dimNonHighlighted && highlighted.size > 0 && !isHighlighted

          return (
            <div
              key={`${seed ?? 0}-${lineNumber}`}
              className="flex items-center"
              style={{
                gap: `${Math.max(16, metrics.contentPadding * 0.35)}px`,
                minHeight: `${rowHeight}px`,
                marginBottom: `${metrics.rowGap}px`,
                borderRadius: `${metrics.rowRadius}px`,
                padding: `${Math.max(8, metrics.contentPadding * 0.2)}px ${Math.max(
                  14,
                  metrics.contentPadding * 0.28,
                )}px`,
                backgroundColor: isHighlighted ? theme.lineHighlight : undefined,
                opacity: shouldDim ? 0.32 : 1,
              }}
            >
              {showLineNumbers ? (
                <span
                  className="shrink-0 text-right"
                  style={{
                    width: `${metrics.lineNumberWidth}px`,
                    color: theme.textSecondary,
                    fontSize: `${Math.max(18, metrics.fontSize * 0.56)}px`,
                  }}
                >
                  {lineNumber}
                </span>
              ) : null}
              <div
                className="flex min-w-0 flex-1 items-center"
                style={{
                  gap: `${Math.max(10, metrics.contentPadding * 0.18)}px`,
                  paddingLeft: `${line.indent * Math.max(18, metrics.contentPadding * 0.34)}px`,
                }}
              >
                {line.segments.map((segment, segmentIndex) => (
                  <span
                    key={`${lineNumber}-${segmentIndex}-${segment.width}`}
                    className="rounded-full"
                    style={{
                      width: `${segment.width}%`,
                      maxWidth: `${segment.width}%`,
                      height: `${segmentHeight}px`,
                      background: theme.placeholderPalette[segment.colorIndex % theme.placeholderPalette.length],
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
