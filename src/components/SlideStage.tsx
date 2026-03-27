import { forwardRef, useMemo, useState } from 'react'
import { SlideRenderer } from './SlideRenderer'
import type { CanvasSettings, Scene, ThemeId } from '../types/scene'

interface SlideStageProps {
  scene: Scene
  canvas: CanvasSettings
  themeId: ThemeId
}

export const SlideStage = forwardRef<HTMLDivElement, SlideStageProps>(function SlideStage(
  { scene, canvas, themeId },
  ref,
) {
  const renderSignature = useMemo(
    () =>
      JSON.stringify({
        id: scene.id,
        type: scene.type,
        code: scene.code,
        language: scene.language,
        highlightLines: scene.highlightLines,
        dimNonHighlighted: scene.dimNonHighlighted,
        showLineNumbers: scene.showLineNumbers,
        placeholderLines: scene.placeholderLines,
        placeholderSeed: scene.placeholderSeed,
        filename: scene.filename,
        transitionToNext: scene.transitionToNext,
        durationMs: scene.durationMs,
        lineStatuses: scene.lineStatuses,
      }),
    [scene],
  )
  const [readySignature, setReadySignature] = useState(scene.type === 'placeholder' ? renderSignature : '')
  const isReady = scene.type === 'placeholder' || readySignature === renderSignature

  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      data-slide-ready={isReady ? 'true' : 'false'}
      style={{
        width: `${canvas.width}px`,
        height: `${canvas.height}px`,
      }}
    >
      <SlideRenderer
        scene={scene}
        canvas={canvas}
        themeId={themeId}
        onReadyChange={(ready) => {
          setReadySignature(ready ? renderSignature : '')
        }}
      />
    </div>
  )
})
