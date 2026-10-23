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
const OUT_DIR = path.resolve('.workbuddy/verify')
fs.mkdirSync(OUT_DIR, { recursive: true })

const errors = []
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => {
    errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`)
  })

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90_000 })
  await page.waitForFunction(() => !document.body.innerText.includes('正在加载数字孪生场景'), {
    timeout: 90_000,
  })
  await wait(2500)

  const perf = await page.$eval('#perf-readout', (element) => element.textContent)
  const panelTitle = await page.$eval(
    'aside[aria-label="数据面板"] h2',
    (element) => element.textContent,
  )
  const navText = await page.$$eval('header nav button', (elements) =>
    elements.map((element) => element.textContent?.trim()),
  )
  await page.screenshot({ path: path.join(OUT_DIR, 'home-1920.png') })

  const clickNav = async (label) => {
    return page.evaluate((text) => {
      const button = [...document.querySelectorAll('header nav button')].find(
        (element) => element.textContent?.trim() === text,
      )
      button?.click()
      return Boolean(button)
    }, label)
  }

  const panelHeading = () =>
    page.$eval('aside[aria-label="数据面板"] h2', (element) => element.textContent)

  await clickNav('视频监控')
  await wait(900)
  const videoTitle = await panelHeading()
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-video-1920.png') })

  await page.evaluate(() => {
    document.querySelector('[data-act="cctv"]')?.click()
  })
  await wait(400)
  const cameraCardVisible = await page.evaluate(
    () => Boolean(document.querySelector('[data-float-card="camera"]')?.offsetParent),
  )
  const cameraClicked = await page.evaluate(() => {
    const button = document.querySelector('[data-cam="2"]')
    button?.click()
    return Boolean(button)
  })
  await wait(800)
  const cameraActive = await page.evaluate(
    () => document.querySelector('[data-cam="2"]')?.getAttribute('data-active'),
  )
  await page.screenshot({ path: path.join(OUT_DIR, 'camera-card-1920.png') })
  await page.evaluate(() => {
    document.querySelector('[aria-label="关闭监控选择"]')?.click()
  })
  await wait(300)

  await clickNav('AI小助手')
  await wait(600)
  const aiTitle = await panelHeading()
  await page.type('input[placeholder="向DeepSeek提问..."]', '天气怎么样')
  await page.keyboard.press('Enter')
  await wait(2200)
  const aiAnswered = await page.evaluate(() =>
    document.body.innerText.includes('当前唐山为晴天'),
  )
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-ai-1920.png') })

  await clickNav('学生信息')
  await wait(500)
  const studentTitle = await panelHeading()
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-student-1920.png') })

  await clickNav('生源信息')
  await wait(900)
  const sourceTitle = await panelHeading()
  const sourceMap = await page.evaluate(() => Boolean(document.querySelector('svg.china-map')))
  await page.screenshot({ path: path.join(OUT_DIR, 'panel-source-1920.png') })

  await clickNav('系统首页')
  await wait(500)
  const homeTitle = await panelHeading()

  const poiClicked = await page.evaluate(() => {
    const button = document.querySelector('[data-poi="playground"]')
    button?.click()
    return Boolean(button)
  })
  await wait(400)
  const poiCardVisible = await page.evaluate(
    () => Boolean(document.querySelector('[data-poi-card]')),
  )
  const poiCardText = await page.evaluate(
    () => document.querySelector('[data-poi-card]')?.textContent ?? '',
  )
  await page.screenshot({ path: path.join(OUT_DIR, 'poi-card-1920.png') })
  await page.evaluate(() => {
    document.querySelector('[data-poi-close]')?.click()
  })
  await wait(250)
  const poiClosed = await page.evaluate(
    () => !document.querySelector('[data-poi-card]'),
  )

  await page.evaluate(() => {
    document.querySelector('[data-act="weather"]')?.click()
  })
  await wait(350)
  const weatherCardVisible = await page.evaluate(
    () => Boolean(document.querySelector('[data-float-card="weather"]')?.offsetParent),
  )
  await page.evaluate(() => {
    document.querySelector('[data-weather="snow"]')?.click()
  })
  await wait(350)
  const weatherActive = await page.evaluate(
    () => document.querySelector('[data-weather="snow"]')?.getAttribute('data-active'),
  )
  const headerWeather = await page.evaluate(() => document.querySelector('header')?.innerText ?? '')
  const timeValue = await page.evaluate(
    () => document.querySelector('[data-time-value]')?.textContent ?? '',
  )
  const toast = await page.evaluate(() => {
    const element = document.querySelector('[role="status"]')
    if (!element) return null
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    return {
      text: element.textContent ?? '',
      opacity: style.opacity,
      display: style.display,
      zIndex: style.zIndex,
      color: style.color,
      background: style.backgroundColor,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    }
  })
  await page.screenshot({ path: path.join(OUT_DIR, 'weather-card-1920.png') })

  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
  await wait(1200)
  await page.screenshot({ path: path.join(OUT_DIR, 'home-1366.png') })
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }))

  console.log(
    JSON.stringify(
      {
        perf,
        panelTitle,
        navText,
        interactions: {
          videoTitle,
          cameraCardVisible,
          cameraClicked,
          cameraActive,
          aiTitle,
          aiAnswered,
          studentTitle,
          sourceTitle,
          sourceMap,
          homeTitle,
          poiClicked,
          poiCardVisible,
          poiCardText,
          poiClosed,
          weatherCardVisible,
          weatherActive,
          headerWeather: headerWeather.replace(/\s+/g, ' ').trim(),
          timeValue,
          toast,
        },
        overflow,
        errors,
        screenshots: fs.readdirSync(OUT_DIR),
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
