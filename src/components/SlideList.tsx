import { useEffect, useRef } from 'react'
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
  code: 'Code',
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

function buildSceneLabel(scene: Scene, index: number) {
  if (scene.filename) {
    return scene.filename
  }

  return scene.type === 'placeholder' ? `Placeholder ${index + 1}` : `Snippet ${index + 1}`
}

function resolveSceneLanguage(language: string | undefined) {
  const normalized = language?.trim()
  return normalized || 'typescript'
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
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const selectedIndex = scenes.findIndex((scene) => scene.id === selectedSceneId)

  useEffect(() => {
    if (!selectedSceneId) {
      return undefined
    }

    const selectedNode = itemRefs.current[selectedSceneId]

    if (!selectedNode) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      selectedNode.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [selectedIndex, selectedSceneId, scenes.length])

  return (
    <section className="flex min-h-0 flex-col rounded-[30px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur xl:h-full xl:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <div>
          <h2 className="m-0 text-lg font-semibold">Snippet List</h2>
          <p className="mt-1 text-sm text-slate-400">Add, reorder, duplicate, and clean up your export sequence.</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <IconButton label="+ Code" onClick={() => onAdd('code')} />
          <IconButton label="+ Placeholder" onClick={() => onAdd('placeholder')} />
        </div>
      </div>
      <div className="scrollbar-thin mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 xl:pr-2" style={{ scrollPaddingBlock: '12px' }}>
        {scenes.map((scene, index) => {
          const selected = scene.id === selectedSceneId

          return (
            <div
              key={scene.id}
              ref={(node) => {
                itemRefs.current[scene.id] = node
              }}
              className={cn(
                'cursor-pointer rounded-[24px] border p-4 transition',
                selected
                  ? 'border-sky-400/35 bg-sky-400/12 shadow-[0_14px_40px_rgba(56,189,248,0.14)]'
                  : 'border-white/8 bg-white/4 hover:border-white/16 hover:bg-white/6',
              )}
              onClick={() => onSelect(scene.id)}
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                  {String(index + 1).padStart(2, '0')} - {sceneTypeLabels[scene.type]}
                </div>
                <div className="mt-1 truncate text-base font-semibold text-slate-50">{buildSceneLabel(scene, index)}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {scene.type === 'placeholder'
                    ? `${scene.placeholderLines ?? 10} placeholder lines`
                    : resolveSceneLanguage(scene.language)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                {scene.highlightLines?.length ? <span>{scene.highlightLines.length} highlights</span> : null}
                {scene.transitionToNext ? <span>{scene.transitionToNext}</span> : null}
                {scene.showLineNumbers ? <span>line numbers</span> : <span>no numbers</span>}
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
