import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SlideStage } from './SlideStage'
import { getSlideFrameBounds } from '../lib/slideLayout'
import { cn } from '../lib/utils'
import type { CanvasSettings, Scene, ThemeId, TransitionType } from '../types/scene'

export type PreviewMode = 'fit' | 'read'

interface SlidePreviewProps {
  scene: Scene | undefined
  canvas: CanvasSettings
  themeId: ThemeId
  transition: TransitionType
  direction: 1 | -1
  transitionDurationMs: number
  mode: PreviewMode
  onModeChange: (mode: PreviewMode) => void
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
  mode,
  onModeChange,
}: SlidePreviewProps) {
  const [containerRef, containerSize] = useElementSize<HTMLDivElement>()
  const isVerticalCanvas = canvas.preset === 'vertical-9:16'
  const isReadMode = mode === 'read' && isVerticalCanvas
  const fitScale = useMemo(() => {
    if (!containerSize.width || !containerSize.height) {
      return 0
    }

    return Math.min(containerSize.width / canvas.width, containerSize.height / canvas.height, 1)
  }, [canvas.height, canvas.width, containerSize.height, containerSize.width])
  const readScale = useMemo(() => {
    if (!containerSize.width) {
      return 0
    }

    return Math.min(Math.max(containerSize.width - 16, 0) / canvas.width, 1)
  }, [canvas.width, containerSize.width])
  const scale = isReadMode ? readScale : fitScale
  const viewportWidth = Math.round(canvas.width * scale)
  const viewportHeight = Math.round(canvas.height * scale)
  const frameBounds = useMemo(() => getSlideFrameBounds(canvas), [canvas])
  const modeOptions = isVerticalCanvas
    ? ([
        { value: 'read', label: 'Read' },
        { value: 'fit', label: 'Fit' },
      ] as const)
    : ([{ value: 'fit', label: 'Fit' }] as const)

  useEffect(() => {
    const container = containerRef.current

    if (!container || !scene || !scale) {
      return
    }

    if (!isReadMode) {
      container.scrollTo({ left: 0, top: 0, behavior: 'auto' })
      return
    }

    container.scrollTo({
      left: Math.max(0, (viewportWidth - container.clientWidth) / 2),
      top: Math.max(
        0,
        frameBounds.top * scale - Math.max(0, (container.clientHeight - frameBounds.height * scale) / 2),
      ),
      behavior: 'auto',
    })
  }, [containerRef, frameBounds.height, frameBounds.top, isReadMode, scale, scene, viewportWidth])

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute right-4 top-4 z-20 flex gap-2">
        {modeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onModeChange(option.value)}
            className={cn(
              'pointer-events-auto rounded-full border px-3 py-1.5 text-xs font-medium transition',
              mode === option.value
                ? 'border-sky-400/40 bg-sky-400/16 text-sky-100'
                : 'border-white/12 bg-slate-950/72 text-slate-200 hover:border-white/24',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        className={cn(
          'scrollbar-thin h-full w-full',
          isReadMode ? 'overflow-auto' : 'overflow-hidden',
        )}
      >
        {scene && scale > 0 ? (
          <div
            className={cn(
              'flex min-h-full min-w-full justify-center',
              isReadMode ? 'items-start p-2 xl:px-2 xl:py-1' : 'items-center p-4 xl:p-2',
            )}
          >
            <div
              className="relative flex-none overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/50 shadow-[0_28px_90px_rgba(2,6,23,0.48)]"
              style={{ width: `${viewportWidth}px`, height: `${viewportHeight}px` }}
            >
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
          </div>
        ) : null}
      </div>
    </div>
  )
}
