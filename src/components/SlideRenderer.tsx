import { CodeBlock } from './CodeBlock'
import { EditorFrame } from './EditorFrame'
import { PlaceholderCodeBlock } from './PlaceholderCodeBlock'
import { editorThemes } from '../lib/themes'
import { getSlideLayoutMetrics, type SlideLayoutMetrics } from '../lib/slideLayout'
import type { CanvasSettings, Scene, ThemeId } from '../types/scene'

interface SlideRendererProps {
  scene: Scene
  canvas: CanvasSettings
  themeId: ThemeId
  onReadyChange?: (ready: boolean) => void
}

function getLongestLineLength(code: string | undefined) {
  if (!code) {
    return 0
  }

  return code.split('\n').reduce((max, line) => Math.max(max, line.length), 0)
}

function fitVerticalCodeMetrics(scene: Scene, layout: SlideLayoutMetrics) {
  if (scene.type !== 'code') {
    return layout.codeMetrics
  }

  const longestLineLength = getLongestLineLength(scene.code)

  if (!longestLineLength) {
    return layout.codeMetrics
  }

  const baseMetrics = layout.codeMetrics
  const lineNumberWidth = scene.showLineNumbers === false ? 0 : baseMetrics.lineNumberWidth
  const rowPaddingX = Math.max(12, baseMetrics.contentPadding * 0.24)
  const rowGap = Math.max(12, baseMetrics.contentPadding * 0.32)
  const availableTextWidth =
    layout.frameWidth - baseMetrics.contentPadding * 2 - rowPaddingX * 2 - rowGap - lineNumberWidth
  const estimatedFontSize = availableTextWidth / (longestLineLength * 0.62)
  const fittedFontSize = Math.max(18, Math.min(baseMetrics.fontSize, Math.floor(estimatedFontSize)))

  if (fittedFontSize >= baseMetrics.fontSize) {
    return baseMetrics
  }

  const scale = fittedFontSize / baseMetrics.fontSize

  return {
    ...baseMetrics,
    fontSize: fittedFontSize,
    contentPadding: Math.max(24, Math.round(baseMetrics.contentPadding * Math.max(0.84, scale))),
    lineNumberWidth: scene.showLineNumbers === false ? baseMetrics.lineNumberWidth : Math.max(40, Math.round(baseMetrics.lineNumberWidth * Math.max(0.84, scale))),
    rowGap: Math.max(4, Math.round(baseMetrics.rowGap * Math.max(0.84, scale))),
    rowRadius: Math.max(14, Math.round(baseMetrics.rowRadius * Math.max(0.9, scale))),
  }
}

function SlideBackdrop({ themeId }: { themeId: ThemeId }) {
  const theme = editorThemes[themeId]

  return (
    <>
      <div className="absolute inset-0" style={{ background: theme.canvasBackground }} />
      <div
        className="absolute left-[-12%] top-[8%] h-[34%] w-[34%] rounded-full blur-[110px]"
        style={{ background: theme.accentSoft }}
      />
      <div
        className="absolute bottom-[10%] right-[-6%] h-[38%] w-[38%] rounded-full blur-[140px]"
        style={{ background: `${theme.accent}18` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_44%),linear-gradient(135deg,rgba(255,255,255,0.03),transparent_38%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:46px_46px]" />
    </>
  )
}

export function SlideRenderer({ scene, canvas, themeId, onReadyChange }: SlideRendererProps) {
  const theme = editorThemes[themeId]
  const metrics = getSlideLayoutMetrics(canvas)
  const codeMetrics = canvas.preset === 'vertical-9:16' ? fitVerticalCodeMetrics(scene, metrics) : metrics.codeMetrics

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ color: theme.textPrimary }}>
      <SlideBackdrop themeId={themeId} />
      <div className="relative z-10 flex h-full w-full items-center justify-center px-12 py-12">
        <div
          style={{
            width: `${metrics.frameWidth}px`,
            maxWidth: `${metrics.frameMaxWidth}px`,
            height: `${metrics.frameHeight}px`,
            transform: `translateY(${metrics.frameOffsetY}px)`,
          }}
        >
          <EditorFrame
            filename={scene.filename}
            theme={theme}
            metrics={metrics.frameMetrics}
            className="h-full"
          >
            {scene.type === 'placeholder' ? (
              <PlaceholderCodeBlock
                count={scene.placeholderLines ?? 10}
                seed={scene.placeholderSeed}
                highlightLines={scene.highlightLines}
                showLineNumbers={scene.showLineNumbers}
                dimNonHighlighted={scene.dimNonHighlighted}
                themeId={themeId}
                metrics={codeMetrics}
                onReadyChange={onReadyChange}
              />
            ) : (
              <CodeBlock
                code={scene.code ?? ''}
                language={scene.language}
                themeId={themeId}
                highlightLines={scene.highlightLines}
                dimNonHighlighted={scene.dimNonHighlighted}
                showLineNumbers={scene.showLineNumbers}
                lineStatuses={scene.lineStatuses}
                metrics={codeMetrics}
                onReadyChange={onReadyChange}
              />
            )}
          </EditorFrame>
        </div>
      </div>
    </div>
  )
}
