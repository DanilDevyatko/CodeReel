import { clsx } from 'clsx'

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs)
}

export function createId(prefix = 'scene') {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function parseLineNumberInput(input: string) {
  const values = new Set<number>()

  for (const chunk of input.split(',')) {
    const value = chunk.trim()

    if (!value) {
      continue
    }

    if (value.includes('-')) {
      const [rawStart, rawEnd] = value.split('-', 2)
      const start = Number(rawStart)
      const end = Number(rawEnd)

      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0) {
        continue
      }

      const min = Math.min(start, end)
      const max = Math.max(start, end)

      for (let line = min; line <= max; line += 1) {
        values.add(line)
      }

      continue
    }

    const lineNumber = Number(value)

    if (Number.isInteger(lineNumber) && lineNumber > 0) {
      values.add(lineNumber)
    }
  }

  return [...values].sort((left, right) => left - right)
}

export function formatLineNumberInput(lines: number[] | undefined) {
  return lines?.join(', ') ?? ''
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const clone = [...items]
  const [item] = clone.splice(fromIndex, 1)
  clone.splice(toIndex, 0, item)
  return clone
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'scene'
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1_000)
}

export function waitForFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}
