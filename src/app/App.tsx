import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from '../components/ControlPanel'
import { PlaybackControls } from '../components/PlaybackControls'
import { ProjectInputPanel } from '../components/ProjectInputPanel'
import { SceneEditor } from '../components/SceneEditor'
import { SlideList } from '../components/SlideList'
import { SlidePreview } from '../components/SlidePreview'
import { SlideRenderer } from '../components/SlideRenderer'
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
import { downloadBlob, moveItem, slugify } from '../lib/utils'
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
  const base = slugify(scene.title ?? scene.filename ?? `${scene.type}-${index + 1}`)
  return `${String(index + 1).padStart(2, '0')}-${base}-${orientation}.png`
}

function App() {
  const initialProject = loadStoredProject() ?? sampleProject
  const [project, setProject] = useState<ProjectDocument>(initialProject)
  const [draftJson, setDraftJson] = useState(() => stringifyProjectDocument(initialProject))
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)
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
  const zipFileName = useMemo(() => `${slugify(project.title)}-slides.zip`, [project.title])

  useEffect(() => {
    void warmHighlighter()
  }, [])

  useEffect(() => {
    saveStoredProject(project)

    if (!isDraftDirty) {
      setDraftJson(stringifyProjectDocument(project))
    }
  }, [isDraftDirty, project])

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

  const handleApplyProject = (nextProject: ProjectDocument) => {
    startTransition(() => {
      setProject(nextProject)
      setSelectedSceneId(nextProject.scenes[0]?.id)
      setDraftJson(stringifyProjectDocument(nextProject))
      setIsDraftDirty(false)
      setJsonError(null)
      setIsPlaying(nextProject.playback.autoplay)
      setTransition(nextProject.playback.defaultTransition)
      setDirection(1)
      setStatusMessage('Project updated.')
    })
  }

  const handleApplyJson = () => {
    try {
      const parsed = normalizeProjectDocument(JSON.parse(draftJson))
      handleApplyProject(parsed)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid project JSON.')
    }
  }

  const handleLoadSample = () => {
    handleApplyProject(sampleProject)
  }

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text()
      setDraftJson(text)
      const parsed = normalizeProjectDocument(JSON.parse(text))
      handleApplyProject(parsed)
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Failed to import JSON file.')
    }
  }

  const handleExportJson = () => {
    const blob = new Blob([stringifyProjectDocument(project)], { type: 'application/json' })
    downloadBlob(blob, `${slugify(project.title)}.json`)
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
    const scene = createDefaultScene(type)
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
      setStatusMessage('At least one scene is required.')
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
      setStatusMessage('Slide is not ready for export yet.')
      return
    }

    setIsExportingCurrent(true)

    try {
      await exportSlideToPng(node, {
        fileName: buildSceneFileName(currentScene, currentIndex, project.canvas.preset),
        width: project.canvas.width,
        height: project.canvas.height,
      })
      setStatusMessage('Current slide exported.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to export current slide.')
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
        throw new Error('No rendered slides are available for export.')
      }

      await exportAllSlidesToZip(targets, zipFileName)
      setStatusMessage('All slides exported as ZIP.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to export slide ZIP.')
    } finally {
      setIsExportingAll(false)
    }
  }

  return (
    <div
      className="min-h-screen px-6 py-6 text-slate-100 md:px-8"
      style={{
        background: activeTheme.appBackground,
      }}
    >
      <div className="mx-auto flex max-w-[1720px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-sm font-semibold tracking-[0.28em] text-slate-300 uppercase">CodeScenes</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-white">{project.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Local-first scene editor for Codex-generated slide JSON. Preview transitions, tweak scenes, and export PNG frames.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200">
            {project.canvas.width} × {project.canvas.height} · {activeTheme.label}
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-full border border-sky-400/24 bg-sky-400/10 px-4 py-2 text-sm text-sky-100">
            {statusMessage}
          </div>
        ) : null}

        <main className="grid gap-6 xl:grid-cols-[520px_minmax(0,1fr)]">
          <div className="grid min-h-0 gap-6">
            <ProjectInputPanel
              draftJson={draftJson}
              error={jsonError}
              isDirty={isDraftDirty}
              projectTitle={project.title}
              onDraftChange={(value) => {
                setDraftJson(value)
                setIsDraftDirty(true)
                setJsonError(null)
              }}
              onApplyJson={handleApplyJson}
              onLoadSample={handleLoadSample}
              onImportFile={handleImportFile}
              onExportJson={handleExportJson}
            />
            <SceneEditor scene={currentScene} onUpdate={updateScene} />
          </div>

          <div className="grid min-h-0 gap-6 xl:grid-rows-[auto_minmax(0,1fr)_auto]">
            <ControlPanel
              themeId={project.themeId}
              canvasPreset={project.canvas.preset}
              playback={project.playback}
              isExportingCurrent={isExportingCurrent}
              isExportingAll={isExportingAll}
              onThemeChange={handleThemeChange}
              onCanvasPresetChange={handleCanvasPresetChange}
              onPlaybackChange={handlePlaybackChange}
              onExportCurrent={handleExportCurrent}
              onExportAll={handleExportAll}
            />

            <section className="grid min-h-0 gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
              <SlideList
                scenes={project.scenes}
                selectedSceneId={selectedSceneId}
                onSelect={handleSelectScene}
                onAdd={handleAddScene}
                onDuplicate={handleDuplicateScene}
                onDelete={handleDeleteScene}
                onMove={handleMoveScene}
              />
              <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-6 backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="m-0 text-lg font-semibold text-slate-50">Live Preview</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Animated preview updates from the selected scene and active playback settings.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-200">
                    {project.canvas.preset === 'vertical-9:16' ? '9:16 vertical' : '16:9 horizontal'}
                  </div>
                </div>
                <div className="min-h-[520px]">
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
            <div
              key={`export-${scene.id}`}
              ref={(node) => {
                exportNodeMap.current[scene.id] = node
              }}
              style={{
                width: `${project.canvas.width}px`,
                height: `${project.canvas.height}px`,
              }}
            >
              <SlideRenderer scene={scene} canvas={project.canvas} themeId={project.themeId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
