import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((candidate) => candidate && fs.existsSync(candidate))

if (!CHROME) {
  throw new Error('未找到 Chrome/Edge，请通过 CHROME_PATH 指定可执行文件路径')
}

const BASE = 'http://127.0.0.1:5173/bench.html'
const OUT_DIR = path.resolve('.workbuddy/perf-benchmark')
fs.mkdirSync(OUT_DIR, { recursive: true })

const DATASETS = [100_000, 1_000_000]
const MODES = ['plain', 'lttb', 'presample', 'progressive']
const SAMPLE_TARGET = 4000
const CASES = DATASETS.flatMap((points) => MODES.map((mode) => ({ points, mode })))
const FPS_WINDOW_MS = 3000
const CASE_TIMEOUT_MS = 240_000

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--enable-precise-memory-info',
    '--window-size=1440,900',
  ],
})

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  fpsWindowMs: FPS_WINDOW_MS,
  cases: [],
}

const formatMs = (value) => `${Number(value).toFixed(1)}ms`
const formatMb = (value) => `${(Number(value) / 1024 / 1024).toFixed(1)}MB`

for (const { points, mode } of CASES) {
  const page = await browser.newPage()
  const consoleErrors = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))

  const record = {
    points,
    mode,
    status: 'failed',
    consoleErrors,
  }

  let peakHeapBytes = 0
  let heapSamples = 0
  let polling = false
  let heapTimer = 0

  try {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await page.goto(
      `${BASE}?points=${points}&mode=${mode}&sample=${SAMPLE_TARGET}&fpsMs=${FPS_WINDOW_MS}`,
      {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      },
    )

    // performance.memory 在 Chrome 中会被量化，用 CDP 周期采样真实 JS 堆峰值。
    heapTimer = setInterval(async () => {
      if (polling) return
      polling = true
      try {
        const metrics = await page.metrics()
        if (metrics.JSHeapUsedSize) {
          peakHeapBytes = Math.max(peakHeapBytes, metrics.JSHeapUsedSize)
          heapSamples += 1
        }
      } catch {
        // 页面关闭或超时后忽略采样错误。
      } finally {
        polling = false
      }
    }, 100)

    await page.waitForFunction(() => window.__BENCH_DONE__ === true, {
      timeout: CASE_TIMEOUT_MS,
    })

    const result = await page.evaluate(() => window.__BENCH_RESULT__)
    record.result = result
    record.pageMetrics = await page.metrics()
    peakHeapBytes = Math.max(peakHeapBytes, record.pageMetrics.JSHeapUsedSize || 0)
    record.peakHeapBytes = peakHeapBytes
    record.heapSamples = heapSamples

    if (result?.error) {
      record.error = result.error
      console.log(`FAIL ${points.toLocaleString()} points · ${mode} · ${result.error}`)
    } else {
      record.status = 'passed'
      const chart = await page.$('#chart')
      if (chart) {
        await chart.screenshot({
          path: path.join(OUT_DIR, `canvas-${points}-${mode}.png`),
        })
      }

      console.log(
        `PASS ${points.toLocaleString()} points · ${mode} · firstVisual ${formatMs(result.firstVisualMs)} · ` +
          `finished ${formatMs(result.finishedMs)} · fromNavigation ${formatMs(result.firstFrameFromNavigationMs)} · ` +
          `FPS ${result.fps.fps.toFixed(1)} · longTasks ${result.longTasks.count} ` +
          `(afterFirstVisual ${result.interactionLongTasks?.count ?? 0}) · peakHeap ${formatMb(peakHeapBytes)}`,
      )
    }
  } catch (error) {
    record.error = error instanceof Error ? error.message : String(error)
    console.log(`FAIL ${points.toLocaleString()} points · ${mode} · ${record.error}`)
  } finally {
    clearInterval(heapTimer)
    if (!record.peakHeapBytes && peakHeapBytes) record.peakHeapBytes = peakHeapBytes
    if (!record.heapSamples && heapSamples) record.heapSamples = heapSamples
    report.cases.push(record)
    fs.writeFileSync(
      path.join(OUT_DIR, 'report.json'),
      JSON.stringify(report, null, 2),
    )
    await page.close()
  }
}

await browser.close()

const failed = report.cases.filter((item) => item.status !== 'passed')
if (failed.length > 0) process.exitCode = 1

console.log(
  JSON.stringify(
    {
      cases: report.cases.map((item) => ({
        points: item.points,
        mode: item.mode,
        status: item.status,
        error: item.error,
      })),
      report: path.relative(process.cwd(), path.join(OUT_DIR, 'report.json')),
    },
    null,
    2,
  ),
)
