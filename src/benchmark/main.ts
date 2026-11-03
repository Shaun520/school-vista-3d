import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { generateSeries, lttbSeries } from './data'
import './benchmark.css'

echarts.use([LineChart, GridComponent, DataZoomComponent, CanvasRenderer])

type BenchMode = 'plain' | 'lttb' | 'presample' | 'progressive'

const MODES: BenchMode[] = ['plain', 'lttb', 'presample', 'progressive']

interface Summary {
  count: number
  avgMs: number
  maxMs: number
  p95Ms: number
}

interface LongTaskEntry {
  start: number
  duration: number
}

interface MemorySummary {
  supported: boolean
  peakBytes: number
  endBytes: number
  limitBytes: number
  samples: number
  note: string
}

interface FpsResult {
  fps: number
  frames: number
  elapsedMs: number
  visiblePercent: number
  update: Summary
}

interface BenchmarkResult {
  points: number
  mode?: BenchMode
  renderer?: string
  devicePixelRatio?: number
  chartSize?: { width: number; height: number }
  pageReadyMs?: number
  dataGenMs?: number
  presampleMs?: number
  sampledPoints?: number
  chartInitMs?: number
  setOptionMs?: number
  firstRenderedMs?: number
  firstVisualMs?: number
  finishedMs?: number
  firstRenderMs?: number
  firstFrameMs?: number
  totalFirstFrameMs?: number
  firstRenderFromNavigationMs?: number
  firstFrameFromNavigationMs?: number
  fps?: FpsResult
  longTasks?: Summary & { supported: boolean }
  interactionLongTasks?: Summary & { supported: boolean }
  performanceMemory?: MemorySummary
  environment?: {
    hardwareConcurrency: number
    deviceMemory: number | null
    userAgent: string
  }
  option?: {
    mode: BenchMode
    animation: boolean
    progressive: boolean
    appendData: boolean
    sampling: string
    presampleTarget: number | null
    dataZoomWindowPercent: number
  }
  error?: string
}

declare global {
  interface Window {
    __BENCH_RESULT__?: BenchmarkResult
    __BENCH_DONE__?: boolean
  }
}

type ChartInstance = ReturnType<typeof echarts.init>

interface ChromePerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

const CHART_WIDTH = 1280
const CHART_HEIGHT = 600
const VISIBLE_PERCENT = 20
const FIRST_RENDER_TIMEOUT_MS = 90_000

function summarize(values: number[]): Summary {
  if (values.length === 0) return { count: 0, avgMs: 0, maxMs: 0, p95Ms: 0 }
  const sorted = [...values].sort((a, b) => a - b)
  const sum = values.reduce((total, value) => total + value, 0)
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0
  return {
    count: values.length,
    avgMs: sum / values.length,
    maxMs: sorted[sorted.length - 1] ?? 0,
    p95Ms: p95,
  }
}

function buildOption(data: number[], mode: BenchMode, xValues?: number[]): EChartsOption {
  const progressiveOptions =
    mode === 'progressive'
      ? { progressive: 2000, progressiveThreshold: 5000, progressiveChunkMode: 'mod' as const }
      : {}

  return {
    animation: false,
    backgroundColor: '#04090b',
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: {
      type: 'category',
      data: xValues,
      show: false,
      boundaryGap: false,
      axisLabel: { show: false },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#5f827a', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(56,232,198,0.12)' } },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
      },
    ],
    series: [
      {
        type: 'line',
        data,
        showSymbol: false,
        sampling: mode === 'lttb' ? 'lttb' : 'none',
        lineStyle: { width: 1, color: '#35e0c0' },
        emphasis: { disabled: true },
        ...progressiveOptions,
      },
    ],
  }
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function measureInteractionFps(chart: ChartInstance, durationMs: number): Promise<FpsResult> {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    const updateTimes: number[] = []
    let frames = 0

    const step = () => {
      const now = performance.now()
      const elapsed = now - startedAt

      if (elapsed >= durationMs) {
        resolve({
          fps: frames / (elapsed / 1000),
          frames,
          elapsedMs: elapsed,
          visiblePercent: VISIBLE_PERCENT,
          update: summarize(updateTimes),
        })
        return
      }

      const progress = elapsed / durationMs
      const start = (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5) * (100 - VISIBLE_PERCENT)
      const dispatchStart = performance.now()
      chart.dispatchAction({
        type: 'dataZoom',
        start,
        end: start + VISIBLE_PERCENT,
      })
      updateTimes.push(performance.now() - dispatchStart)
      frames += 1
      requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  })
}

async function run() {
  const pointsEl = document.querySelector<HTMLElement>('#bench-points')
  const statusEl = document.querySelector<HTMLElement>('#bench-status')
  const chartEl = document.querySelector<HTMLElement>('#chart')
  const resultEl = document.querySelector<HTMLElement>('#bench-result')

  if (!pointsEl || !statusEl || !chartEl || !resultEl) {
    throw new Error('基准页面 DOM 未就绪')
  }

  const params = new URLSearchParams(window.location.search)
  const points = Math.max(10_000, Number(params.get('points') ?? 100_000) || 100_000)
  const fpsWindowMs = Math.max(1000, Number(params.get('fpsMs') ?? 3000) || 3000)
  const requestedMode = params.get('mode') ?? 'plain'
  const mode: BenchMode = MODES.includes(requestedMode as BenchMode)
    ? (requestedMode as BenchMode)
    : 'plain'
  const sampleTarget = Math.max(1000, Number(params.get('sample') ?? 4000) || 4000)

  pointsEl.textContent = `${points.toLocaleString('zh-CN')} · ${mode}`
  window.__BENCH_RESULT__ = undefined
  window.__BENCH_DONE__ = false
  statusEl.textContent = '准备生成数据...'

  const benchStart = performance.now()
  const longTaskEntries: LongTaskEntry[] = []
  let longTaskSupported = true
  let longTaskObserver: PerformanceObserver | null = null

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // 初始同步任务可能早于 benchStart 开始，但结束时间落在基准窗口内，也应计入。
        if (entry.startTime + entry.duration >= benchStart) {
          longTaskEntries.push({ start: entry.startTime, duration: entry.duration })
        }
      }
    })
    longTaskObserver.observe({ entryTypes: ['longtask'] })
  } catch {
    longTaskSupported = false
  }

  const memory = (performance as Performance & { memory?: ChromePerformanceMemory }).memory
  const memorySamples: number[] = []
  const sampleMemory = () => {
    if (memory) memorySamples.push(memory.usedJSHeapSize)
  }
  sampleMemory()
  const memoryTimer = window.setInterval(sampleMemory, 100)

  try {
    statusEl.textContent = `生成 ${points.toLocaleString('zh-CN')} 点数据...`
    const dataStart = performance.now()
    let sourceData = generateSeries(points)
    const dataGenMs = performance.now() - dataStart

    let renderData = sourceData
    let xValues: number[] | undefined
    let presampleMs = 0
    let sampledPoints = points

    if (mode === 'presample') {
      statusEl.textContent = `LTTB 预降采样到 ${sampleTarget.toLocaleString('zh-CN')} 点...`
      const sampleStart = performance.now()
      const sampled = lttbSeries(sourceData, sampleTarget)
      presampleMs = performance.now() - sampleStart
      renderData = sampled.values
      xValues = sampled.indices
      sampledPoints = sampled.values.length
      sourceData = []
    }

    statusEl.textContent = '初始化图表的 Canvas...'
    const chartStart = performance.now()
    const chart = echarts.init(chartEl, undefined, {
      renderer: 'canvas',
      devicePixelRatio: 1,
    })
    const chartInitMs = performance.now() - chartStart

    statusEl.textContent = '执行首次 setOption...'
    let firstRenderedHandler: (() => void) | null = null
    const firstRendered = new Promise<number>((resolve) => {
      firstRenderedHandler = () => {
        if (firstRenderedHandler) chart.off('rendered', firstRenderedHandler)
        resolve(performance.now())
      }
      chart.on('rendered', firstRenderedHandler)
    })

    let finishHandler: (() => void) | null = null
    const firstFinished = new Promise<number>((resolve) => {
      finishHandler = () => {
        if (finishHandler) chart.off('finished', finishHandler)
        resolve(performance.now())
      }
      chart.on('finished', finishHandler)
    })

    const optionStart = performance.now()
    chart.setOption(buildOption(renderData, mode, xValues))
    const setOptionMs = performance.now() - optionStart

    statusEl.textContent = `等待首帧（${mode}）...`
    const firstRenderedAt = await withTimeout(
      firstRendered,
      FIRST_RENDER_TIMEOUT_MS,
      '首帧渲染超时',
    )
    await nextPaint()
    const firstFrameAt = performance.now()

    statusEl.textContent = `等待全部渲染完成（${mode}）...`
    const finishedAt = await withTimeout(
      firstFinished,
      FIRST_RENDER_TIMEOUT_MS,
      '全部渲染超时',
    )

    statusEl.textContent = '采样图表交互 FPS...'
    const fps = await measureInteractionFps(chart, fpsWindowMs)
    await new Promise((resolve) => window.setTimeout(resolve, 200))

    if (longTaskObserver) {
      for (const entry of longTaskObserver.takeRecords()) {
        if (entry.startTime + entry.duration >= benchStart) {
          longTaskEntries.push({ start: entry.startTime, duration: entry.duration })
        }
      }
      longTaskObserver.disconnect()
    }

    const longTaskSummary = {
      supported: longTaskSupported,
      ...summarize(longTaskEntries.map((entry) => entry.duration)),
    }
    const interactionLongTaskSummary = {
      supported: longTaskSupported,
      ...summarize(
        longTaskEntries
          .filter((entry) => entry.start >= firstFrameAt)
          .map((entry) => entry.duration),
      ),
    }

    const memorySummary: MemorySummary = {
      supported: Boolean(memory),
      peakBytes: memorySamples.length ? Math.max(...memorySamples) : 0,
      endBytes: memory?.usedJSHeapSize ?? 0,
      limitBytes: memory?.jsHeapSizeLimit ?? 0,
      samples: memorySamples.length,
      note: 'performance.memory 在 Chrome 中可能被量化，最终峰值以 CDP JSHeapUsedSize 为准',
    }

    const result: BenchmarkResult = {
      points,
      mode,
      renderer: 'canvas-2d',
      devicePixelRatio: 1,
      chartSize: { width: CHART_WIDTH, height: CHART_HEIGHT },
      pageReadyMs: benchStart,
      dataGenMs,
      presampleMs,
      sampledPoints,
      chartInitMs,
      setOptionMs,
      firstRenderedMs: firstRenderedAt - chartStart,
      firstVisualMs: firstFrameAt - chartStart,
      finishedMs: finishedAt - chartStart,
      firstRenderMs: finishedAt - chartStart,
      firstFrameMs: firstFrameAt - chartStart,
      totalFirstFrameMs: firstFrameAt - benchStart,
      firstRenderFromNavigationMs: finishedAt,
      firstFrameFromNavigationMs: firstFrameAt,
      fps,
      longTasks: longTaskSummary,
      interactionLongTasks: interactionLongTaskSummary,
      performanceMemory: memorySummary,
      environment: {
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory:
          (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
        userAgent: navigator.userAgent,
      },
      option: {
        mode,
        animation: false,
        progressive: mode === 'progressive',
        appendData: false,
        sampling: mode === 'lttb' ? 'lttb' : 'none',
        presampleTarget: mode === 'presample' ? sampleTarget : null,
        dataZoomWindowPercent: VISIBLE_PERCENT,
      },
    }

    window.__BENCH_RESULT__ = result
    window.__BENCH_DONE__ = true
    statusEl.textContent = `完成 · ${points.toLocaleString('zh-CN')} 点 · ${mode} · ${fps.fps.toFixed(1)} FPS`
    resultEl.textContent = JSON.stringify(result, null, 2)
  } finally {
    window.clearInterval(memoryTimer)
    longTaskObserver?.disconnect()
  }
}

run().catch((error: unknown) => {
  const pointsEl = document.querySelector<HTMLElement>('#bench-points')
  const statusEl = document.querySelector<HTMLElement>('#bench-status')
  const resultEl = document.querySelector<HTMLElement>('#bench-result')
  const message = error instanceof Error ? error.message : String(error)
  const points = Number(new URLSearchParams(window.location.search).get('points') ?? 100_000)

  if (statusEl) statusEl.textContent = `基准失败：${message}`
  if (resultEl) resultEl.textContent = message
  if (pointsEl) pointsEl.textContent = points.toLocaleString('zh-CN')

  window.__BENCH_RESULT__ = { points, error: message }
  window.__BENCH_DONE__ = true
})
