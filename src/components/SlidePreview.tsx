import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SlideStage } from './SlideStage'
import type { CanvasSettings, Scene, ThemeId, TransitionType } from '../types/scene'

interface SlidePreviewProps {
  scene: Scene | undefined
  canvas: CanvasSettings
  themeId: ThemeId
  transition: TransitionType
  direction: 1 | -1
  transitionDurationMs: number
}

function getVariants(transition: TransitionType) {
  if (transition === 'fade') {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1 },
      exit: { opacity: 0 },
    }
  }

  if (transition === 'zoom') {
    return {
      enter: { opacity: 0, scale: 0.95 },
      center: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.04 },
    }
  }

  return {
    enter: (direction: 1 | -1) => ({ opacity: 0.72, x: direction > 0 ? canvasShift(0.18) : canvasShift(-0.18) }),
    center: { opacity: 1, x: 0 },
    exit: (direction: 1 | -1) => ({ opacity: 0.72, x: direction > 0 ? canvasShift(-0.18) : canvasShift(0.18) }),
  }
}

function canvasShift(multiplier: number) {
  return `${multiplier * 100}%`
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]

      if (!entry) {
        return
      }

      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}

export function SlidePreview({
  scene,
  canvas,
  themeId,
  transition,
  direction,
  transitionDurationMs,
}: SlidePreviewProps) {
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>()
  const scale = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return 0
    }

    return Math.min(containerSize.width / canvas.width, containerSize.height / canvas.height, 1)
  }, [canvas.height, canvas.width, containerSize.height, containerSize.width])
  const scaledWidth = canvas.width * scale
  const scaledHeight = canvas.height * scale

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-hidden rounded-[28px]">
      {scene && scale > 0 ? (
        <div className="relative overflow-hidden" style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}>
          <div
            className="absolute left-0 top-0 origin-top-left"
            style={{
              width: `${canvas.width}px`,
              height: `${canvas.height}px`,
              transform: `scale(${scale})`,
            }}
          >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={scene.id}
                custom={direction}
                variants={getVariants(transition)}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: transitionDurationMs / 1_000, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <SlideStage scene={scene} canvas={canvas} themeId={themeId} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : null}
    </div>
  )
}
