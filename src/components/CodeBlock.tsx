import { useEffect, useMemo, useState } from 'react'
import type { ThemedToken } from 'shiki'
import { editorThemes } from '../lib/themes'
import { highlightCode } from '../lib/shiki'
import { cn } from '../lib/utils'
import type { LineStatus, ThemeId } from '../types/scene'

interface CodeBlockProps {
  code: string
  language?: string
  themeId: ThemeId
  highlightLines?: number[]
  dimNonHighlighted?: boolean
  showLineNumbers?: boolean
  lineStatuses?: Record<number, LineStatus>
}

function lineStatusClasses(status: LineStatus | undefined) {
  switch (status) {
    case 'added':
      return 'border-l-2 border-emerald-400 bg-emerald-400/10'
    case 'changed':
      return 'border-l-2 border-amber-300 bg-amber-300/10'
    case 'removed':
      return 'border-l-2 border-rose-400/25 bg-rose-400/6 opacity-60'
    default:
      return 'border-l-2 border-transparent'
  }
}

function fontStyleForToken(fontStyle: number | undefined) {
  if (!fontStyle) {
    return undefined
  }

  return {
    fontStyle: fontStyle & 1 ? 'italic' : undefined,
    fontWeight: fontStyle & 2 ? 700 : undefined,
    textDecoration: fontStyle & 4 ? 'underline' : undefined,
  }
}

export function CodeBlock({
  code,
  language,
  themeId,
  highlightLines,
  dimNonHighlighted,
  showLineNumbers = true,
  lineStatuses,
}: CodeBlockProps) {
  const [resolvedTokens, setResolvedTokens] = useState<{
    key: string
    tokens: ThemedToken[][]
  } | null>(null)
  const theme = editorThemes[themeId]
  const highlighted = new Set(highlightLines ?? [])
  const hasHighlights = highlighted.size > 0
  const requestKey = `${themeId}:${language ?? 'typescript'}:${code}`
  const fallbackTokens = useMemo(
    () => code.split('\n').map((line) => [{ content: line, offset: 0 } as ThemedToken]),
    [code],
  )

  useEffect(() => {
    let isMounted = true

    highlightCode(code, language, themeId)
      .then((nextTokens) => {
        if (!isMounted) {
          return
        }

        setResolvedTokens({
          key: requestKey,
          tokens: nextTokens,
        })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setResolvedTokens({
          key: requestKey,
          tokens: fallbackTokens,
        })
      })

    return () => {
      isMounted = false
    }
  }, [code, fallbackTokens, language, requestKey, themeId])

  const renderedLines = resolvedTokens?.key === requestKey ? resolvedTokens.tokens : fallbackTokens

  return (
    <div className="scrollbar-thin h-full overflow-auto px-5 py-5 font-editor text-[26px] leading-[1.65]">
      <pre className="m-0 min-w-full">
        {renderedLines.map((lineTokens, index) => {
          const lineNumber = index + 1
          const isHighlighted = highlighted.has(lineNumber)
          const status = lineStatuses?.[lineNumber]

          return (
            <div
              key={`${lineNumber}-${lineTokens.length}`}
              className={cn(
                'flex min-h-11 items-start gap-4 rounded-xl px-3 py-1.5 transition-opacity',
                lineStatusClasses(status),
                isHighlighted && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
                dimNonHighlighted && hasHighlights && !isHighlighted && 'opacity-35',
              )}
              style={{
                backgroundColor: isHighlighted ? theme.lineHighlight : undefined,
              }}
            >
              {showLineNumbers ? (
                <span className="w-12 shrink-0 pt-0.5 text-right text-sm" style={{ color: theme.textSecondary }}>
                  {lineNumber}
                </span>
              ) : null}
              <span className="min-w-0 flex-1 whitespace-pre">
                {lineTokens.length > 0
                  ? lineTokens.map((token, tokenIndex) => (
                      <span
                        key={`${lineNumber}-${tokenIndex}-${token.content}`}
                        style={{
                          color: token.color ?? theme.textPrimary,
                          ...fontStyleForToken(token.fontStyle),
                        }}
                      >
                        {token.content || ' '}
                      </span>
                    ))
                  : ' '}
              </span>
            </div>
          )
        })}
      </pre>
    </div>
  )
}
