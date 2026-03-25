# CodeScenes

CodeScenes is a local-first React app for editing, previewing, and exporting code-focused slides from pre-generated `ProjectDocument` JSON. The intended workflow is:

1. Use Codex to turn an article or outline into scene JSON.
2. Paste or import that JSON into CodeScenes.
3. Tweak scene content, playback, theme, and canvas preset.
4. Preview the slideshow locally.
5. Export the current slide or every slide as PNGs in one ZIP.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shiki
- Framer Motion
- html-to-image
- JSZip

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## What the App Does

- Imports or pastes a typed `ProjectDocument` JSON payload.
- Renders title, code, text-code, and placeholder scenes.
- Uses Shiki for syntax highlighting.
- Supports line highlighting, dimmed context, and diff-style line states.
- Plays scenes automatically with `slide`, `fade`, or `zoom` transitions.
- Exports the active scene as PNG.
- Exports all scenes as PNG files bundled into one ZIP.
- Supports both `9:16 vertical` and `16:9 horizontal` presets.

## ProjectDocument Format

```ts
type SceneType = "title" | "code" | "text-code" | "placeholder"
type TransitionType = "slide" | "fade" | "zoom"
type LineStatus = "added" | "changed" | "removed"
type CanvasPreset = "vertical-9:16" | "horizontal-16:9"

interface CanvasSettings {
  preset: CanvasPreset
  width: number
  height: number
}

interface Scene {
  id: string
  type: SceneType
  title?: string
  body?: string
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
  callout?: string
  notes?: string[]
  lineStatuses?: Record<number, LineStatus>
}

interface PlaybackSettings {
  autoplay: boolean
  loop: boolean
  slideDurationMs: number
  transitionDurationMs: number
  defaultTransition: TransitionType
}

interface ProjectDocument {
  version: 1
  title: string
  themeId: "dark-plus" | "catppuccin-mocha" | "nord"
  canvas: CanvasSettings
  playback: PlaybackSettings
  scenes: Scene[]
}
```

## External Codex Workflow

CodeScenes intentionally does not parse Markdown or generate scenes internally. Codex is expected to produce the JSON contract above. The app is optimized for the second half of the workflow:

- import JSON
- refine scenes visually
- reorder and tweak timing
- preview transitions
- export final frames

## UI Overview

- Left panel: project JSON import/edit plus selected-scene form editor
- Right panel: project controls, live animated preview, scene list, playback controls
- Hidden export stage: off-screen full-resolution scene rendering used for consistent PNG output

## Theme and Canvas Customization

- Theme definitions live in [src/lib/themes.ts](/C:/Users/d_deviatko/Desktop/CodeReel/src/lib/themes.ts)
- Scene and project types live in [src/types/scene.ts](/C:/Users/d_deviatko/Desktop/CodeReel/src/types/scene.ts)
- The sample project lives in [src/data/sampleProject.ts](/C:/Users/d_deviatko/Desktop/CodeReel/src/data/sampleProject.ts)
- The main app wiring lives in [src/app/App.tsx](/C:/Users/d_deviatko/Desktop/CodeReel/src/app/App.tsx)

## Export Behavior

- `Export Current PNG` captures the selected scene at the active preset dimensions.
- `Export All PNGs` captures every scene and downloads a single ZIP archive.
- File names follow a deterministic pattern such as `01-intro-vertical.png`.
- Export uses the active canvas preset, so changing presets changes both preview and output.

## Limitations of the MVP

- No drag-and-drop scene reordering. Use move up/down controls.
- No built-in Markdown-to-scene parsing.
- No video export yet, only frame export.
- No rich diff editor for per-line status editing; `lineStatuses` is still supported in JSON.
- Large projects with many scenes will export more slowly because all frames are rendered client-side.

## Logical Next Steps

- Add drag-and-drop scene reordering.
- Add richer scene validation and inline JSON diagnostics.
- Add per-line diff editing in the form UI.
- Add custom canvas sizes beyond the two presets.
- Add frame sequence export settings for Remotion or FFmpeg workflows.
