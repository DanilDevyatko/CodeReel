import { useEffect, useState, type ReactNode } from 'react'
import { formatLineNumberInput, parseLineNumberInput } from '../lib/utils'
import type { Scene, SceneType, TransitionType } from '../types/scene'

interface SceneEditorProps {
  scene: Scene | undefined
  sceneIndex: number
  onUpdate: (sceneId: string, patch: Partial<Scene>) => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">{label}</span>
      {children}
    </label>
  )
}

function inputClassName(multiline = false) {
  return `w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-sky-400/35 ${
    multiline ? 'min-h-[120px]' : ''
  }`
}

const sceneTypes: SceneType[] = ['code', 'placeholder']
const transitions: Array<TransitionType | 'default'> = ['default', 'slide', 'fade', 'zoom']

function normalizeTabLabel(value: string) {
  const nextValue = value.trim()
  return nextValue ? nextValue : undefined
}

function normalizeLanguage(value: string) {
  const nextValue = value.trim()
  return nextValue ? nextValue : 'typescript'
}

export function SceneEditor({ scene, sceneIndex, onUpdate }: SceneEditorProps) {
  if (!scene) {
    return (
      <section className="rounded-[30px] border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400 backdrop-blur xl:flex xl:h-[clamp(360px,38vh,520px)] xl:min-h-0 xl:flex-col">
        Select a snippet to edit it.
      </section>
    )
  }

  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur xl:flex xl:h-[clamp(360px,38vh,520px)] xl:min-h-0 xl:flex-col">
      <div>
        <h2 className="m-0 text-lg font-semibold text-slate-50">Snippet Editor</h2>
        <p className="mt-1 text-sm text-slate-400">Keep the active snippet editable without leaving the preview workflow.</p>
      </div>
      <div className="scrollbar-thin mt-5 space-y-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select
              className={inputClassName()}
              value={scene.type}
              onChange={(event) => onUpdate(scene.id, { type: event.target.value as SceneType })}
            >
              {sceneTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tab Label">
            <input
              className={inputClassName()}
              placeholder={`snippet-${sceneIndex + 1}.ts`}
              value={scene.filename ?? ''}
              onChange={(event) => onUpdate(scene.id, { filename: normalizeTabLabel(event.target.value) })}
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Language">
            <input
              className={inputClassName()}
              value={scene.language ?? 'typescript'}
              onChange={(event) => onUpdate(scene.id, { language: normalizeLanguage(event.target.value) })}
            />
          </Field>
          <Field label="Highlight Lines">
            <HighlightLinesInput
              key={scene.id}
              initialValue={formatLineNumberInput(scene.highlightLines)}
              onChange={(value) => onUpdate(scene.id, { highlightLines: parseLineNumberInput(value) })}
            />
          </Field>
        </div>

        {scene.type === 'placeholder' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Placeholder Lines">
              <input
                type="number"
                min={1}
                className={inputClassName()}
                value={scene.placeholderLines ?? 10}
                onChange={(event) =>
                  onUpdate(scene.id, { placeholderLines: Math.max(1, Number(event.target.value) || 1) })
                }
              />
            </Field>
            <Field label="Seed">
              <input
                type="number"
                className={inputClassName()}
                value={scene.placeholderSeed ?? sceneIndex + 1}
                onChange={(event) => onUpdate(scene.id, { placeholderSeed: Number(event.target.value) || 1 })}
              />
            </Field>
          </div>
        ) : (
          <Field label="Code">
            <textarea
              className={`${inputClassName(true)} min-h-[280px] xl:min-h-[360px] font-editor`}
              value={scene.code ?? ''}
              onChange={(event) => onUpdate(scene.id, { code: event.target.value })}
            />
          </Field>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Transition">
            <select
              className={inputClassName()}
              value={scene.transitionToNext ?? 'default'}
              onChange={(event) =>
                onUpdate(scene.id, {
                  transitionToNext:
                    event.target.value === 'default' ? undefined : (event.target.value as TransitionType),
                })
              }
            >
              {transitions.map((transition) => (
                <option key={transition} value={transition}>
                  {transition}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (ms)">
            <input
              type="number"
              min={500}
              step={100}
              className={inputClassName()}
              value={scene.durationMs ?? ''}
              onChange={(event) =>
                onUpdate(scene.id, {
                  durationMs: event.target.value ? Math.max(500, Number(event.target.value)) : undefined,
                })
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={scene.showLineNumbers ?? true}
              onChange={(event) => onUpdate(scene.id, { showLineNumbers: event.target.checked })}
            />
            Show line numbers
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={scene.dimNonHighlighted ?? false}
              onChange={(event) => onUpdate(scene.id, { dimNonHighlighted: event.target.checked })}
            />
            Dim non-highlighted lines
          </label>
        </div>
      </div>
    </section>
  )
}

function HighlightLinesInput({
  initialValue,
  onChange,
}: {
  initialValue: string
  onChange: (value: string) => void
}) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <input
      className={inputClassName()}
      value={value}
      placeholder="1, 3, 5-7"
      onChange={(event) => {
        const nextValue = event.target.value
        setValue(nextValue)
        onChange(nextValue)
      }}
    />
  )
}
