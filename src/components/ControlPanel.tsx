import type { ReactNode } from 'react'
import { editorThemes } from '../lib/themes'
import type { CanvasPreset, PlaybackSettings, ThemeId, TransitionType } from '../types/scene'

interface ControlPanelProps {
  themeId: ThemeId
  canvasPreset: CanvasPreset
  playback: PlaybackSettings
  isExportingCurrent: boolean
  isExportingAll: boolean
  onThemeChange: (themeId: ThemeId) => void
  onCanvasPresetChange: (preset: CanvasPreset) => void
  onPlaybackChange: <K extends keyof PlaybackSettings>(key: K, value: PlaybackSettings[K]) => void
  onExportCurrent: () => void
  onExportAll: () => void
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

function inputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-50 outline-none transition focus:border-sky-400/35'
}

export function ControlPanel({
  themeId,
  canvasPreset,
  playback,
  isExportingCurrent,
  isExportingAll,
  onThemeChange,
  onCanvasPresetChange,
  onPlaybackChange,
  onExportCurrent,
  onExportAll,
}: ControlPanelProps) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur">
      <div>
        <h2 className="m-0 text-lg font-semibold text-slate-50">Project Controls</h2>
        <p className="mt-1 text-sm text-slate-400">Theme, canvas preset, playback defaults, and export actions.</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Theme">
          <select
            className={inputClassName()}
            value={themeId}
            onChange={(event) => onThemeChange(event.target.value as ThemeId)}
          >
            {Object.values(editorThemes).map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Canvas">
          <select
            className={inputClassName()}
            value={canvasPreset}
            onChange={(event) => onCanvasPresetChange(event.target.value as CanvasPreset)}
          >
            <option value="vertical-9:16">9:16 vertical</option>
            <option value="horizontal-16:9">16:9 horizontal</option>
          </select>
        </Field>
        <Field label="Default Transition">
          <select
            className={inputClassName()}
            value={playback.defaultTransition}
            onChange={(event) => onPlaybackChange('defaultTransition', event.target.value as TransitionType)}
          >
            <option value="slide">slide</option>
            <option value="fade">fade</option>
            <option value="zoom">zoom</option>
          </select>
        </Field>
        <Field label="Slide Duration (ms)">
          <input
            type="number"
            min={500}
            step={100}
            className={inputClassName()}
            value={playback.slideDurationMs}
            onChange={(event) => onPlaybackChange('slideDurationMs', Math.max(500, Number(event.target.value) || 500))}
          />
        </Field>
        <Field label="Transition Duration (ms)">
          <input
            type="number"
            min={100}
            step={50}
            className={inputClassName()}
            value={playback.transitionDurationMs}
            onChange={(event) =>
              onPlaybackChange('transitionDurationMs', Math.max(100, Number(event.target.value) || 100))
            }
          />
        </Field>
        <div className="flex items-end gap-3">
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={playback.autoplay}
              onChange={(event) => onPlaybackChange('autoplay', event.target.checked)}
            />
            Autoplay
          </label>
          <label className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={playback.loop}
              onChange={(event) => onPlaybackChange('loop', event.target.checked)}
            />
            Loop
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExportCurrent}
          disabled={isExportingCurrent}
          className="rounded-full border border-sky-400/40 bg-sky-400/16 px-5 py-2.5 text-sm font-medium text-sky-100 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportingCurrent ? 'Exporting current…' : 'Export Current PNG'}
        </button>
        <button
          type="button"
          onClick={onExportAll}
          disabled={isExportingAll}
          className="rounded-full border border-white/12 bg-white/8 px-5 py-2.5 text-sm font-medium text-slate-100 transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportingAll ? 'Exporting ZIP…' : 'Export All PNGs'}
        </button>
      </div>
    </section>
  )
}
