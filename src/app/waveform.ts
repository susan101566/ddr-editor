import { Chart, WaveBuffer, WavePlan } from "./type"
import * as THREE from "three"
import { getBpm } from "./lib"
import {
  geometryEpsilon,
  HEIGHT_PER_BEAT,
  WAVEFORM_CUTOFF,
  WAVEFORM_SCALE,
  WAVE_Z,
} from "./constants"
import { ResourceTracker } from "./resource"

const tracker = new ResourceTracker()
export function freeWaveform() {
  tracker.dispose()
}

const cache: WeakMap<WaveBuffer, WavePlan> = new WeakMap()
function getOrCreateWavePlan(chart: Chart, buffer: WaveBuffer): WavePlan {
  const cached = cache.get(buffer)
  if (cached) {
    return cached
  }
  const heightPerSec = getBpm(chart) * HEIGHT_PER_BEAT / 60
  const heightPerSample = heightPerSec / buffer.sampleRate

  const result: WavePlan = []
  for (let i = 0; i < buffer.data.length; i++) {
    const point = buffer.data[i]
    const width = Math.max(Math.abs(point), geometryEpsilon) * WAVEFORM_SCALE
    if (width < WAVEFORM_CUTOFF) {
      continue
    }
    const height = heightPerSample
    const y = -i * heightPerSample
    result.push({ width, height, y })
  }
  cache.set(buffer, result)
  return result
}

function binsearch(plan: WavePlan, left: number, right: number, value: number): number {
  if (left >= right || left === plan.length - 1 || (plan[left].y > value && plan[left + 1].y < value)) {
    return left
  }
  const mid = left + Math.floor((right - left) / 2)
  const midV = plan[mid].y
  if (midV < value) {
    return binsearch(plan, left, mid, value)
  }
  if (midV > value) {
    return binsearch(plan, mid, right, value)
  }
  return mid
}

const waveMaterial = new THREE.LineBasicMaterial({ color: '#e96480' })
export function createWaveForm(chart: Chart, buffer: WaveBuffer, minY: number, maxY: number): THREE.Group {
  const wf = new THREE.Group()
  const plan = getOrCreateWavePlan(chart, buffer)
  const start = binsearch(plan, 0, plan.length, maxY)
  for (let i = start; i < plan.length; i++) {
    const p = plan[i]
    if (p.y < minY) {
      break
    }
    const points = [];
    points.push(new THREE.Vector3(-1, 0, 0));
    points.push(new THREE.Vector3(1, 0, 0));
    const geometry = tracker.track(new THREE.BufferGeometry().setFromPoints(points))
    geometry.scale(p.width, 1, 1)
    const mesh = new THREE.Line(geometry, waveMaterial)
    mesh.position.y = p.y
    wf.add(mesh)
  }
  wf.position.z = WAVE_Z
  return wf
}
