import JSZip from 'jszip'
import { toBlob } from 'html-to-image'
import { downloadBlob, waitForElementAttribute, waitForFonts, waitForFrame } from '../../lib/utils'

interface SlideExportTarget {
  node: HTMLElement
  fileName: string
  width: number
  height: number
}

export async function exportAllSlidesToZip(targets: SlideExportTarget[], zipFileName: string) {
  const zip = new JSZip()

  await waitForFonts()

  for (const target of targets) {
    await waitForElementAttribute(target.node, 'data-slide-ready', 'true')
    await waitForFrame()

    const blob = await toBlob(target.node, {
      cacheBust: true,
      pixelRatio: 1,
      backgroundColor: '#050816',
      canvasWidth: target.width,
      canvasHeight: target.height,
    })

    if (!blob) {
      throw new Error(`Failed to export ${target.fileName}.`)
    }

    zip.file(target.fileName, blob)
  }

  const archive = await zip.generateAsync({ type: 'blob' })
  downloadBlob(archive, zipFileName)
}
