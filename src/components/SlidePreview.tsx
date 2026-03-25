import { AnimatePresence, motion } from 'framer-motion'
import { SlideRenderer } from './SlideRenderer'
import { cn } from '../lib/utils'
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
      enter: { opacity: 0, scale: 0.94 },
      center: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.04 },
    }
  }

  return {
    enter: (direction: 1 | -1) => ({ opacity: 0.75, x: direction > 0 ? '18%' : '-18%' }),
    center: { opacity: 1, x: '0%' },
    exit: (direction: 1 | -1) => ({ opacity: 0.75, x: direction > 0 ? '-18%' : '18%' }),
  }
}

export function SlidePreview({
  scene,
  canvas,
  themeId,
  transition,
  direction,
  transitionDurationMs,
}: SlidePreviewProps) {
  const widthClass = canvas.preset === 'vertical-9:16' ? 'max-w-[420px]' : 'max-w-[960px]'

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className={cn('w-full', widthClass)}>
        <div className="rounded-[38px] border border-white/10 bg-black/20 p-4 shadow-[0_40px_120px_rgba(2,6,23,0.55)]">
          <div
            className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/70"
            style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}
          >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              {scene ? (
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
                  <SlideRenderer scene={scene} canvas={canvas} themeId={themeId} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
