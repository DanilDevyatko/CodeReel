import {
  CANVAS_PRESETS,
  DEFAULT_PLAYBACK_SETTINGS,
  DEFAULT_THEME_ID,
  type CanvasPreset,
  type CanvasSettings,
  type LineStatus,
  type PlaybackSettings,
  type ProjectDocument,
  type Scene,
  type SceneType,
  type ThemeId,
  type TransitionType,
} from '../../types/scene'
import { createId, parseLineNumberInput } from '../../lib/utils'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSceneType(value: unknown): value is SceneType {
  return value === 'title' || value === 'code' || value === 'text-code' || value === 'placeholder'
}

function isTransitionType(value: unknown): value is TransitionType {
  return value === 'slide' || value === 'fade' || value === 'zoom'
}

function isThemeId(value: unknown): value is ThemeId {
  return value === 'dark-plus' || value === 'catppuccin-mocha' || value === 'nord'
}

function normalizeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function normalizeCanvas(input: unknown): CanvasSettings {
  if (isRecord(input) && input.preset && typeof input.preset === 'string' && input.preset in CANVAS_PRESETS) {
    return CANVAS_PRESETS[input.preset as CanvasPreset]
  }

  return CANVAS_PRESETS['vertical-9:16']
}

function normalizePlayback(input: unknown): PlaybackSettings {
  if (!isRecord(input)) {
    return DEFAULT_PLAYBACK_SETTINGS
  }

  return {
    autoplay: normalizeBoolean(input.autoplay, DEFAULT_PLAYBACK_SETTINGS.autoplay),
    loop: normalizeBoolean(input.loop, DEFAULT_PLAYBACK_SETTINGS.loop),
    slideDurationMs: normalizeNumber(input.slideDurationMs) ?? DEFAULT_PLAYBACK_SETTINGS.slideDurationMs,
    transitionDurationMs:
      normalizeNumber(input.transitionDurationMs) ?? DEFAULT_PLAYBACK_SETTINGS.transitionDurationMs,
    defaultTransition: isTransitionType(input.defaultTransition)
      ? input.defaultTransition
      : DEFAULT_PLAYBACK_SETTINGS.defaultTransition,
  }
}

function normalizeLineStatuses(input: unknown) {
  if (!isRecord(input)) {
    return undefined
  }

  const entries = Object.entries(input).flatMap(([line, status]) => {
    const lineNumber = Number(line)

    if (!Number.isInteger(lineNumber) || lineNumber <= 0) {
      return []
    }

    if (status !== 'added' && status !== 'changed' && status !== 'removed') {
      return []
    }

    return [[lineNumber, status satisfies LineStatus]] as Array<[number, LineStatus]>
  })

  return entries.length ? Object.fromEntries(entries) : undefined
}

function inferSceneType(raw: Record<string, unknown>): SceneType {
  if (isSceneType(raw.type)) {
    return raw.type
  }

  if (typeof raw.placeholderLines === 'number') {
    return 'placeholder'
  }

  if (typeof raw.code === 'string' && typeof raw.body === 'string') {
    return 'text-code'
  }

  if (typeof raw.code === 'string') {
    return 'code'
  }

  return 'title'
}

function normalizeScene(raw: unknown, index: number): Scene {
  if (!isRecord(raw)) {
    return {
      id: createId('scene'),
      type: 'title',
      title: `Scene ${index + 1}`,
      body: 'Invalid scene data was replaced with a title slide.',
    }
  }

  const type = inferSceneType(raw)
  const highlightLines = Array.isArray(raw.highlightLines)
    ? raw.highlightLines
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : typeof raw.highlightLines === 'string'
      ? parseLineNumberInput(raw.highlightLines)
      : []

  const notes = Array.isArray(raw.notes) ? raw.notes.filter((value): value is string => typeof value === 'string') : []

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : createId('scene'),
    type,
    title: normalizeString(raw.title),
    body: normalizeString(raw.body),
    language: normalizeString(raw.language) ?? (type === 'placeholder' ? 'typescript' : undefined),
    code: typeof raw.code === 'string' ? raw.code : undefined,
    highlightLines,
    dimNonHighlighted: normalizeBoolean(raw.dimNonHighlighted),
    filename: normalizeString(raw.filename),
    showLineNumbers: typeof raw.showLineNumbers === 'boolean' ? raw.showLineNumbers : type !== 'title',
    placeholderLines: normalizeNumber(raw.placeholderLines) ?? (type === 'placeholder' ? 10 : undefined),
    placeholderSeed: normalizeNumber(raw.placeholderSeed) ?? (type === 'placeholder' ? index + 1 : undefined),
    transitionToNext: isTransitionType(raw.transitionToNext) ? raw.transitionToNext : undefined,
    durationMs: normalizeNumber(raw.durationMs),
    callout: normalizeString(raw.callout),
    notes,
    lineStatuses: normalizeLineStatuses(raw.lineStatuses),
  }
}

export function createDefaultScene(type: SceneType = 'title'): Scene {
  if (type === 'placeholder') {
    return {
      id: createId('scene'),
      type,
      title: 'Placeholder Slide',
      body: 'Use this when the narration needs a pause before the next real code example.',
      showLineNumbers: true,
      placeholderLines: 10,
      placeholderSeed: 7,
      transitionToNext: 'fade',
    }
  }

  if (type === 'code') {
    return {
      id: createId('scene'),
      type,
      title: 'Code Slide',
      body: 'Drop in the generated code and tune the highlighted lines.',
      language: 'typescript',
      code: "export function hello(name: string) {\n  return `Hello ${name}`\n}",
      highlightLines: [1],
      dimNonHighlighted: true,
      filename: 'example.ts',
      showLineNumbers: true,
      transitionToNext: 'slide',
    }
  }

  if (type === 'text-code') {
    return {
      id: createId('scene'),
      type,
      title: 'Text + Code',
      body: 'Use the text block for the key talking point and the editor for proof.',
      language: 'typescript',
      code: "const total = items.reduce((sum, item) => sum + item.price, 0)",
      highlightLines: [1],
      dimNonHighlighted: false,
      filename: 'summary.ts',
      showLineNumbers: true,
      transitionToNext: 'zoom',
    }
  }

  return {
    id: createId('scene'),
    type: 'title',
    title: 'New Scene',
    body: 'Start with the idea you want on screen.',
    transitionToNext: 'fade',
  }
}

export function cloneScene(scene: Scene): Scene {
  return {
    ...scene,
    id: createId('scene'),
    title: scene.title ? `${scene.title} Copy` : undefined,
  }
}

export function normalizeProjectDocument(input: unknown): ProjectDocument {
  if (!isRecord(input)) {
    throw new Error('Project JSON must be an object.')
  }

  if (!Array.isArray(input.scenes) || input.scenes.length === 0) {
    throw new Error('Project JSON must include a non-empty scenes array.')
  }

  return {
    version: 1,
    title: normalizeString(input.title) ?? 'Untitled CodeScenes Project',
    themeId: isThemeId(input.themeId) ? input.themeId : DEFAULT_THEME_ID,
    canvas: normalizeCanvas(input.canvas),
    playback: normalizePlayback(input.playback),
    scenes: input.scenes.map((scene, index) => normalizeScene(scene, index)),
  }
}

export function stringifyProjectDocument(project: ProjectDocument) {
  return JSON.stringify(project, null, 2)
}
