export interface PlaceholderSegment {
  width: number
  colorIndex: number
}

export interface PlaceholderLine {
  indent: number
  segments: PlaceholderSegment[]
}

function mulberry32(seed: number) {
  let value = seed

  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let result = Math.imul(value ^ (value >>> 15), 1 | value)
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

export function generatePlaceholderLines(count: number, seed = 1): PlaceholderLine[] {
  const random = mulberry32(seed)

  return Array.from({ length: count }, (_, index) => {
    const indent = index > 0 && index % 5 !== 0 ? Math.floor(random() * 3) : 0
    const segmentCount = 2 + Math.floor(random() * 4)
    const segments: PlaceholderSegment[] = []
    let remaining = 88 - indent * 10

    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      const segmentWidth = Math.min(
        remaining,
        8 + Math.floor(random() * (segmentIndex === segmentCount - 1 ? 14 : 18)),
      )

      if (segmentWidth <= 0) {
        break
      }

      segments.push({
        width: segmentWidth,
        colorIndex: Math.floor(random() * 5),
      })

      remaining -= segmentWidth + 3
    }

    return {
      indent,
      segments,
    }
  })
}
