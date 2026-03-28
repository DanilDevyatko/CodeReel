import { useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from '../components/ControlPanel'
import { PlaybackControls } from '../components/PlaybackControls'
import { SceneEditor } from '../components/SceneEditor'
import { SlideList } from '../components/SlideList'
import { SlidePreview, type PreviewMode } from '../components/SlidePreview'
import { SlideStage } from '../components/SlideStage'
import { sampleProject } from '../data/sampleProject'
import { exportAllSlidesToZip } from '../features/export/exportAllSlidesToZip'
import { exportSlideToPng } from '../features/export/exportSlideToPng'
import { usePlayback } from '../features/playback/usePlayback'
import {
  cloneScene,
  createDefaultScene,
  normalizeProjectDocument,
  stringifyProjectDocument,
} from '../features/project/projectDocument'
import { loadStoredProject, saveStoredProject } from '../features/project/projectStorage'
import { editorThemes } from '../lib/themes'
import { warmHighlighter } from '../lib/shiki'
import { cn, downloadBlob, moveItem, slugify } from '../lib/utils'
import {
  CANVAS_PRESETS,
  type CanvasPreset,
  type PlaybackSettings,
  type ProjectDocument,
  type Scene,
  type SceneType,
  type ThemeId,
  type TransitionType,
} from '../types/scene'

function headerActionButtonClassName(strong = false) {
  return cn(
    'rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
    strong
      ? 'border-sky-400/40 bg-sky-400/16 text-sky-100'
      : 'border-white/12 bg-white/8 text-slate-100 hover:border-white/24',
  )
}

function buildSceneFileName(scene: Scene, index: number, preset: CanvasPreset) {
  const orientation = preset === 'vertical-9:16' ? 'vertical' : 'horizontal'
  const base = slugify(scene.filename ?? `${scene.type}-${index + 1}`)
  return `${String(index + 1).padStart(2, '0')}-${base}-${orientation}.png`
}

function createSampleProject() {
  return normalizeProjectDocument(sampleProject)
}

function getIsDesktopLayout() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(min-width: 1280px)').matches
}

function getDefaultPreviewMode(preset: CanvasPreset, isDesktopLayout: boolean): PreviewMode {
  return preset === 'vertical-9:16' && isDesktopLayout ? 'read' : 'fit'
}

function normalizeScenePatch(patch: Partial<Scene>): Partial<Scene> {
  const normalizedPatch = { ...patch }

  if (typeof patch.filename === 'string') {
    const filename = patch.filename.trim()
    normalizedPatch.filename = filename || undefined
  }

  if (typeof patch.language === 'string') {
    const language = patch.language.trim()
    normalizedPatch.language = language || 'typescript'
  }

  return normalizedPatch
}

function App() {
  const initialProject = loadStoredProject() ?? createSampleProject()
  const [project, setProject] = useState<ProjectDocument>(initialProject)
  const [selectedSceneId, setSelectedSceneId] = useState(initialProject.scenes[0]?.id)
  const [isPlaying, setIsPlaying] = useState(initialProject.playback.autoplay)
  const [transition, setTransition] = useState<TransitionType>(initialProject.playback.defaultTransition)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isExportingCurrent, setIsExportingCurrent] = useState(false)
  const [isExportingAll, setIsExportingAll] = useState(false)
  const [isDesktopLayout, setIsDesktopLayout] = useState(getIsDesktopLayout)
  const [isProjectControlsOpen, setIsProjectControlsOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>(() =>
    getDefaultPreviewMode(initialProject.canvas.preset, getIsDesktopLayout()),
  )
  const exportNodeMap = useRef<Record<string, HTMLDivElement | null>>({})

  const currentIndex = Math.max(0, project.scenes.findIndex((scene) => scene.id === selectedSceneId))
  const currentScene = project.scenes[currentIndex]
  const activeTheme = editorThemes[project.themeId]
  const displayTitle = project.title.trim() || 'Untitled CodeReel Project'
  const isVerticalCanvas = project.canvas.preset === 'vertical-9:16'
  const canvasPresetLabel = isVerticalCanvas ? '9:16 vertical' : '16:9 horizontal'
  const zipFileName = useMemo(() => `${slugify(displayTitle)}-slides.zip`, [displayTitle])

  useEffect(() => {
    void warmHighlighter()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(min-width: 1280px)')
    const handleChange = () => setIsDesktopLayout(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    setPreviewMode(getDefaultPreviewMode(project.canvas.preset, isDesktopLayout))
  }, [isDesktopLayout, project.canvas.preset])

  useEffect(() => {
    if (!isDesktopLayout) {
      setIsProjectControlsOpen(false)
    }
  }, [isDesktopLayout])

  useEffect(() => {
    if (!isDesktopLayout || !isProjectControlsOpen) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProjectControlsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDesktopLayout, isProjectControlsOpen])

  useEffect(() => {
    saveStoredProject(project)
  }, [project])

  useEffect(() => {
    if (!project.scenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(project.scenes[0]?.id)
    }
  }, [project.scenes, selectedSceneId])

  useEffect(() => {
    if (!statusMessage) {
      return undefined
    }

    const timer = window.setTimeout(() => setStatusMessage(null), 3_500)
    return () => window.clearTimeout(timer)
  }, [statusMessage])

  const navigateToIndex = (nextIndex: number, nextDirection: 1 | -1, nextTransition: TransitionType) => {
    const clampedIndex = Math.min(Math.max(nextIndex, 0), project.scenes.length - 1)
    const targetScene = project.scenes[clampedIndex]

    if (!targetScene) {
      return
    }

    setDirection(nextDirection)
    setTransition(nextTransition)
    setSelectedSceneId(targetScene.id)
  }

  const handleAdvance = () => {
    if (!project.scenes.length) {
      return
    }

    const sceneTransition = currentScene?.transitionToNext ?? project.playback.defaultTransition
    const nextIndex = currentIndex + 1

    if (nextIndex >= project.scenes.length) {
      if (project.playback.loop) {
        navigateToIndex(0, 1, sceneTransition)
        return
      }

      setIsPlaying(false)
      return
    }

    navigateToIndex(nextIndex, 1, sceneTransition)
  }

  usePlayback({
    scenes: project.scenes,
    currentIndex,
    isPlaying,
    playback: project.playback,
    onAdvance: handleAdvance,
    onStop: () => setIsPlaying(false),
  })

  const updateProject = (updater: (current: ProjectDocument) => ProjectDocument) => {
    setProject((current) => updater(current))
  }

  const updateScene = (sceneId: string, patch: Partial<Scene>) => {
    const normalizedPatch = normalizeScenePatch(patch)

    updateProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...normalizedPatch } : scene)),
    }))
  }

  const handleLoadSample = () => {
    const nextProject = createSampleProject()
    setProject(nextProject)
    setSelectedSceneId(nextProject.scenes[0]?.id)
    setIsPlaying(nextProject.playback.autoplay)
    setTransition(nextProject.playback.defaultTransition)
    setDirection(1)
    setStatusMessage('Demo project reset.')
  }

  const handleExportJson = () => {
    const blob = new Blob([stringifyProjectDocument(project)], { type: 'application/json' })
    downloadBlob(blob, `${slugify(displayTitle)}.json`)
  }

  const handleThemeChange = (themeId: ThemeId) => {
    updateProject((current) => ({ ...current, themeId }))
  }

  const handleCanvasPresetChange = (preset: CanvasPreset) => {
    updateProject((current) => ({
      ...current,
      canvas: CANVAS_PRESETS[preset],
    }))
  }

  const handlePlaybackChange = <K extends keyof PlaybackSettings>(key: K, value: PlaybackSettings[K]) => {
    updateProject((current) => ({
      ...current,
      playback: {
        ...current.playback,
        [key]: value,
      },
    }))

    if (key === 'autoplay') {
      setIsPlaying(value as boolean)
    }

    if (key === 'defaultTransition') {
      setTransition(value as TransitionType)
    }
  }

  const handleProjectTitleChange = (title: string) => {
    updateProject((current) => ({
      ...current,
      title,
    }))
  }

  const handleToggleProjectControls = () => {
    setIsProjectControlsOpen((current) => !current)
  }

  const handleCloseProjectControls = () => {
    setIsProjectControlsOpen(false)
  }

  const handleSelectScene = (sceneId: string) => {
    const nextIndex = project.scenes.findIndex((scene) => scene.id === sceneId)

    if (nextIndex === -1) {
      return
    }

    if (nextIndex === currentIndex) {
      setSelectedSceneId(sceneId)
      return
    }

    navigateToIndex(nextIndex, nextIndex > currentIndex ? 1 : -1, project.playback.defaultTransition)
  }

  const handleAddScene = (type: SceneType) => {
    const scene = createDefaultScene(type, project.scenes.length)
    updateProject((current) => ({
      ...current,
      scenes: [...current.scenes, scene],
    }))
    setSelectedSceneId(scene.id)
  }

  const handleDuplicateScene = (sceneId: string) => {
    const index = project.scenes.findIndex((scene) => scene.id === sceneId)

    if (index === -1) {
      return
    }

    const duplicate = cloneScene(project.scenes[index])

    updateProject((current) => {
      const scenes = [...current.scenes]
      scenes.splice(index + 1, 0, duplicate)
      return {
        ...current,
        scenes,
      }
    })

    setSelectedSceneId(duplicate.id)
  }

  const handleDeleteScene = (sceneId: string) => {
    if (project.scenes.length === 1) {
      setStatusMessage('At least one snippet is required.')
      return
    }

    const index = project.scenes.findIndex((scene) => scene.id === sceneId)

    if (index === -1) {
      return
    }

    const scenes = project.scenes.filter((scene) => scene.id !== sceneId)
    const fallbackScene = scenes[Math.min(index, scenes.length - 1)]

    updateProject((current) => ({
      ...current,
      scenes: current.scenes.filter((scene) => scene.id !== sceneId),
    }))

    setSelectedSceneId(fallbackScene?.id)
  }

  const handleMoveScene = (sceneId: string, delta: -1 | 1) => {
    const index = project.scenes.findIndex((scene) => scene.id === sceneId)

    if (index === -1) {
      return
    }

    updateProject((current) => ({
      ...current,
      scenes: moveItem(current.scenes, index, index + delta),
    }))
  }

  const handlePrevious = () => {
    if (!project.scenes.length) {
      return
    }

    if (currentIndex === 0) {
      navigateToIndex(project.playback.loop ? project.scenes.length - 1 : 0, -1, project.playback.defaultTransition)
      return
    }

    navigateToIndex(currentIndex - 1, -1, project.playback.defaultTransition)
  }

  const handleNext = () => {
    if (!project.scenes.length) {
      return
    }

    if (currentIndex === project.scenes.length - 1) {
      navigateToIndex(
        project.playback.loop ? 0 : currentIndex,
        1,
        currentScene?.transitionToNext ?? project.playback.defaultTransition,
      )
      return
    }

    navigateToIndex(currentIndex + 1, 1, currentScene?.transitionToNext ?? project.playback.defaultTransition)
  }

  const handleRestart = () => {
    navigateToIndex(0, -1, project.playback.defaultTransition)
    setIsPlaying(true)
  }

  const handleTogglePlayback = () => {
    setIsPlaying((current) => !current)
  }

  const handleExportCurrent = async () => {
    if (!currentScene) {
      return
    }

    const node = exportNodeMap.current[currentScene.id]

    if (!node) {
      setStatusMessage('Snippet is not ready for export yet.')
      return
    }

    setIsExportingCurrent(true)

    try {
      await exportSlideToPng(node, {
        fileName: buildSceneFileName(currentScene, currentIndex, project.canvas.preset),
        width: project.canvas.width,
        height: project.canvas.height,
      })
      setStatusMessage('Current snippet exported.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to export current snippet.')
    } finally {
      setIsExportingCurrent(false)
    }
  }

  const handleExportAll = async () => {
    setIsExportingAll(true)

    try {
      const targets = project.scenes
        .map((scene, index) => {
          const node = exportNodeMap.current[scene.id]

          if (!node) {
            return null
          }

          return {
            node,
            fileName: buildSceneFileName(scene, index, project.canvas.preset),
            width: project.canvas.width,
            height: project.canvas.height,
          }
        })
        .filter((target): target is NonNullable<typeof target> => Boolean(target))

      if (!targets.length) {
        throw new Error('No rendered snippets are available for export.')
      }

      await exportAllSlidesToZip(targets, zipFileName)
      setStatusMessage('All snippets exported as ZIP.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to export snippet ZIP.')
    } finally {
      setIsExportingAll(false)
    }
  }

  return (
    <div
      className="box-border min-h-screen px-4 py-6 text-slate-100 md:px-6 xl:h-screen xl:overflow-hidden"
      style={{
        background: activeTheme.appBackground,
      }}
    >
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6 xl:h-full xl:min-h-0">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="text-sm font-semibold tracking-[0.28em] text-slate-300 uppercase">CodeReel</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{displayTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Build Carbon-like code visuals, preview the sequence locally, and export every snippet in one run.
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-3 xl:max-w-[62rem]">
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200">
              {project.canvas.width} x {project.canvas.height}
            </div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200">
              {activeTheme.label}
            </div>
            {isDesktopLayout ? (
              <>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200">
                  {canvasPresetLabel}
                </div>
                <button
                  type="button"
                  onClick={handleExportCurrent}
                  disabled={isExportingCurrent}
                  className={headerActionButtonClassName(true)}
                >
                  {isExportingCurrent ? 'Exporting current...' : 'Export Current PNG'}
                </button>
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={isExportingAll}
                  className={headerActionButtonClassName()}
                >
                  {isExportingAll ? 'Exporting ZIP...' : 'Export All PNGs'}
                </button>
                <button type="button" onClick={handleExportJson} className={headerActionButtonClassName()}>
                  Export Metadata JSON
                </button>
                <div className="relative z-40">
                  <button
                    type="button"
                    onClick={handleToggleProjectControls}
                    aria-expanded={isProjectControlsOpen}
                    aria-haspopup="dialog"
                    className={headerActionButtonClassName()}
                  >
                    Project Settings
                  </button>
                  {isProjectControlsOpen ? (
                    <>
                      <button
                        type="button"
                        aria-label="Close project settings"
                        onClick={handleCloseProjectControls}
                        className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-[2px]"
                      />
                      <div
                        className="absolute right-0 top-full z-40 mt-3 max-w-[460px]"
                        style={{ width: 'min(460px, calc(100vw - 2rem))' }}
                      >
                        <div
                          role="dialog"
                          aria-modal="true"
                          aria-label="Project settings"
                          className="max-h-[80vh] overflow-y-auto"
                        >
                          <ControlPanel
                            variant="drawer"
                            projectTitle={project.title}
                            themeId={project.themeId}
                            canvasPreset={project.canvas.preset}
                            playback={project.playback}
                            isExportingCurrent={isExportingCurrent}
                            isExportingAll={isExportingAll}
                            onClose={handleCloseProjectControls}
                            onProjectTitleChange={handleProjectTitleChange}
                            onThemeChange={handleThemeChange}
                            onCanvasPresetChange={handleCanvasPresetChange}
                            onPlaybackChange={handlePlaybackChange}
                            onExportCurrent={handleExportCurrent}
                            onExportAll={handleExportAll}
                            onExportJson={handleExportJson}
                            onLoadSample={handleLoadSample}
                          />
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-full border border-sky-400/24 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
            {statusMessage}
          </div>
        ) : null}

        <main className="grid gap-6 xl:min-h-0 xl:flex-1 xl:grid-cols-[360px_minmax(0,1fr)] xl:overflow-hidden">
          <div className="grid min-h-0 gap-6 xl:overflow-hidden">
            <SlideList
              scenes={project.scenes}
              selectedSceneId={selectedSceneId}
              onSelect={handleSelectScene}
              onAdd={handleAddScene}
              onDuplicate={handleDuplicateScene}
              onDelete={handleDeleteScene}
              onMove={handleMoveScene}
            />
            {!isDesktopLayout ? <SceneEditor scene={currentScene} sceneIndex={currentIndex} onUpdate={updateScene} /> : null}
          </div>

          <div className="flex min-h-0 flex-col gap-6 xl:overflow-hidden xl:pr-2">
            {!isDesktopLayout ? (
              <ControlPanel
                variant="inline"
                projectTitle={project.title}
                themeId={project.themeId}
                canvasPreset={project.canvas.preset}
                playback={project.playback}
                isExportingCurrent={isExportingCurrent}
                isExportingAll={isExportingAll}
                onProjectTitleChange={handleProjectTitleChange}
                onThemeChange={handleThemeChange}
                onCanvasPresetChange={handleCanvasPresetChange}
                onPlaybackChange={handlePlaybackChange}
                onExportCurrent={handleExportCurrent}
                onExportAll={handleExportAll}
                onExportJson={handleExportJson}
                onLoadSample={handleLoadSample}
              />
            ) : null}
            <section className="flex min-h-0 flex-col rounded-[30px] border border-white/10 bg-slate-950/45 p-5 backdrop-blur xl:flex-1 xl:overflow-hidden">
              <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-slate-50">Live Preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Zoom the browser preview for readability without changing the export canvas.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                  {canvasPresetLabel}
                </div>
              </div>
              <div
                className={cn(
                  'min-h-[420px] rounded-[28px] border border-white/10 bg-black/20 xl:min-h-0 xl:flex-1',
                  isDesktopLayout ? 'p-2' : isVerticalCanvas ? 'p-3 sm:p-3.5' : 'p-4',
                  isDesktopLayout
                    ? 'xl:h-full'
                    : isVerticalCanvas
                      ? 'h-[clamp(460px,78vh,900px)]'
                      : 'h-[clamp(320px,62vh,840px)]',
                )}
              >
                <div className="h-full w-full">
                  <SlidePreview
                    scene={currentScene}
                    canvas={project.canvas}
                    themeId={project.themeId}
                    transition={transition}
                    direction={direction}
                    transitionDurationMs={project.playback.transitionDurationMs}
                    mode={previewMode}
                    onModeChange={setPreviewMode}
                  />
                </div>
              </div>
              <PlaybackControls
                compact
                isPlaying={isPlaying}
                currentIndex={currentIndex}
                total={project.scenes.length}
                currentScene={currentScene}
                onPlayPause={handleTogglePlayback}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onRestart={handleRestart}
              />
            </section>

            {isDesktopLayout ? <SceneEditor scene={currentScene} sceneIndex={currentIndex} onUpdate={updateScene} /> : null}
          </div>
        </main>
      </div>

      <div className="pointer-events-none fixed -left-[99999px] top-0 z-[-1]" aria-hidden="true">
        <div className="flex flex-col gap-8 p-6">
          {project.scenes.map((scene) => (
            <SlideStage
              key={`export-${scene.id}`}
              ref={(node) => {
                exportNodeMap.current[scene.id] = node
              }}
              scene={scene}
              canvas={project.canvas}
              themeId={project.themeId}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
