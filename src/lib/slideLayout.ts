import type { CodeBlockMetrics } from '../components/CodeBlock'
import type { EditorFrameMetrics } from '../components/EditorFrame'
import type { CanvasSettings } from '../types/scene'

export interface SlideLayoutMetrics {
  frameWidth: number
  frameHeight: number
  frameMaxWidth: number
  frameOffsetY: number
  frameMetrics: EditorFrameMetrics
  codeMetrics: CodeBlockMetrics
}

export function getSlideLayoutMetrics(canvas: CanvasSettings): SlideLayoutMetrics {
  const isVertical = canvas.preset === 'vertical-9:16'

  if (isVertical) {
    return {
      frameWidth: Math.round(canvas.width * 0.9),
      frameHeight: Math.round(canvas.height * 0.66),
      frameMaxWidth: Math.round(canvas.width * 0.9),
      frameOffsetY: -8,
      frameMetrics: {
        radius: 40,
        chromeHeight: 68,
        chromePaddingX: 30,
        trafficLightSize: 14,
        titleFontSize: 16,
      },
      codeMetrics: {
        contentPadding: 30,
        fontSize: 24,
        lineHeight: 1.5,
        lineNumberWidth: 48,
        rowGap: 5,
        rowRadius: 16,
      },
    }
  }

  return {
    frameWidth: Math.round(canvas.width * 0.82),
    frameHeight: Math.round(canvas.height * 0.72),
    frameMaxWidth: Math.round(canvas.width * 0.82),
    frameOffsetY: 0,
    frameMetrics: {
      radius: 40,
      chromeHeight: 74,
      chromePaddingX: 34,
      trafficLightSize: 15,
      titleFontSize: 17,
    },
    codeMetrics: {
      contentPadding: 36,
      fontSize: 26,
      lineHeight: 1.52,
      lineNumberWidth: 56,
      rowGap: 6,
      rowRadius: 16,
    },
  }
}

export function getSlideFrameBounds(canvas: CanvasSettings) {
  const layout = getSlideLayoutMetrics(canvas)

  return {
    left: Math.round((canvas.width - layout.frameWidth) / 2),
    top: Math.round((canvas.height - layout.frameHeight) / 2 + layout.frameOffsetY),
    width: layout.frameWidth,
    height: layout.frameHeight,
  }
}
