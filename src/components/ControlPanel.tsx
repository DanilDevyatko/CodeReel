import type { ReactNode } from 'react'
import { editorThemes } from '../lib/themes'
import { cn } from '../lib/utils'
import type { CanvasPreset, PlaybackSettings, ThemeId, TransitionType } from '../types/scene'

type ControlPanelVariant = 'inline' | 'drawer'

interface ControlPanelProps {
  projectTitle: string
  themeId: ThemeId
  canvasPreset: CanvasPreset
  playback: PlaybackSettings
  isExportingCurrent: boolean
  isExportingAll: boolean
  variant?: ControlPanelVariant
  onClose?: () => void
  onProjectTitleChange: (title: string) => void
  onThemeChange: (themeId: ThemeId) => void
  onCanvasPresetChange: (preset: CanvasPreset) => void
  onPlaybackChange: <K extends keyof PlaybackSettings>(key: K, value: PlaybackSettings[K]) => void
  onExportCurrent: () => void
  onExportAll: () => void
  onExportJson: () => void
  onLoadSample: () => void
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

function SummaryPill({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-slate-200">
      {value}
    </span>
  )
}

function actionButtonClassName(strong = false) {
  return cn(
    'rounded-full border px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
    strong
      ? 'border-sky-400/40 bg-sky-400/16 text-sky-100'
      : 'border-white/12 bg-white/8 text-slate-100 hover:border-white/24',
  )
}

export function ControlPanel({
  projectTitle,
  themeId,
  canvasPreset,
  playback,
  isExportingCurrent,
  isExportingAll,
  variant = 'inline',
  onClose,
  onProjectTitleChange,
  onThemeChange,
  onCanvasPresetChange,
  onPlaybackChange,
  onExportCurrent,
  onExportAll,
  onExportJson,
  onLoadSample,
}: ControlPanelProps) {
  const isDrawer = variant === 'drawer'
  const summaryProjectTitle = projectTitle.trim() || 'Untitled project'
  const canvasLabel = canvasPreset === 'vertical-9:16' ? '9:16 vertical' : '16:9 horizontal'

  return (
    <section
      className={cn(
        'rounded-[30px] border border-white/10 bg-slate-950/50 p-5 backdrop-blur',
        isDrawer && 'bg-slate-950/92 shadow-[0_28px_90px_rgba(2,6,23,0.5)]',
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-lg font-semibold text-slate-50">{isDrawer ? 'Project Settings' : 'Project Controls'}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isDrawer
              ? 'Tweak project-wide playback, theme, and canvas settings without shrinking preview.'
              : 'Project name, preview defaults, theme, and export actions.'}
          </p>
        </div>
        {isDrawer ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/24"
          >
            Close
          </button>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SummaryPill value={summaryProjectTitle} />
            <SummaryPill value={editorThemes[themeId].label} />
            <SummaryPill value={canvasLabel} />
          </div>
        )}
      </div>

      {!isDrawer ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExportCurrent}
            disabled={isExportingCurrent}
            className={actionButtonClassName(true)}
          >
            {isExportingCurrent ? 'Exporting current...' : 'Export Current PNG'}
          </button>
          <button
            type="button"
            onClick={onExportAll}
            disabled={isExportingAll}
            className={actionButtonClassName()}
          >
            {isExportingAll ? 'Exporting ZIP...' : 'Export All PNGs'}
          </button>
          <button type="button" onClick={onExportJson} className={actionButtonClassName()}>
            Export Metadata JSON
          </button>
          <button type="button" onClick={onLoadSample} className={actionButtonClassName()}>
            Reset Demo
          </button>
        </div>
      ) : null}

      <div className={cn('mt-5 grid gap-4 border-t border-white/8 pt-5', isDrawer ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
        <Field label="Project Title">
          <input className={inputClassName()} value={projectTitle} onChange={(event) => onProjectTitleChange(event.target.value)} />
        </Field>
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
            onChange={(event) => onPlaybackChange('transitionDurationMs', Math.max(100, Number(event.target.value) || 100))}
          />
        </Field>
        <div className={cn('flex items-end gap-3', isDrawer ? 'md:col-span-2' : 'md:col-span-2 xl:col-span-1')}>
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

      {isDrawer ? (
        <div className="mt-5 border-t border-white/8 pt-5">
          <button type="button" onClick={onLoadSample} className={actionButtonClassName()}>
            Reset Demo
          </button>
        </div>
      ) : null}
    </section>
  )
}
