
export type Song = {
  id: string, label: string, audio: string, sm: string
}

export interface Chart {
  title: string
  artist: string
  offset: number
  bpms: Array<[number, number]>
  levels: Level[]
}

export type LevelType = 'single' | 'double'
export type NoteSymbol = '0' | '1' | '2' | '3' | '4' | 'M'
export interface Level {
  type: LevelType
  difficulty: string

  // every item is a beat, which is a long string (length divisible by numDirections)
  notes: string[]
}

export type NoteType = 1 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64
export type NoteStyle = 'empty' | 'tap' | 'holdstart' | 'holding' | 'holdend' | 'mine'
export type Notes = NoteStyle[]

// left, down, top, right
export type Beat = [Notes, Notes, Notes, Notes]
export type Beats = Beat[]

export type WaveBuffer = {
  // number of data points per second
  sampleRate: number
  duration: number
  data: Float32Array
}

export type ArrowPlan = {
  style: NoteStyle,
  color: string,
  rotation: number,
  x: number,
  y: number,
}

export type WaveSegPlan = {
  width: number,
  height: number,
  y: number,
}

export type ArrowsPlan = Array<ArrowPlan>
export type WavePlan = Array<WaveSegPlan>
