import { Chart, NoteStyle, Beats, ArrowsPlan } from "./type"
import * as THREE from "three"
import { parseBeats, calculateColor } from "./parser"
import {ResourceTracker} from "./resource"
import {
  ARROW_ANGLES,
  ARROW_FIXED_Y,
  ARROW_FIXED_Z,
  ARROW_POSITIONS,
  ARROW_WIDTH,
  HEIGHT_PER_CHART_BEAT,
} from "./constants"

const tracker = new ResourceTracker()
export function freeArrows() {
  tracker.dispose()
}

type MaterialCache = { [color: string]: THREE.Material }
function getColorMaterial(color: string, memo: MaterialCache) {
  if (!memo[color]) {
    const material = tracker.track(new THREE.MeshBasicMaterial({ color }))
    memo[color] = material
  }
  return memo[color]
}

function createArrow(style: NoteStyle, material: THREE.Material): THREE.Mesh {
  let geometry: THREE.Geometry
  if (style === 'mine') {
    geometry = tracker.track(new THREE.CircleGeometry(0.5, 32));
  } else {
    geometry = tracker.track(new THREE.Geometry());
    geometry.vertices.push(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(0.5, -0.5, 0),
      new THREE.Vector3(-0.5, 0.5, 0),
      new THREE.Vector3(0.5, 0.5, 0),
    );
    switch (style) {
      case 'tap': {
        geometry.faces.push(new THREE.Face3(0, 1, 2))
        break
      }
      case 'holdstart':
      case 'holdend':
      case 'holding': {
        geometry.faces.push(new THREE.Face3(1, 4, 3))
        geometry.faces.push(new THREE.Face3(4, 1, 2))
        break
      }
      default: {
        throw new Error(`createArrow: unsupported type ${style}`)
      }
    }
  }

  geometry.scale(ARROW_WIDTH, ARROW_WIDTH, 1)
  return new THREE.Mesh( geometry, material )
}

export function createFixedArrows(): THREE.Group {
  const arrows = new THREE.Group()
  const material = tracker.track(new THREE.MeshBasicMaterial({ color: '#ffff00' }));
  for (let i = 0; i < 4; i++) {
    const geometry = tracker.track(new THREE.Geometry());
    geometry.vertices.push(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(-0.5, -0.5, 0),
      new THREE.Vector3(0.5, -0.5, 0),
    )
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.geometry.scale(ARROW_WIDTH, ARROW_WIDTH, 1)
    mesh.rotation.z = ARROW_ANGLES[i]
    mesh.position.x = ARROW_POSITIONS[i]
    mesh.position.y = ARROW_FIXED_Y
    arrows.add(mesh)
  }
  arrows.position.z = ARROW_FIXED_Z
  return arrows
}

function calculateOffset(heightPerBeat: number, offset: [number, number]): number {
  const result = heightPerBeat * offset[0] / offset[1]
  if (Number.isInteger(result)) {
    return result
  }
  throw new Error(`calculateOffset: cannot accurately calculate the offset. Total ${heightPerBeat}, offset ${offset}`)
}

function createArrowPlan(chart: Chart, level: number): ArrowsPlan {
  const result: ArrowsPlan = []
  const beats: Beats = parseBeats(chart, level)
  let beatOffset = 0
  for (const beat of beats) {
    // Every beat is a length 4 array of the notes in that beat.
    for (let dir = 0; dir < 4; dir++) {
      const column = beat[dir]
      for (let i = 0; i < column.length; i++) {
        const style = column[i]
        if (style === 'empty') {
          continue
        }
        // offset is like a fraction, e.g. [0, 4], 4 notes per beat, and this is the first one
        const offset: [number, number] = [i, column.length]
        const directionOffset = calculateOffset(HEIGHT_PER_CHART_BEAT, offset)
        result.push({
          style,
          color: calculateColor(style, offset),
          rotation:ARROW_ANGLES[dir],
          x:ARROW_POSITIONS[dir],
          y: -(beatOffset + directionOffset),
        })
      }
    }
    beatOffset += HEIGHT_PER_CHART_BEAT
  }
  return result
}

export function createArrows(chart: Chart, level: number): THREE.Group {
  const arrows = new THREE.Group()
  const memo: MaterialCache = {}
  for (const plan of createArrowPlan(chart, level)) {
    const arrow = createArrow(plan.style, getColorMaterial(plan.color, memo))
    arrow.rotation.z = plan.rotation
    arrow.position.x = plan.x
    arrow.position.y = plan.y
    arrows.add(arrow)
  }
  return arrows
}
