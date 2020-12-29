import { WAVEFORM_CHUNK_SIZE } from "./constants"
import { parseSong } from "./parser"
import { Chart, WaveBuffer } from "./type"

export type Song = {
  id: string, label: string, audio: string, sm: string
}

const pathPrefix = `${process.env.PUBLIC_URL}/static/`
export const allSongs: {[id: string]: Song} = {
  'liveforever': {id: 'liveforever', label: 'Live Forever', audio: 'Live forever/Magnus_Carlsson__Live_Forever.mp3', sm: 'Live forever/LF.sm'},
  'crazyloop': {id: 'crazyloop', label: 'Crazy Loop', audio: 'Crazy Loop (Mm ma ma)/06.ogg', sm: 'Crazy Loop (Mm ma ma)/06.sm'}
}

export function audioFileUrl(song: Song | null): string | undefined {
  if (!song) {
    return undefined
  }
  return pathPrefix + song.audio
}

export async function loadChart(song: Song): Promise<Chart> {
  const smFileUrl = pathPrefix + song.sm
  return fetch(smFileUrl, {
    headers: {
      'Content-Type': 'text/plain',
      'Accept': 'text/plain',
    }
  }).then((r) => {
    if (!r) {
      throw new Error(`no text`)
    }
    return r.text()
  }).then((t) => {
    const song = parseSong(t)
    if (!song) {
      throw new Error(`parsed no song`)
    }
    return song
  }).catch(e => {
    throw new Error(`App: Cannot fetch ${smFileUrl}, ${e}`)
  })
}

const audioContext = new AudioContext();
export async function loadAudio(song: Song): Promise<WaveBuffer> {
  const audioFileUrl = pathPrefix + song.audio
  const audioBufferPromise = fetch(audioFileUrl)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))

  const audioBuffer = await audioBufferPromise;
  return filterData(audioBuffer)
}

// how much to shrink the sample size by
function filterData(audioBuffer: AudioBuffer): WaveBuffer {
  // Sometimes other channel's data is more prominent
  const rawData = audioBuffer.getChannelData(0)
  const data: number[] = []
  for (let i = 0; i < rawData.length; i += WAVEFORM_CHUNK_SIZE) {
    let min = rawData[0]
    let max = rawData[0]
    for (let j = 0; j < WAVEFORM_CHUNK_SIZE; j++) {
      if (i + j < rawData.length) {
        min = Math.min(min, rawData[i + j])
        max = Math.max(max, rawData[i + j])
      }
    }
    data.push(max - min)
  }
  return {
    sampleRate: Math.floor(audioBuffer.sampleRate / WAVEFORM_CHUNK_SIZE),
    duration: audioBuffer.duration,
    data: new Float32Array(data),
  }
}
