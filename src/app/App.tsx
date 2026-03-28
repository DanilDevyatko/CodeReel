import { useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from '../components/ControlPanel'
import { PlaybackControls } from '../components/PlaybackControls'
import { SceneEditor } from '../components/SceneEditor'
import { SlideList } from '../components/SlideList'
import { SlidePreview } from '../components/SlidePreview'
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

function buildSceneFileName(scene: Scene, index: number, preset: CanvasPreset) {
  const orientation = preset === 'vertical-9:16' ? 'vertical' : 'horizontal'
  const base = slugify(scene.filename ?? `${scene.type}-${index + 1}`)
  return `${String(index + 1).padStart(2, '0')}-${base}-${orientation}.png`
}

function createSampleProject() {
  return normalizeProjectDocument(sampleProject)
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
  const exportNodeMap = useRef<Record<string, HTMLDivElement | null>>({})

  const currentIndex = Math.max(0, project.scenes.findIndex((scene) => scene.id === selectedSceneId))
  const currentScene = project.scenes[currentIndex]
  const activeTheme = editorThemes[project.themeId]
  const displayTitle = project.title.trim() || 'Untitled CodeReel Project'
  const isVerticalCanvas = project.canvas.preset === 'vertical-9:16'
  const zipFileName = useMemo(() => `${slugify(displayTitle)}-slides.zip`, [displayTitle])

  useEffect(() => {
    void warmHighlighter()
  }, [])

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
    updateProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => (scene.id === sceneId ? { ...scene, ...patch } : scene)),
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
      className="min-h-screen px-4 py-6 text-slate-100 md:px-6"
      style={{
        background: activeTheme.appBackground,
      }}
    >
      <div className="mx-auto flex max-w-[1760px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="text-sm font-semibold tracking-[0.28em] text-slate-300 uppercase">CodeReel</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{displayTitle}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Build Carbon-like code visuals, preview the sequence locally, and export every snippet in one run.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200">
            {project.canvas.width} x {project.canvas.height} - {activeTheme.label}
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-full border border-sky-400/24 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
            {statusMessage}
          </div>
        ) : null}

        <main className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="grid min-h-0 gap-6 xl:grid-rows-[minmax(0,1fr)_auto]">
            <SlideList
              scenes={project.scenes}
              selectedSceneId={selectedSceneId}
              onSelect={handleSelectScene}
              onAdd={handleAddScene}
              onDuplicate={handleDuplicateScene}
              onDelete={handleDeleteScene}
              onMove={handleMoveScene}
            />
            <SceneEditor scene={currentScene} sceneIndex={currentIndex} onUpdate={updateScene} />
          </div>

          <div className="grid min-h-0 gap-6 xl:grid-rows-[auto_minmax(0,1fr)_auto]">
            <ControlPanel
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

            <section className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-semibold text-slate-50">Live Preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    The browser preview now scales the same full-resolution canvas that gets exported.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                  {project.canvas.preset === 'vertical-9:16' ? '9:16 vertical' : '16:9 horizontal'}
                </div>
              </div>
              <div
                className={cn(
                  'rounded-[28px] border border-white/10 bg-black/20',
                  isVerticalCanvas ? 'p-3 sm:p-3.5' : 'p-4',
                )}
                style={{
                  height: isVerticalCanvas ? 'clamp(460px, 78vh, 900px)' : 'clamp(320px, 62vh, 840px)',
                }}
              >
                <div className="h-full w-full">
                  <SlidePreview
                    scene={currentScene}
                    canvas={project.canvas}
                    themeId={project.themeId}
                    transition={transition}
                    direction={direction}
                    transitionDurationMs={project.playback.transitionDurationMs}
                  />
                </div>
              </div>
            </section>

            <PlaybackControls
              isPlaying={isPlaying}
              currentIndex={currentIndex}
              total={project.scenes.length}
              currentScene={currentScene}
              onPlayPause={handleTogglePlayback}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onRestart={handleRestart}
            />
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
