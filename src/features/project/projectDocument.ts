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

type LegacySceneType = 'title' | 'text-code'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSceneType(value: unknown): value is SceneType {
  return value === 'code' || value === 'placeholder'
}

function isLegacySceneType(value: unknown): value is LegacySceneType {
  return value === 'title' || value === 'text-code'
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
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
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

  if (isLegacySceneType(raw.type)) {
    return raw.type === 'title' ? 'placeholder' : 'code'
  }

  if (typeof raw.placeholderLines === 'number') {
    return 'placeholder'
  }

  if (typeof raw.code === 'string') {
    return 'code'
  }

  return 'placeholder'
}

function normalizeHighlightLines(input: unknown) {
  if (Array.isArray(input)) {
    return input.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0)
  }

  if (typeof input === 'string') {
    return parseLineNumberInput(input)
  }

  return []
}

function normalizeScene(raw: unknown, index: number): Scene {
  if (!isRecord(raw)) {
    return {
      id: createId('scene'),
      type: 'placeholder',
      showLineNumbers: true,
      placeholderLines: 10,
      placeholderSeed: index + 1,
      transitionToNext: 'fade',
    }
  }

  const type = inferSceneType(raw)
  const placeholderLines = Math.max(1, normalizeNumber(raw.placeholderLines) ?? 10)

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : createId('scene'),
    type,
    language: normalizeString(raw.language) ?? (type === 'placeholder' ? 'typescript' : 'typescript'),
    code: typeof raw.code === 'string' ? raw.code : undefined,
    highlightLines: normalizeHighlightLines(raw.highlightLines),
    dimNonHighlighted: normalizeBoolean(raw.dimNonHighlighted),
    filename: normalizeString(raw.filename),
    showLineNumbers: typeof raw.showLineNumbers === 'boolean' ? raw.showLineNumbers : true,
    placeholderLines: type === 'placeholder' ? placeholderLines : undefined,
    placeholderSeed: normalizeNumber(raw.placeholderSeed) ?? index + 1,
    transitionToNext: isTransitionType(raw.transitionToNext) ? raw.transitionToNext : undefined,
    durationMs: normalizeNumber(raw.durationMs),
    lineStatuses: normalizeLineStatuses(raw.lineStatuses),
  }
}

export function createDefaultScene(type: SceneType = 'code', index = 0): Scene {
  if (type === 'placeholder') {
    return {
      id: createId('scene'),
      type,
      language: 'typescript',
      showLineNumbers: true,
      placeholderLines: 10,
      placeholderSeed: index + 1,
      highlightLines: [3, 4],
      dimNonHighlighted: true,
      transitionToNext: 'fade',
    }
  }

  return {
    id: createId('scene'),
    type: 'code',
    language: 'typescript',
    code: [
      'export function groupByTag(items: Item[]) {',
      '  return items.reduce<Record<string, Item[]>>((acc, item) => {',
      '    const key = item.tag ?? "untagged"',
      '    acc[key] ??= []',
      '    acc[key].push(item)',
      '    return acc',
      '  }, {})',
      '}',
    ].join('\n'),
    filename: `snippet-${index + 1}.ts`,
    highlightLines: [2, 3, 4, 5],
    dimNonHighlighted: true,
    showLineNumbers: true,
    transitionToNext: 'slide',
  }
}

export function cloneScene(scene: Scene): Scene {
  return {
    ...scene,
    id: createId('scene'),
    filename: scene.filename ? `${scene.filename.replace(/\.[^.]+$/, '')}-copy${scene.filename.match(/\.[^.]+$/)?.[0] ?? ''}` : undefined,
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
    version: 2,
    title: normalizeString(input.title) ?? 'Untitled CodeReel Project',
    themeId: isThemeId(input.themeId) ? input.themeId : DEFAULT_THEME_ID,
    canvas: normalizeCanvas(input.canvas),
    playback: normalizePlayback(input.playback),
    scenes: input.scenes.map((scene, index) => normalizeScene(scene, index)),
  }
}

export function stringifyProjectDocument(project: ProjectDocument) {
  return JSON.stringify(project, null, 2)
}
