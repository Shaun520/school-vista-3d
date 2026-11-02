// 视口单例：统一维护 CSS 变量、分辨率档位与订阅，避免各组件各自监听 resize。
import {
  DESIGN,
  computeUnit,
  resolveLayout,
  resolveTier,
  type LayoutMode,
  type ResolutionTier,
} from '../config/resolution'

export interface ViewportSnapshot {
  width: number
  height: number
  dpr: number
  unit: number
  tier: ResolutionTier
  layout: LayoutMode
}

type ViewportListener = (snapshot: ViewportSnapshot) => void

const listeners = new Set<ViewportListener>()

function readViewport(): ViewportSnapshot {
  const width = window.innerWidth
  const height = window.innerHeight
  const dpr = window.devicePixelRatio || 1

  return {
    width,
    height,
    dpr,
    unit: computeUnit(width, height),
    tier: resolveTier(width, height),
    layout: resolveLayout(width, height),
  }
}

let snapshot = readViewport()
let frame = 0
let initialized = false
let dprQuery: MediaQueryList | null = null
let watchedDpr = 0

function apply(next: ViewportSnapshot) {
  const root = document.documentElement
  root.style.setProperty('--u', `${next.unit}px`)
  root.style.setProperty('--u-vw', `${next.width / DESIGN.width}px`)
  root.style.setProperty('--u-vh', `${next.height / DESIGN.height}px`)
  root.dataset.resolution = next.tier
  root.dataset.layout = next.layout
  root.dataset.dpr = String(next.dpr)
}

// 跨显示器或浏览器缩放会改变 devicePixelRatio，但不一定触发 resize。
function watchDpr() {
  if (typeof window.matchMedia !== 'function') return
  dprQuery?.removeEventListener('change', schedule)
  watchedDpr = window.devicePixelRatio || 1
  dprQuery = window.matchMedia(`(resolution: ${watchedDpr}dppx)`)
  dprQuery.addEventListener('change', schedule)
}

function schedule() {
  // CSS 变量必须同步更新，避免大屏 resize 时先闪一帧旧尺寸。
  snapshot = readViewport()
  apply(snapshot)
  if (watchedDpr !== snapshot.dpr) watchDpr()

  if (frame) return
  frame = window.requestAnimationFrame(() => {
    frame = 0
    listeners.forEach((listener) => listener(snapshot))
  })
}

export function initViewport() {
  if (initialized) return () => {}
  initialized = true
  snapshot = readViewport()
  apply(snapshot)
  watchDpr()

  const observer = new ResizeObserver(schedule)
  observer.observe(document.documentElement)
  window.addEventListener('resize', schedule)

  // 部分环境切换 dpr 时不会派发 matchMedia/resize 事件，用低频轮询兜底。
  const dprTimer = window.setInterval(() => {
    if ((window.devicePixelRatio || 1) !== watchedDpr) schedule()
  }, 1000)

  return () => {
    observer.disconnect()
    window.removeEventListener('resize', schedule)
    window.clearInterval(dprTimer)
    dprQuery?.removeEventListener('change', schedule)
    dprQuery = null
    if (frame) window.cancelAnimationFrame(frame)
    frame = 0
    initialized = false
  }
}

export function getViewport() {
  return snapshot
}

export function subscribeViewport(listener: ViewportListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// 设计稿像素 → 当前视口 CSS 像素，供动态样式与图表计算使用。
export function designPx(value: number) {
  return value * snapshot.unit
}
