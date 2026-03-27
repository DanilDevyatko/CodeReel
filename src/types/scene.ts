export type SceneType = 'code' | 'placeholder'

export type TransitionType = 'slide' | 'fade' | 'zoom'

export type LineStatus = 'added' | 'changed' | 'removed'

export type CanvasPreset = 'vertical-9:16' | 'horizontal-16:9'

export type ThemeId = 'dark-plus' | 'catppuccin-mocha' | 'nord'

export interface CanvasSettings {
  preset: CanvasPreset
  width: number
  height: number
}

export interface Scene {
  id: string
  type: SceneType
  language?: string
  code?: string
  highlightLines?: number[]
  dimNonHighlighted?: boolean
  filename?: string
  showLineNumbers?: boolean
  placeholderLines?: number
  placeholderSeed?: number
  transitionToNext?: TransitionType
  durationMs?: number
  lineStatuses?: Record<number, LineStatus>
}

export interface PlaybackSettings {
  autoplay: boolean
  loop: boolean
  slideDurationMs: number
  transitionDurationMs: number
  defaultTransition: TransitionType
}

export interface ProjectDocument {
  version: 2
  title: string
  themeId: ThemeId
  canvas: CanvasSettings
  playback: PlaybackSettings
  scenes: Scene[]
}

export const CANVAS_PRESETS: Record<CanvasPreset, CanvasSettings> = {
  'vertical-9:16': {
    preset: 'vertical-9:16',
    width: 1080,
    height: 1920,
  },
  'horizontal-16:9': {
    preset: 'horizontal-16:9',
    width: 1920,
    height: 1080,
  },
}

export const THEME_IDS: ThemeId[] = ['dark-plus', 'catppuccin-mocha', 'nord']

export const DEFAULT_PLAYBACK_SETTINGS: PlaybackSettings = {
  autoplay: false,
  loop: true,
  slideDurationMs: 3600,
  transitionDurationMs: 800,
  defaultTransition: 'slide',
}

export const DEFAULT_THEME_ID: ThemeId = 'dark-plus'
