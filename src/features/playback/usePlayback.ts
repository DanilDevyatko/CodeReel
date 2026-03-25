import { useEffect, useEffectEvent } from 'react'
import type { PlaybackSettings, Scene } from '../../types/scene'

interface UsePlaybackOptions {
  scenes: Scene[]
  currentIndex: number
  isPlaying: boolean
  playback: PlaybackSettings
  onAdvance: () => void
  onStop: () => void
}

export function usePlayback({ scenes, currentIndex, isPlaying, playback, onAdvance, onStop }: UsePlaybackOptions) {
  const handleAdvance = useEffectEvent(() => {
    onAdvance()
  })

  useEffect(() => {
    if (!isPlaying || scenes.length === 0) {
      return undefined
    }

    const scene = scenes[currentIndex]

    if (!scene) {
      onStop()
      return undefined
    }

    const duration = scene.durationMs ?? playback.slideDurationMs
    const timer = window.setTimeout(() => {
      handleAdvance()
    }, duration)

    return () => {
      window.clearTimeout(timer)
    }
  }, [currentIndex, isPlaying, onStop, playback.slideDurationMs, scenes])
}
