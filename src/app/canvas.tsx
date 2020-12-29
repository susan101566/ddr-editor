import React from 'react'
import * as THREE from "three"

import { Chart, WaveBuffer } from 'app/type'
import { createFixedArrows, createArrows, freeArrows } from './arrow'
import { getBpm, offsetAtTime } from './lib'
import { CAMERA_Z, CANVAS_HEIGHT, CANVAS_WIDTH } from './constants'
import { createWaveForm, freeWaveform } from './waveform'

interface CanvasProps {
  chart: Chart | null
  showWaveForm: boolean
  waveBuffer: WaveBuffer | null
  level: number
  elapsed: number
  className: string
}

type RenderContext = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.Camera
}

interface CanvasState {

}

const ALL_ARROWS = "ALL_ARROWS"
const FIXED_ARROWS = "FIXED_ARROWS"
const WAVE_FORM = "WAVE_FORM"

export class Canvas extends React.Component<CanvasProps, CanvasState> {
  state: CanvasState = {}
  private renderContext: RenderContext | null = null

  private container: HTMLDivElement | null = null
  containerRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      this.container = ref
    }
  }

  componentDidUpdate(prevProps: CanvasProps) {
    if (!this.renderContext) {
      return
    }

    // Update Arrows
    if (
      prevProps.chart !== this.props.chart ||
      prevProps.level !== this.props.level
    ) {
      this.newChart()
    }

    if (prevProps.elapsed !== this.props.elapsed) {
      this.updateChart()
    }

    if (
      prevProps.showWaveForm !== this.props.showWaveForm ||
      prevProps.waveBuffer !== this.props.waveBuffer ||
      prevProps.elapsed !== this.props.elapsed
    ) {
      this.updateWaveBuffer()
    }

    this.renderContext.renderer.render(
      this.renderContext.scene,
      this.renderContext.camera
    )
  }

  componentDidMount() {
    if (this.renderContext || !this.container) {
      throw new Error(
        `Canvas: render context already exists (${!!this
          .renderContext}) or container doesn't exist (${!this.container})`
      )
    }
    this.renderContext = createRenderContext(this.container)
  }

  newChart() {
    if (!this.props.chart || !this.renderContext) {
      return
    }

    // GC the old song
    const scene = this.renderContext.scene
    gc(scene, [ALL_ARROWS, FIXED_ARROWS])
    freeArrows()

    // Mount the new song
    const arrows = createArrows(this.props.chart, this.props.level)
    arrows.name = ALL_ARROWS
    arrows.position.y = 0

    const fixedArrows = createFixedArrows()
    fixedArrows.name = FIXED_ARROWS

    scene.add(arrows, fixedArrows)
  }

  updateChart() {
    if (!this.props.chart || !this.renderContext) {
      return false
    }
    const top = offsetAtTime(
      getBpm(this.props.chart),
      this.props.elapsed + this.props.chart.offset
    )
    const arrows = this.renderContext.scene.getObjectByName(ALL_ARROWS)
    if (arrows) {
      arrows.position.y = top
    }
  }

  updateWaveBuffer() {
    if (!this.props.waveBuffer || !this.props.chart || !this.renderContext) {
      return
    }

    const scene = this.renderContext.scene
    gc(scene, [WAVE_FORM])
    freeWaveform()

    if (!this.props.showWaveForm) {
      return
    }

    const top = offsetAtTime(getBpm(this.props.chart), this.props.elapsed)
    const minY = -top - CANVAS_HEIGHT - 100
    const maxY = -top + 100
    const wf = createWaveForm(
      this.props.chart,
      this.props.waveBuffer,
      minY,
      maxY
    )
    wf.name = WAVE_FORM
    wf.position.y = top
    scene.add(wf)
  }

  render() {
    return <div className={this.props.className} ref={this.containerRef}></div>
  }
}

function gc(scene: THREE.Scene, names: string[]) {
  for (const name of names) {
    const obj = scene.getObjectByName(name)
    if (obj) {
      scene.remove(obj)
    }
  }
}

function createRenderContext(container: HTMLDivElement): RenderContext {
  if (!container) {
    throw new Error(`Canvas: cannot mount container`)
  }

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  container.appendChild(renderer.domElement);

  const camera = new THREE.OrthographicCamera(
    -CANVAS_WIDTH / 2,
    CANVAS_WIDTH / 2,
    0,
    -CANVAS_HEIGHT,
    1, //near
    3, //far
  );
  camera.position.z = CAMERA_Z

  const scene = new THREE.Scene();

  return {
    renderer,
    scene,
    camera,
  }
}
