import { CodeBlock, type CodeBlockMetrics } from './CodeBlock'
import { EditorFrame, type EditorFrameMetrics } from './EditorFrame'
import { PlaceholderCodeBlock } from './PlaceholderCodeBlock'
import { editorThemes } from '../lib/themes'
import type { CanvasSettings, Scene, ThemeId } from '../types/scene'

interface SlideRendererProps {
  scene: Scene
  canvas: CanvasSettings
  themeId: ThemeId
  onReadyChange?: (ready: boolean) => void
}

interface SlideLayoutMetrics {
  frameWidth: number
  frameHeight: number
  frameMaxWidth: number
  frameOffsetY: number
  frameMetrics: EditorFrameMetrics
  codeMetrics: CodeBlockMetrics
}

function getSlideLayoutMetrics(canvas: CanvasSettings): SlideLayoutMetrics {
  const isVertical = canvas.preset === 'vertical-9:16'

  if (isVertical) {
    return {
      frameWidth: Math.round(canvas.width * 0.84),
      frameHeight: Math.round(canvas.height * 0.69),
      frameMaxWidth: Math.round(canvas.width * 0.84),
      frameOffsetY: -18,
      frameMetrics: {
        radius: 44,
        chromeHeight: 76,
        chromePaddingX: 34,
        trafficLightSize: 16,
        titleFontSize: 18,
      },
      codeMetrics: {
        contentPadding: 38,
        fontSize: 28,
        lineHeight: 1.56,
        lineNumberWidth: 60,
        rowGap: 6,
        rowRadius: 18,
      },
    }
  }

  return {
    frameWidth: Math.round(canvas.width * 0.82),
    frameHeight: Math.round(canvas.height * 0.72),
    frameMaxWidth: Math.round(canvas.width * 0.82),
    frameOffsetY: 0,
    frameMetrics: {
      radius: 40,
      chromeHeight: 74,
      chromePaddingX: 34,
      trafficLightSize: 15,
      titleFontSize: 17,
    },
    codeMetrics: {
      contentPadding: 36,
      fontSize: 26,
      lineHeight: 1.52,
      lineNumberWidth: 56,
      rowGap: 6,
      rowRadius: 16,
    },
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
            chromeLabel={scene.language}
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
                metrics={metrics.codeMetrics}
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
                metrics={metrics.codeMetrics}
                onReadyChange={onReadyChange}
              />
            )}
          </EditorFrame>
        </div>
      </div>
    </div>
  )
}
