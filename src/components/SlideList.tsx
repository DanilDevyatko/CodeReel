import { cn } from '../lib/utils'
import type { Scene, SceneType } from '../types/scene'

interface SlideListProps {
  scenes: Scene[]
  selectedSceneId?: string
  onSelect: (sceneId: string) => void
  onAdd: (type: SceneType) => void
  onDuplicate: (sceneId: string) => void
  onDelete: (sceneId: string) => void
  onMove: (sceneId: string, direction: -1 | 1) => void
}

const sceneTypeLabels: Record<SceneType, string> = {
  title: 'Title',
  code: 'Code',
  'text-code': 'Text + Code',
  placeholder: 'Placeholder',
}

function IconButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/20"
    >
      {label}
    </button>
  )
}

export function SlideList({
  scenes,
  selectedSceneId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: SlideListProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-[30px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold">Scene List</h2>
          <p className="mt-1 text-sm text-slate-400">Compact cards for reorder, duplicate, and cleanup.</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <IconButton label="+ Title" onClick={() => onAdd('title')} />
          <IconButton label="+ Code" onClick={() => onAdd('code')} />
          <IconButton label="+ Text+Code" onClick={() => onAdd('text-code')} />
          <IconButton label="+ Placeholder" onClick={() => onAdd('placeholder')} />
        </div>
      </div>
      <div className="scrollbar-thin mt-5 flex-1 space-y-3 overflow-auto pr-1">
        {scenes.map((scene, index) => {
          const selected = scene.id === selectedSceneId

          return (
            <div
              key={scene.id}
              className={cn(
                'cursor-pointer rounded-[24px] border p-4 transition',
                selected
                  ? 'border-sky-400/35 bg-sky-400/12 shadow-[0_14px_40px_rgba(56,189,248,0.14)]'
                  : 'border-white/8 bg-white/4 hover:border-white/16 hover:bg-white/6',
              )}
              onClick={() => onSelect(scene.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                    {String(index + 1).padStart(2, '0')} · {sceneTypeLabels[scene.type]}
                  </div>
                  <div className="mt-1 truncate text-base font-semibold text-slate-50">
                    {scene.title ?? 'Untitled Scene'}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {scene.body ?? scene.filename ?? scene.language ?? 'No description yet'}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                {scene.filename ? <span>{scene.filename}</span> : null}
                {scene.highlightLines?.length ? <span>{scene.highlightLines.length} highlights</span> : null}
                {scene.transitionToNext ? <span>{scene.transitionToNext}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <IconButton label="Up" onClick={() => onMove(scene.id, -1)} />
                <IconButton label="Down" onClick={() => onMove(scene.id, 1)} />
                <IconButton label="Duplicate" onClick={() => onDuplicate(scene.id)} />
                <IconButton label="Delete" onClick={() => onDelete(scene.id)} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
