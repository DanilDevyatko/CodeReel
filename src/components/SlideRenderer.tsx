import { CodeBlock } from './CodeBlock'
import { EditorFrame } from './EditorFrame'
import { PlaceholderCodeBlock } from './PlaceholderCodeBlock'
import { editorThemes } from '../lib/themes'
import { cn } from '../lib/utils'
import type { CanvasSettings, Scene, ThemeId } from '../types/scene'

interface SlideRendererProps {
  scene: Scene
  canvas: CanvasSettings
  themeId: ThemeId
}

function SlideBackdrop({ themeId }: { themeId: ThemeId }) {
  const theme = editorThemes[themeId]

  return (
    <>
      <div className="absolute inset-0" style={{ background: theme.canvasBackground }} />
      <div
        className="absolute -left-16 top-20 h-72 w-72 rounded-full blur-3xl"
        style={{ background: theme.accentSoft }}
      />
      <div
        className="absolute bottom-8 right-6 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${theme.accent}22` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
    </>
  )
}

function SceneNotes({ notes, accent }: { notes: string[] | undefined; accent: string }) {
  if (!notes?.length) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3">
      {notes.map((note) => (
        <span
          key={note}
          className="rounded-full border px-4 py-2 text-sm font-medium tracking-[0.14em] uppercase"
          style={{
            borderColor: `${accent}33`,
            background: `${accent}14`,
          }}
        >
          {note}
        </span>
      ))}
    </div>
  )
}

export function SlideRenderer({ scene, canvas, themeId }: SlideRendererProps) {
  const theme = editorThemes[themeId]
  const isVertical = canvas.preset === 'vertical-9:16'
  const contentGap = isVertical ? 'gap-10' : 'gap-12'

  const editor = (
    <EditorFrame filename={scene.filename} chromeLabel={scene.language} theme={theme} className="h-full">
      {scene.type === 'placeholder' ? (
        <PlaceholderCodeBlock
          count={scene.placeholderLines ?? 10}
          seed={scene.placeholderSeed}
          highlightLines={scene.highlightLines}
          showLineNumbers={scene.showLineNumbers}
          themeId={themeId}
        />
      ) : (
        <CodeBlock
          code={scene.code ?? ''}
          language={scene.language}
          themeId={themeId}
          highlightLines={scene.highlightLines}
          dimNonHighlighted={scene.dimNonHighlighted}
          showLineNumbers={scene.showLineNumbers}
          lineStatuses={scene.lineStatuses}
        />
      )}
    </EditorFrame>
  )

  if (scene.type === 'title') {
    return (
      <div className="relative h-full w-full overflow-hidden" style={{ color: theme.textPrimary }}>
        <SlideBackdrop themeId={themeId} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-16 py-16 text-center">
          <div
            className="mb-8 rounded-full border px-5 py-2 text-sm font-semibold tracking-[0.24em] uppercase"
            style={{
              borderColor: `${theme.accent}44`,
              background: `${theme.accent}12`,
              color: theme.accent,
            }}
          >
            CodeScenes
          </div>
          <h1 className="m-0 max-w-4xl text-8xl font-semibold leading-[0.95] tracking-[-0.05em]">
            {scene.title ?? 'Untitled Scene'}
          </h1>
          {scene.body ? (
            <p className="mt-8 max-w-3xl text-3xl leading-[1.45]" style={{ color: theme.textSecondary }}>
              {scene.body}
            </p>
          ) : null}
          {scene.callout ? (
            <div
              className="mt-10 rounded-full border px-5 py-2 text-base font-medium"
              style={{
                borderColor: `${theme.accent}33`,
                background: theme.panelBackground,
              }}
            >
              {scene.callout}
            </div>
          ) : null}
          <div className="mt-12">
            <SceneNotes notes={scene.notes} accent={theme.accent} />
          </div>
        </div>
      </div>
    )
  }

  const textBlock = (
    <div className={cn('flex flex-col justify-center', isVertical ? 'max-w-none' : 'max-w-[520px]')}>
      {scene.title ? (
        <h2 className="m-0 text-6xl font-semibold leading-[1.02] tracking-[-0.04em]">{scene.title}</h2>
      ) : null}
      {scene.body ? (
        <p className="mt-5 whitespace-pre-wrap text-[28px] leading-[1.5]" style={{ color: theme.textSecondary }}>
          {scene.body}
        </p>
      ) : null}
      {scene.callout ? (
        <div
          className="mt-6 inline-flex w-fit items-center rounded-full border px-4 py-2 text-base font-medium"
          style={{
            borderColor: `${theme.accent}33`,
            background: theme.panelBackground,
            color: theme.textPrimary,
          }}
        >
          {scene.callout}
        </div>
      ) : null}
      <div className="mt-6">
        <SceneNotes notes={scene.notes} accent={theme.accent} />
      </div>
    </div>
  )

  const textAndCodeLayout =
    scene.type === 'text-code'
      ? isVertical
        ? 'grid-cols-1 grid-rows-[auto_minmax(0,1fr)]'
        : 'grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]'
      : 'grid-cols-1'

  return (
    <div className="relative h-full w-full overflow-hidden px-14 py-14" style={{ color: theme.textPrimary }}>
      <SlideBackdrop themeId={themeId} />
      <div className={cn('relative z-10 grid h-full min-h-0', textAndCodeLayout, contentGap)}>
        {scene.type === 'text-code' ? textBlock : scene.title || scene.body ? <div>{textBlock}</div> : null}
        <div className="min-h-0">{editor}</div>
      </div>
    </div>
  )
}
