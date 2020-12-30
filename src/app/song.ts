import { WAVEFORM_CHUNK_SIZE } from "./constants"
import { parseSong } from "./parser"
import { Chart, Song, WaveBuffer } from "./type"

export async function loadChart(song: Song): Promise<Chart> {
  return fetch(song.sm, {
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
    throw new Error(`App: Cannot fetch ${song.sm}, ${e}`)
  })
}

const audioContext = new AudioContext();
export async function loadAudio(song: Song): Promise<WaveBuffer> {
  const audioBufferPromise = fetch(song.audio)
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
