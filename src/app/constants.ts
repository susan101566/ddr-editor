export const CANVAS_WIDTH = 500
export const CANVAS_HEIGHT = 1000

export const geometryEpsilon = 0.001

// Z positions
export const CAMERA_Z = 2
export const ARROW_FIXED_Z = 0.1
export const WAVE_Z = -0.1

function arrowPositions(narrows: number): number[] {
  const totalWidth = ARROW_WIDTH * narrows + ARROW_GAP * (narrows - 1)
  const result: number[] = []
  let start = -totalWidth / 2
  for (let i = 0; i < narrows; i++) {
    result.push(start + ARROW_WIDTH / 2)
    start += ARROW_WIDTH + ARROW_GAP
  }
  return result
}

export const ARROW_WIDTH = 50
export const ARROW_GAP = 20
export const ARROW_ANGLES = [Math.PI / 2, Math.PI, 0, -Math.PI / 2]
export const ARROW_POSITIONS = arrowPositions(4)
export const ARROW_FIXED_Y = 0 // -50

// I'm calling the whole note a beat here.
// Sometimes you can have triplets in one 'beat' or quarter notes, so this better be divisible by 3 and 4.
// Can't find the doc for this, but the number of lines is at least 4 per beat in the .sm files.
export const HEIGHT_PER_CHART_BEAT = 12 * 80 // * 80
export const HEIGHT_PER_BEAT = HEIGHT_PER_CHART_BEAT / 4

// Waveform
// how wide the waveform arrows are scaled by
const lowQuality = { cutoff: 70, chunk: 200 }
// const highQuality = { cutoff: 0, chunk: 100 }
export const WAVEFORM_SCALE = 80
// do not bother rendering waveform lines smaller than this
export const WAVEFORM_CUTOFF = lowQuality.cutoff
// how many times to shrink audio sample size by.
export const WAVEFORM_CHUNK_SIZE = lowQuality.chunk
