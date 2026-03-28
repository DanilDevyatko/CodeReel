import type { Scene } from '../types/scene'

interface PlaybackControlsProps {
  isPlaying: boolean
  currentIndex: number
  total: number
  currentScene?: Scene
  compact?: boolean
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onRestart: () => void
}

function ControlButton({
  label,
  onClick,
  strong = false,
  compact = false,
}: {
  label: string
  onClick: () => void
  strong?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border font-medium transition hover:-translate-y-0.5 ${
        compact ? 'px-3.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${
        strong
          ? 'border-sky-400/40 bg-sky-400/16 text-sky-100'
          : 'border-white/12 bg-white/6 text-slate-100 hover:border-white/24'
      }`}
    >
      {label}
    </button>
  )
}

function sceneLabel(scene: Scene | undefined, index: number) {
  if (!scene) {
    return 'No snippet selected'
  }

  if (scene.filename) {
    return scene.filename
  }

  return scene.type === 'placeholder' ? `Placeholder ${index + 1}` : `Snippet ${index + 1}`
}

export function PlaybackControls({
  isPlaying,
  currentIndex,
  total,
  currentScene,
  compact = false,
  onPlayPause,
  onPrevious,
  onNext,
  onRestart,
}: PlaybackControlsProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  return (
    <div
      className={
        compact
          ? 'space-y-3 border-t border-white/8 pt-4'
          : 'space-y-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur'
      }
    >
      <div className={`flex flex-wrap items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
        <ControlButton label={isPlaying ? 'Pause' : 'Play'} onClick={onPlayPause} strong compact={compact} />
        <ControlButton label="Previous" onClick={onPrevious} compact={compact} />
        <ControlButton label="Next" onClick={onNext} compact={compact} />
        <ControlButton label="Restart" onClick={onRestart} compact={compact} />
        <div className="ml-auto text-sm text-slate-300">
          Snippet {Math.min(currentIndex + 1, total || 1)} / {total || 1}
        </div>
      </div>
      <div className={`${compact ? 'h-1.5' : 'h-2'} overflow-hidden rounded-full bg-white/8`}>
        <div className="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className={`flex flex-wrap ${compact ? 'gap-4 text-xs' : 'gap-6 text-sm'} text-slate-300`}>
        <span>{sceneLabel(currentScene, currentIndex)}</span>
        <span>{currentScene?.transitionToNext ?? 'default transition'}</span>
        <span>{(currentScene?.durationMs ?? 0) > 0 ? `${currentScene?.durationMs} ms` : 'global timing'}</span>
      </div>
    </div>
  )
}
