import { toBlob } from 'html-to-image'
import { downloadBlob } from '../../lib/utils'

interface ExportOptions {
  fileName: string
  width: number
  height: number
}

export async function exportSlideToPng(node: HTMLElement, options: ExportOptions) {
  const blob = await toBlob(node, {
    cacheBust: true,
    pixelRatio: 1,
    backgroundColor: '#050816',
    canvasWidth: options.width,
    canvasHeight: options.height,
  })

  if (!blob) {
    throw new Error('Failed to export slide as PNG.')
  }

  downloadBlob(blob, options.fileName)
}
