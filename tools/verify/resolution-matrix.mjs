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

const BASE = 'http://127.0.0.1:5173/'
const OUT_DIR = path.resolve('.workbuddy/verify-matrix')
fs.mkdirSync(OUT_DIR, { recursive: true })

// expectedBuffer 为该档位下 R3F 实际渲染缓冲尺寸，自适应关闭后保持稳定。
const CASES = [
  { width: 1920, height: 1080, dpr: 1, tier: 'fhd', layout: 'standard', buffer: [1920, 1080], shot: true },
  { width: 1366, height: 768, dpr: 1, tier: 'fhd', layout: 'standard', buffer: [1366, 768], shot: true },
  { width: 2560, height: 1440, dpr: 1, tier: 'qhd', layout: 'standard', buffer: [2560, 1440], shot: true },
  { width: 3440, height: 1440, dpr: 1, tier: 'qhd', layout: 'wide', buffer: [3440, 1440], shot: true },
  { width: 3840, height: 2160, dpr: 1, tier: 'uhd', layout: 'standard', buffer: [3840, 2160], shot: true },
  { width: 3840, height: 2160, dpr: 2, tier: 'uhd', layout: 'standard', buffer: [5760, 3240], shot: false },
  { width: 5120, height: 1440, dpr: 1, tier: 'qhd', layout: 'ultra', buffer: [5120, 1440], shot: true },
  { width: 7680, height: 4320, dpr: 1, tier: '8k', layout: 'standard', buffer: [5760, 3240], shot: false },
  { width: 15360, height: 4320, dpr: 1, tier: '8k', layout: 'ultra', buffer: [8432, 2372], shot: false },
]

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function expectedLayoutMetrics({ width, height, dpr, layout }) {
  const unit = Math.min(width / 1920, height / 1080)
  let panelWidth = 440 * unit

  if (layout === 'wide') {
    panelWidth = Math.max(480 * unit, Math.min(width * 0.15, 620 * unit))
  } else if (layout === 'ultra') {
    panelWidth = Math.max(440 * unit, Math.min(width * 0.15, 720 * unit))
  }

  return { unit, headerHeight: 100 * unit, panelWidth, physicalDpr: dpr }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
    '--window-size=1920,1080',
  ],
})

const errors = []
const results = []
let failed = 0

try {
  const page = await browser.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`)
  })

  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90_000 })
  await page.waitForFunction(() => !document.body.innerText.includes('正在加载数字孪生场景'), {
    timeout: 90_000,
  })

  // 无头 SwiftShader 帧率远低于真实 GPU，关闭自适应保证矩阵尺寸可复现。
  await page.click('[data-act="settings"]')
  await wait(300)
  const adaptiveOn = await page.$eval(
    '[data-setting="adaptive"]',
    (element) => element.getAttribute('aria-checked') === 'true',
  )
  if (adaptiveOn) await page.click('[data-setting="adaptive"]')
  await wait(300)
  await page.click('[data-act="settings"]')
  await wait(300)

  for (const testCase of CASES) {
    const { width, height, dpr, tier, layout } = testCase
    const expected = expectedLayoutMetrics(testCase)
    const issues = []

    await page.setViewport({ width, height, deviceScaleFactor: dpr })
    await page.waitForFunction(
      (w, h, nextTier, nextLayout, unit) => {
        if (innerWidth !== w || innerHeight !== h) return false
        if (document.documentElement.dataset.resolution !== nextTier) return false
        if (document.documentElement.dataset.layout !== nextLayout) return false
        const currentUnit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u'))
        return Math.abs(currentUnit - unit) < 1e-6
      },
      { timeout: 60_000 },
      width,
      height,
      tier,
      layout,
      expected.unit,
    )

    await page.waitForFunction(
      (expectedWidth, expectedHeight) => {
        const canvas = document.querySelector('canvas')
        return Boolean(canvas) &&
          Math.abs(canvas.width - expectedWidth) <= 12 &&
          Math.abs(canvas.height - expectedHeight) <= 12
      },
      { timeout: 60_000 },
      testCase.buffer[0],
      testCase.buffer[1],
    )

    await wait(800)

    const metrics = await page.evaluate(() => {
      const root = document.documentElement
      const header = document.querySelector('header')
      const panel = document.querySelector('aside[aria-label="数据面板"]')
      const canvas = document.querySelector('canvas')
      const charts = Array.from(document.querySelectorAll('aside[aria-label="数据面板"] canvas'))
      const rect = (element) => {
        if (!element) return null
        const box = element.getBoundingClientRect()
        return { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }
      }

      return {
        unit: getComputedStyle(root).getPropertyValue('--u').trim(),
        tier: root.dataset.resolution,
        layout: root.dataset.layout,
        surfaceDpr: root.dataset.dpr,
        viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
        overflow: { w: root.scrollWidth, h: root.scrollHeight },
        header: rect(header),
        panel: rect(panel),
        canvas: canvas
          ? {
              css: rect(canvas),
              buffer: { w: canvas.width, h: canvas.height },
            }
          : null,
        charts: charts.map((item) => ({
          css: rect(item),
          buffer: { w: item.width, h: item.height },
        })),
        navCount: document.querySelectorAll('header nav button').length,
        poiCount: document.querySelectorAll('[data-poi]').length,
      }
    })

    if (metrics.viewport.w !== width || metrics.viewport.h !== height) {
      issues.push(`viewport ${metrics.viewport.w}x${metrics.viewport.h} != ${width}x${height}`)
    }
    if (metrics.overflow.w > width + 1 || metrics.overflow.h > height + 1) {
      issues.push(`overflow ${metrics.overflow.w}x${metrics.overflow.h}`)
    }
    if (!metrics.header || Math.abs(metrics.header.h - expected.headerHeight) > 2) {
      issues.push(`header height ${metrics.header?.h} != ${Math.round(expected.headerHeight)}`)
    }
    if (!metrics.panel || Math.abs(metrics.panel.w - expected.panelWidth) > 3) {
      issues.push(`panel width ${metrics.panel?.w} != ${Math.round(expected.panelWidth)}`)
    }
    if (!metrics.canvas) {
      issues.push('3D canvas missing')
    } else {
      if (Math.abs(metrics.canvas.css.w - width) > 2 || Math.abs(metrics.canvas.css.h - height) > 2) {
        issues.push(`3D canvas css ${metrics.canvas.css.w}x${metrics.canvas.css.h}`)
      }
      if (
        Math.abs(metrics.canvas.buffer.w - testCase.buffer[0]) > 12 ||
        Math.abs(metrics.canvas.buffer.h - testCase.buffer[1]) > 12
      ) {
        issues.push(`3D buffer ${metrics.canvas.buffer.w}x${metrics.canvas.buffer.h}`)
      }
    }
    if (metrics.charts.length < 2 || metrics.charts.some((chart) => !chart.buffer.w || !chart.buffer.h)) {
      issues.push(`charts ${metrics.charts.length}`)
    }
    if (metrics.navCount !== 6) issues.push(`nav count ${metrics.navCount}`)
    if (metrics.poiCount < 1) issues.push('POI labels missing')

    // 导航切换：学生信息 → 系统首页
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('header nav button')].find(
        (item) => item.textContent?.trim() === '学生信息',
      )
      button?.click()
    })
    await wait(450)
    const studentTitle = await page.evaluate(
      () => document.querySelector('aside[aria-label="数据面板"] h2')?.textContent?.trim() ?? '',
    )
    if (studentTitle !== '学生信息') issues.push(`student panel ${studentTitle}`)

    await page.evaluate(() => {
      const button = [...document.querySelectorAll('header nav button')].find(
        (item) => item.textContent?.trim() === '系统首页',
      )
      button?.click()
    })
    await wait(450)
    const homeTitle = await page.evaluate(
      () => document.querySelector('aside[aria-label="数据面板"] h2')?.textContent?.trim() ?? '',
    )
    if (homeTitle !== '学校安保巡查') issues.push(`home panel ${homeTitle}`)

    // POI 详情卡：打开 → 关闭
    await page.evaluate(() => {
      document.querySelector('[data-poi]')?.click()
    })
    await wait(400)
    const poiText = await page.evaluate(
      () => document.querySelector('[data-poi-card]')?.textContent?.trim() ?? '',
    )
    if (!poiText) issues.push('POI card not opened')
    await page.evaluate(() => {
      document.querySelector('[data-poi-close]')?.click()
    })
    await wait(250)
    const poiClosed = await page.evaluate(() => !document.querySelector('[data-poi-card]'))
    if (!poiClosed) issues.push('POI card not closed')

    if (testCase.shot) {
      const name = `matrix-${width}x${height}${dpr !== 1 ? `@${dpr}x` : ''}.png`
      await page.screenshot({ path: path.join(OUT_DIR, name) })
    }

    const record = {
      viewport: `${width}x${height}`,
      deviceScaleFactor: dpr,
      tier,
      layout,
      unit: metrics.unit,
      headerHeight: metrics.header?.h ?? null,
      panelWidth: metrics.panel?.w ?? null,
      canvasCss: metrics.canvas?.css ?? null,
      canvasBuffer: metrics.canvas?.buffer ?? null,
      chartCount: metrics.charts.length,
      chartSizes: metrics.charts.map((chart) => ({
        css: `${chart.css?.w}x${chart.css?.h}`,
        buffer: `${chart.buffer.w}x${chart.buffer.h}`,
      })),
      overflow: metrics.overflow,
      issues,
      passed: issues.length === 0,
    }

    results.push(record)
    if (issues.length > 0) failed += 1
    console.log(
      `${issues.length === 0 ? 'PASS' : 'FAIL'} ${width}x${height}@${dpr} · ${tier}/${layout} · panel ${record.panelWidth} · buffer ${record.canvasBuffer?.w}x${record.canvasBuffer?.h}${issues.length ? ` · ${issues.join('; ')}` : ''}`,
    )
  }
} finally {
  await browser.close()
}

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  cases: results,
  consoleErrors: errors,
  passed: failed === 0 && errors.length === 0,
}

fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 2))

if (!report.passed) {
  failed += errors.length > 0 ? 1 : 0
  process.exitCode = 1
}

console.log(
  JSON.stringify(
    { passed: report.passed, failedCases: failed, consoleErrors: errors.length, report: path.relative(process.cwd(), path.join(OUT_DIR, 'report.json')) },
    null,
    2,
  ),
)
