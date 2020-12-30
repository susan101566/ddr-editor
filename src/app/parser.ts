import { Chart, LevelType, Level, Beats, Beat, NoteType, NoteStyle } from "app/type"

const symbolToNoteStyle: {[c: string]: NoteStyle} = {
  '0': 'empty',
  '1': 'tap',
  '2': 'holdstart',
  '3': 'holdend',
  '4': 'holdstart', // TODO (rollstart)
  'M': 'mine',
}

const arrowColorMap: { [key: number]: string } = {
  4: '#e92400',
  8: '#006de9',
  12: '#7100e9',
  16: '#ebc800',
  24: '#ee00e9',
  32: '#e96400',
  48: '#00b8ea',
  64: '#6d915b',

  96: '#6d915b',
  192: '#6d915b',
}

const holdColor = '#87d95f'
const mineColor = '#ff2b00'

const allDiffuculties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Challenge']
const allModes: {[key: string]: LevelType } = {'dance-single': 'single', 'dance-double': 'double'}

function isNote(line: string, mode: LevelType) {
  line = line.trim()
  const expectedLength = mode === 'double' ? 8 : 4
  return (
    line.length === expectedLength &&
    line.split('').filter(c => symbolToNoteStyle[c] === undefined).length === 0
  )
}

class Parser {
  private lines: string[] = []

  constructor(rawText: string) {
    this.lines = rawText.split('\n')
  }

  private error(msg: string, i: number | null = null): never {
    if (i === null) {
      throw new Error(`ParseError: ${msg}`)
    }
    throw new Error(`ParseError at line ${i}: ${msg}`)
  }

  public parse(): Chart | null {
    const result: Chart = {
      title: '',
      artist: '',
      offset: 0,
      bpms: [],
      levels: [],
    }

    let state: 'metadata' | 'notes' = 'metadata'
    let curLevel: Level | null = null
    let curType: LevelType | null = null
    let curDifficulty: string | null = null
    let linesRead: number | null = null

    for (let i = 0; i < this.lines.length; linesRead ? i += linesRead : i++) {
      const line = this.lines[i].trim()
      linesRead = null
      if (state === 'metadata') {
        // Parse for compatible sections
        if (line.startsWith('#')) {
          const keyEnd = line.indexOf(':')
          if (keyEnd < 0) {
            this.error(`Expected a line starting with # to contain :`, i)
          }
          const key = line.substring(1, keyEnd)
          const valueEnd = line.indexOf(';') < 0 ? line.length : line.indexOf(';')
          const value = line.substring(keyEnd + 1, valueEnd)

          if (key === 'TITLE') {
            result.title = value;
          } else if (key === 'ARTIST') {
            result.artist = value;
          } else if (key === 'BPMS') {
            value.split(',').forEach(bpm => {
              const parts = bpm.split('=')
              if (parts.length !== 2 || isNaN(parseFloat(parts[0])) || isNaN(parseFloat(parts[1]))) {
                this.error(`Wrong bpms format ${value}`, i)
              }
              result.bpms.push([parseFloat(parts[0]), parseFloat(parts[1])])
            })
          } else if (key === 'OFFSET') {
            result.offset = parseFloat(value)
          }
          continue
        } // startsWith(#)

        // Parse for mode and difficulty
        if (line.endsWith(':')) {
          const segs = line.split(':')
          if (segs.length !== 2) {
            this.error(`Splitting by ':' returned more than two segments`, i)
          }
          const value = segs[0]
          if (allModes[value]) {
            curType = allModes[value]
          }

          if (allDiffuculties.indexOf(value) >= 0) {
            curDifficulty = value
            const difficultyNumber = parseInt(this.lines[i + 1])
            if (!isNaN(difficultyNumber)) {
              curDifficulty = `${curDifficulty} - ${difficultyNumber}`
              linesRead = 2
            }
          }
          continue
        } // endsWith(:)

        // Check if we can parse notes now
        if (curType && isNote(line, curType)) {
          if (!curDifficulty) {
            this.error(`No difficulty was set`, i)
          }
          state = 'notes'
          curLevel = {
            type: curType,
            difficulty: curDifficulty,
            notes: [],
          }
        }
      } // state === metadata

      if (state === 'notes') {
        if (!curLevel) {
          this.error(`Level is null`, i)
        }
        if (line === ';') {
          state = 'metadata'
          result.levels.push(curLevel)
        }
        linesRead = 0
        let note: string = ''
        while(isNote(this.lines[i+linesRead], curLevel.type)) {
          note += this.lines[i+linesRead].trim()
          linesRead++
        }
        if (note) {
          curLevel.notes.push(note)
        }
      } // state === notes
    }

    return result.title ? result : null
  }
}

export function parseSong(rawText: string | null): Chart | null {
  if (!rawText) {
    return null
  }
  return new Parser(rawText).parse()
}

export function parseBeats(song: Chart, leveli: number): Beats {
  const {type, notes}: Level = song.levels[leveli]
  if (type === 'double') { return [] }
  const numArrows = 4
  const result: Beats = []
  const holdStarts = [false, false, false, false]
  for (const note of notes) {
    const beat: Beat = [[], [], [], []]
    const nrows = note.length / numArrows
    if (!Number.isInteger(nrows)) {
      throw new Error(`parseBeats: ${note.length}/${numArrows} is not an integer`)
    }
    for (let dir = 0; dir < numArrows; dir++) {
      for (let index = dir; index < note.length; index += numArrows) {
        let style = symbolToNoteStyle[note[index]]
        if (style === 'empty' && holdStarts[dir]) {
          style = 'holding'
        }
        beat[dir].push(style)
        if (style === 'holdstart') {
          if (holdStarts[dir]) {
            throw new Error(`parseBeats: hold already started`)
          }
          holdStarts[dir] = true
        }
        if (style === 'holdend') {
          if (!holdStarts[dir]) {
            throw new Error(`parseBeats: hold never started`)
          }
          holdStarts[dir] = false
        }
      }
    }
    result.push(beat)
  }

  return result
}

export function calculateType(offset: [number, number]): NoteType {
  const denominator = offset[1]
  let [a, b] = [...offset]
  if (!Number.isInteger(a) || !Number.isInteger(b) || denominator === 0 || arrowColorMap[denominator] === undefined) {
    throw new Error(`calculateType: invalid input ${a}, ${b}`)
  }

  if (a === 0) {
    a = b
  }
  while(a !== b) {
    if (a > b) {
      a = a - b
    } else {
      b = b - a
    }
  }

  let beat = denominator / a
  let loop = 0
  while (arrowColorMap[beat] === undefined && loop < 10) {
    beat = beat * 2
    loop++
  }

  if (loop >= 10) {
    throw new Error(`calculateType: invalid input ${a}, ${b}`)
  }

  return beat as NoteType
}

function isHold(style: NoteStyle) {
  return style.startsWith('hold')
}

export function calculateColor(style: NoteStyle, offset: [number, number]): string {
  if (isHold(style)) {
    return holdColor
  }
  if (style === 'mine') {
    return mineColor
  }

  const type = calculateType(offset)
  if (arrowColorMap[type] !== undefined) {
    return arrowColorMap[type]
  }
  return '#ffffff'
}
