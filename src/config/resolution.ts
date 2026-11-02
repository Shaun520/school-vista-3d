// 大屏分辨率档位配置：档位按 CSS 视口尺寸判定，dpr 只参与渲染缓冲计算。
export const DESIGN = { width: 1920, height: 1080 } as const

export type ResolutionTier = 'fhd' | 'qhd' | 'uhd' | '8k'
export type LayoutMode = 'standard' | 'wide' | 'ultra'

export interface ResolutionProfile {
  tier: ResolutionTier
  dprCap: number
  renderScale: number
  lowRenderScale: number
  maxRenderPixels: number
  shadowMapSize: number
  chartAnimate: boolean
  chartMinFontPx: number
}

export const PROFILES: Record<ResolutionTier, ResolutionProfile> = {
  fhd: {
    tier: 'fhd',
    dprCap: 2,
    renderScale: 1,
    lowRenderScale: 0.75,
    maxRenderPixels: 20_000_000,
    shadowMapSize: 2048,
    chartAnimate: true,
    chartMinFontPx: 9,
  },
  qhd: {
    tier: 'qhd',
    dprCap: 2,
    renderScale: 1,
    lowRenderScale: 0.75,
    maxRenderPixels: 20_000_000,
    shadowMapSize: 2048,
    chartAnimate: true,
    chartMinFontPx: 9,
  },
  uhd: {
    tier: 'uhd',
    dprCap: 2,
    renderScale: 1,
    lowRenderScale: 0.75,
    maxRenderPixels: 20_000_000,
    shadowMapSize: 2048,
    chartAnimate: true,
    chartMinFontPx: 10,
  },
  '8k': {
    tier: '8k',
    dprCap: 2,
    renderScale: 0.75,
    lowRenderScale: 0.6,
    maxRenderPixels: 20_000_000,
    shadowMapSize: 1024,
    chartAnimate: false,
    chartMinFontPx: 12,
  },
}

// 渲染档位按物理像素判定：CSS 尺寸 × dpr，避免 8K 屏在 200% 系统缩放下被误判为 4K。
export const resolveRenderTier = (
  width: number,
  height: number,
  dpr: number,
): ResolutionTier => {
  const physicalPixels = width * dpr * height * dpr
  if (physicalPixels >= 25_000_000) return '8k'
  if (physicalPixels >= 7_000_000) return 'uhd'
  if (physicalPixels >= 3_500_000) return 'qhd'
  return 'fhd'
}

export const MIN_RENDER_DPR = 0.4

// 同时受设备 dpr、档位缩放、像素预算与自适应等级约束，输出最终 WebGL 像素比。
export function resolveRenderDpr(
  width: number,
  height: number,
  dpr: number,
  profile: ResolutionProfile,
  quality: boolean,
  adaptiveScale = 1,
) {
  const scale = quality ? profile.renderScale : profile.lowRenderScale
  const desired = Math.min(dpr, profile.dprCap) * scale
  const pixelBudget = Math.sqrt(profile.maxRenderPixels / (width * height))
  return Math.max(MIN_RENDER_DPR, Math.min(desired, pixelBudget) * adaptiveScale)
}

export const ADAPTIVE_QUALITY = {
  warmupSeconds: 5,
  sampleSeconds: 2,
  declineFps: 28,
  inclineFps: 50,
  cooldownSeconds: 6,
  scales: [1, 0.9, 0.78, 0.65],
} as const

// 1 设计像素对应多少个 CSS 像素；1920×1080 下为 1。
export const computeUnit = (width: number, height: number) =>
  Math.min(width / DESIGN.width, height / DESIGN.height)

export const resolveTier = (width: number, height: number): ResolutionTier => {
  const unit = computeUnit(width, height)
  if (unit >= 3.5) return '8k'
  if (unit >= 1.8) return 'uhd'
  if (unit >= 1.25) return 'qhd'
  return 'fhd'
}

export const resolveLayout = (width: number, height: number): LayoutMode => {
  const ratio = width / height
  if (ratio >= 3) return 'ultra'
  if (ratio >= 2.1) return 'wide'
  return 'standard'
}

export interface ChartMetrics {
  axisFontSize: number
  labelFontSize: number
  legendFontSize: number
  centerValueFontSize: number
  pieLabelFontSize: number
  tooltipFontSize: number
  symbolSize: number
  lineWidth: number
}

// ECharts 使用真实 CSS 像素字号，不能沿用默认 12px。
export function chartMetrics(unit: number, profile: ResolutionProfile): ChartMetrics {
  const font = (designPx: number) =>
    Math.max(profile.chartMinFontPx, Math.round(designPx * unit))

  return {
    axisFontSize: font(8.5),
    labelFontSize: font(9),
    legendFontSize: font(10),
    centerValueFontSize: font(24),
    pieLabelFontSize: font(11),
    tooltipFontSize: Math.max(12, Math.round(11 * unit)),
    symbolSize: Math.max(2, Math.round(3 * unit)),
    lineWidth: Math.max(1, 1.9 * unit),
  }
}
