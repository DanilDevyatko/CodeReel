# CodeReel

CodeReel is a local-first React app for building Carbon-like code visuals as a multi-snippet sequence. You paste or draft snippets locally, preview the slideshow with transitions, and export one PNG or the whole run as a ZIP.

## Workflow

1. Add `code` or `placeholder` snippets in the left rail.
2. Tune filename, language, highlights, placeholder density, timing, and transitions.
3. Preview the active `9:16` or `16:9` canvas on the right.
4. Play the sequence locally with `slide`, `fade`, or `zoom`.
5. Export the current snippet, all snippets, or the project metadata JSON.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Shiki
- Framer Motion
- html-to-image
- JSZip

## Getting started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## What changed in v2

- The app is now snippet-first instead of JSON-first.
- Slides are editor-only visuals; title/body/callout text is no longer rendered on canvas.
- Preview and export share the same fixed-resolution stage, so the browser preview matches exported PNGs.
- Storage migrated from `codescenes.project.v1` to `codereel.project.v2`.

## Project document format

```ts
type SceneType = "code" | "placeholder"
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

interface PlaybackSettings {
  autoplay: boolean
  loop: boolean
  slideDurationMs: number
  transitionDurationMs: number
  defaultTransition: TransitionType
}

interface ProjectDocument {
  version: 2
  title: string
  themeId: "dark-plus" | "catppuccin-mocha" | "nord"
  canvas: CanvasSettings
  playback: PlaybackSettings
  scenes: Scene[]
}
```

## UI overview

- Left side: snippet list plus the selected snippet editor.
- Right side: project controls, live preview, and playback controls.
- Hidden export deck: off-screen fixed-resolution stages used for PNG export.

## Preview/export parity

CodeReel renders preview and export through the same `SlideStage` component. The preview scales that full-resolution stage down to fit the browser, while export captures the unscaled stage at the active canvas size. Export also waits for syntax highlighting and fonts before capture.

## Customization points

- Themes: [src/lib/themes.ts](/C:/Users/Dani/Desktop/CodeReel/src/lib/themes.ts)
- Scene and project types: [src/types/scene.ts](/C:/Users/Dani/Desktop/CodeReel/src/types/scene.ts)
- Stage and renderer: [src/components/SlideStage.tsx](/C:/Users/Dani/Desktop/CodeReel/src/components/SlideStage.tsx) and [src/components/SlideRenderer.tsx](/C:/Users/Dani/Desktop/CodeReel/src/components/SlideRenderer.tsx)
- Playback logic: [src/features/playback/usePlayback.ts](/C:/Users/Dani/Desktop/CodeReel/src/features/playback/usePlayback.ts)

## Export behavior

- `Export Current PNG` captures the selected snippet at the active preset dimensions.
- `Export All PNGs` captures every snippet and downloads one ZIP archive.
- `Export Metadata JSON` downloads the current v2 `ProjectDocument`.
- File names use the snippet index plus filename/type and include `vertical` or `horizontal`.

## Notes

- The visible UI no longer exposes JSON import; metadata JSON is kept as an export/debug format.
- `lineStatuses` are still supported in the renderer and metadata schema, even though the form UI keeps the MVP focused on simpler controls.
- The bundled sample project shows code-only slides for both real snippets and placeholder beats.

## Next steps

- Add drag-and-drop snippet reordering.
- Add a lightbox or split-screen export parity inspector.
- Add richer diff editing for `lineStatuses`.
- Add frame-sequence presets for Remotion or FFmpeg pipelines.
