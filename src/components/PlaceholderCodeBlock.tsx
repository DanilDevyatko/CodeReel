import { generatePlaceholderLines } from '../features/placeholder/generatePlaceholderLines'
import { editorThemes } from '../lib/themes'
import { cn } from '../lib/utils'
import type { ThemeId } from '../types/scene'

interface PlaceholderCodeBlockProps {
  count: number
  seed?: number
  highlightLines?: number[]
  showLineNumbers?: boolean
  themeId: ThemeId
}

export function PlaceholderCodeBlock({
  count,
  seed,
  highlightLines,
  showLineNumbers = true,
  themeId,
}: PlaceholderCodeBlockProps) {
  const lines = generatePlaceholderLines(count, seed)
  const highlighted = new Set(highlightLines ?? [])
  const theme = editorThemes[themeId]

  return (
    <div className="h-full overflow-hidden px-5 py-5 font-editor">
      <div className="flex h-full flex-col gap-2.5">
        {lines.map((line, index) => {
          const lineNumber = index + 1
          const isHighlighted = highlighted.has(lineNumber)

          return (
            <div
              key={`${seed ?? 0}-${lineNumber}`}
              className={cn('flex min-h-10 items-center gap-4 rounded-xl px-3 py-1.5')}
              style={{
                backgroundColor: isHighlighted ? theme.lineHighlight : undefined,
                opacity: highlighted.size > 0 && !isHighlighted ? 0.4 : 1,
              }}
            >
              {showLineNumbers ? (
                <span className="w-12 shrink-0 text-right text-sm" style={{ color: theme.textSecondary }}>
                  {lineNumber}
                </span>
              ) : null}
              <div className="flex min-w-0 flex-1 items-center gap-3" style={{ paddingLeft: `${line.indent * 20}px` }}>
                {line.segments.map((segment, segmentIndex) => (
                  <span
                    key={`${lineNumber}-${segmentIndex}-${segment.width}`}
                    className="h-4 rounded-full"
                    style={{
                      width: `${segment.width}%`,
                      maxWidth: `${segment.width}%`,
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
