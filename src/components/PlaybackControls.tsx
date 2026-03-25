import type { Scene } from '../types/scene'

interface PlaybackControlsProps {
  isPlaying: boolean
  currentIndex: number
  total: number
  currentScene?: Scene
  onPlayPause: () => void
  onPrevious: () => void
  onNext: () => void
  onRestart: () => void
}

function ControlButton({
  label,
  onClick,
  strong = false,
}: {
  label: string
  onClick: () => void
  strong?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${
        strong
          ? 'border-sky-400/40 bg-sky-400/16 text-sky-100'
          : 'border-white/12 bg-white/6 text-slate-100 hover:border-white/24'
      }`}
    >
      {label}
    </button>
  )
}

export function PlaybackControls({
  isPlaying,
  currentIndex,
  total,
  currentScene,
  onPlayPause,
  onPrevious,
  onNext,
  onRestart,
}: PlaybackControlsProps) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <ControlButton label={isPlaying ? 'Pause' : 'Play'} onClick={onPlayPause} strong />
        <ControlButton label="Previous" onClick={onPrevious} />
        <ControlButton label="Next" onClick={onNext} />
        <ControlButton label="Restart" onClick={onRestart} />
        <div className="ml-auto text-sm text-slate-300">
          Scene {Math.min(currentIndex + 1, total || 1)} / {total || 1}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-sky-400 transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap gap-6 text-sm text-slate-300">
        <span>{currentScene?.title ?? 'Untitled Scene'}</span>
        <span>{currentScene?.transitionToNext ?? 'default transition'}</span>
        <span>{(currentScene?.durationMs ?? 0) > 0 ? `${currentScene?.durationMs} ms` : 'global timing'}</span>
      </div>
    </div>
  )
}
