import { HEIGHT_PER_BEAT } from "./constants"
import { Chart } from "./type"

export function offsetAtTime(bpm: number, elapsedS: number) {
  return elapsedS * bpm * HEIGHT_PER_BEAT / 60
}

export function getBpm(chart: Chart): number {
  if (chart.bpms.length !== 1) {
    throw new Error(`App: cannot play variable bpms yet`)
  }
  return chart.bpms[0][1]
}
