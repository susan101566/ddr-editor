import React from 'react'
import { Chart, Song, WaveBuffer } from 'app/type'
import { Canvas } from './canvas'
import styles from './app.module.css'
import { loadAudio, loadChart } from './song'
import { allSongs } from './songs_generated'

const fps = 60
const defaultSongId = Object.keys(allSongs)[0]

type State = {
  song: Song | null
  chart: Chart | null
  waveBuffer: WaveBuffer | null
  level: number, /* index into Chart.levels */
  isPlaying: boolean
  elapsed: number
  showWaveForm: boolean
}

export class App extends React.Component<{}, State> {
  state: State = {
    song: null,
    chart: null,
    waveBuffer: null,
    level: 0,
    isPlaying: false,
    elapsed: 0,
    showWaveForm: false,
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown)
    this.updateSong(allSongs[defaultSongId])
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown)
  }

  private audio: HTMLAudioElement | null = null
  private audioRef = (e: HTMLAudioElement | null) => {
    if (e) {
      this.audio = e
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === " ") {
      this.onTogglePlay(e)
      return
    }

    const diffSec = e.key === "k" ? 1 : e.key === "j" ? -1 : 0
    if (diffSec) {
      if (this.audio) {
        this.audio.currentTime += diffSec
      }
      this.setState({
        elapsed: this.state.elapsed + diffSec,
      })
    }
  }

  private onSongChange = (event: React.SyntheticEvent<HTMLSelectElement>) => {
    const sid: string = event.currentTarget.value
    const song = allSongs[sid]
    if (!song) {
      throw new Error(`App onSongChange: invalid song`)
    }
    this.updateSong(song)
  }

  private updateSong = (song: Song) => {
    this.setState({
      song,
      chart: null,
      isPlaying: false,
      elapsed: 0,
      level: 0,
    })

    if (this.audio) {
      this.audio.load()
      loadAudio(song)
        .then((waveBuffer) => {
          this.setState({
            waveBuffer,
          })
        })
        .catch((e) => {
          console.error(`App: updateSong audio failed for ${song.label}`, e)
        })
    }

    loadChart(song)
      .then((chart) => {
        this.setState({
          song,
          chart: chart,
          level: 0,
          elapsed: 0,
          isPlaying: false,
        })
      })
      .catch((e) => {
        console.error(`App: updateSong chart failed for ${song.label}`, e)
      })
  }

  private onShowWaveFormChange = (event: React.SyntheticEvent<HTMLInputElement>) => {
    this.setState({ showWaveForm: !this.state.showWaveForm })
  }

  private onDifficultyChange = (
    event: React.SyntheticEvent<HTMLSelectElement>
  ) => {
    const song = this.state.chart
    if (!song) {
      return
    }
    this.updateDifficulty(parseInt(event.currentTarget.value))
  }

  private updateDifficulty = (difficulty: number) => {
    this.setState({ level: difficulty })
  }

  playInterval: any = 0
  private onTogglePlay = (e: {
    preventDefault: () => void
    stopPropagation: () => void
  }) => {
    e.preventDefault()
    e.stopPropagation()
    if (this.state.isPlaying) {
      this.onPause()
    } else {
      this.onPlay()
    }
  }

  private onPause = () => {
    if (!this.playInterval) {
      throw new Error(`App: playing without interval`)
    }
    this.setState({ isPlaying: false })
    clearInterval(this.playInterval)
    this.playInterval = 0
    if (this.audio) {
      this.audio.pause()
    }
  }

  private onPlay = () => {
    if (this.playInterval) {
      throw new Error(`App: pausing with interval`)
    }
    const song = this.state.chart
    if (!song || !this.audio || this.audio.readyState !== 4) {
      throw new Error(`App: onPlay with no song or no audio or audio not ready`)
    }
    this.audio.play()
    this.setState({ isPlaying: true })
    const startTime = performance.now()
    let last = startTime
    this.playInterval = setInterval(() => {
      // debug frame rate
      const now = performance.now()
      console.log('time from last frame', now - last)
      last = now

      let elapsed = (performance.now() - startTime) / 1000
      if (this.audio) {
        elapsed = this.audio.currentTime
      }
      this.setState({ elapsed })
    }, 1000 / fps)
  }

  renderSongSelector() {
    return (
      <div className={styles.songSelect}>
        <select
          name="Song"
          value={this.state.song?.id}
          onChange={this.onSongChange}
        >
          {Object.keys(allSongs).map((sid) => (
            <option key={sid} value={sid}>
              {allSongs[sid].label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  renderChart() {
    const { chart } = this.state
    return (
      <div>
        {this.renderSongSelector()}

        <input type="checkbox" id="waveform" checked={this.state.showWaveForm} onChange={this.onShowWaveFormChange}/>
        <label htmlFor="waveform">Show Waveform</label>

        {!chart && <div>Select Song</div>}
        {chart && (
          <div>
            <div>Title: {chart.title}</div>
            <div>Artist: {chart.artist}</div>
            <div>
              Bpms: {chart.bpms.map((bpm) => `${bpm[0]}=${bpm[1]}`).join(",")}
            </div>
            <div>Offset: {chart.offset}</div>
            <select name="Difficulty" onChange={this.onDifficultyChange}>
              {chart.levels.map((level, i) => (
                <option key={i} value={i}>
                  {level.difficulty}
                </option>
              ))}
            </select>
            <div>Type: {chart.levels[this.state.level].type}</div>
            <div>Difficulty: {chart.levels[this.state.level].difficulty}</div>
            <button onClick={this.onTogglePlay}>
              {this.state.isPlaying ? `Pause` : `Play`}
            </button>
          </div>
        )}
      </div>
    )
  }

  public render() {
    const { chart, song } = this.state
    return (
      <div>
        <div className={styles.chart}>{this.renderChart()}</div>
        <audio ref={this.audioRef}>
          <source src={song?.audio} type="audio/mpeg" />
          <source src={song?.audio} type="audio/ogg" />
        </audio>
        <Canvas
          className={styles.canvas}
          chart={chart}
          level={this.state.level}
          elapsed={this.state.elapsed}
          waveBuffer={this.state.waveBuffer}
          showWaveForm={this.state.showWaveForm}
        />
      </div>
    )
  }
}
