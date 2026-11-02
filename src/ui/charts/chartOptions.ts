import type { EChartsOption } from 'echarts'
import { PROFILES, chartMetrics } from '../../config/resolution'
import { getViewport } from '../../utils/viewport'

export interface DonutSlice {
  value: number
  color: string
  name?: string
}

export interface DonutChartInput {
  data: DonutSlice[]
  centerTop: string
  centerSub: string
}

const WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const ON_TIME = [500, 500, 500, 500, 500, 500, 500]
const PRESENT = [432, 446, 452, 438, 458, 452, 450]
const ABSENT = [50, 44, 50, 52, 44, 50, 50]

export function buildLineOption(): EChartsOption {
  const viewport = getViewport()
  const profile = PROFILES[viewport.tier]
  const metrics = chartMetrics(viewport.unit, profile)

  return {
    animation: profile.chartAnimate,
    animationDuration: 600,
    grid: {
      left: Math.round(32 * viewport.unit),
      right: Math.round(10 * viewport.unit),
      top: Math.round(8 * viewport.unit),
      bottom: Math.round(22 * viewport.unit),
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      textStyle: { fontSize: metrics.tooltipFontSize },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: 'rgba(56,232,198,0.35)',
          width: Math.max(1, Math.round(viewport.unit)),
        },
      },
    },
    xAxis: {
      type: 'category',
      data: WEEK,
      boundaryGap: false,
      axisLabel: {
        fontSize: metrics.axisFontSize,
        margin: Math.round(8 * viewport.unit),
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 600,
      interval: 200,
      axisLabel: {
        fontSize: metrics.axisFontSize,
        margin: Math.round(6 * viewport.unit),
      },
      splitLine: {
        lineStyle: { width: Math.max(1, Math.round(viewport.unit)) },
      },
    },
    series: [
      {
        name: '应到校',
        type: 'line',
        data: ON_TIME,
        showSymbol: false,
        lineStyle: { color: '#7ff0d8', width: metrics.lineWidth },
        emphasis: { disabled: true },
        z: 2,
      },
      {
        name: '实际到校',
        type: 'line',
        data: PRESENT,
        showSymbol: false,
        lineStyle: { color: '#35e0c0', width: metrics.lineWidth },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(53,224,192,0.5)' },
              { offset: 1, color: 'rgba(53,224,192,0.02)' },
            ],
          },
        },
        emphasis: { disabled: true },
        z: 3,
      },
      {
        name: '缺勤人数',
        type: 'line',
        data: ABSENT,
        showSymbol: false,
        lineStyle: { color: '#ffd36a', width: metrics.lineWidth },
        emphasis: { disabled: true },
        z: 4,
      },
    ],
  }
}

export function buildDonutOption({ data, centerTop, centerSub }: DonutChartInput): EChartsOption {
  const viewport = getViewport()
  const profile = PROFILES[viewport.tier]
  const metrics = chartMetrics(viewport.unit, profile)

  return {
    animation: profile.chartAnimate,
    animationDuration: 600,
    title: [
      {
        text: centerTop,
        left: 'center',
        top: '38%',
        textAlign: 'center',
        textStyle: {
          color: '#eafff9',
          fontSize: metrics.centerValueFontSize,
          fontWeight: 600,
        },
      },
      {
        text: centerSub,
        left: 'center',
        top: '56%',
        textAlign: 'center',
        textStyle: {
          color: '#7fa79f',
          fontSize: metrics.labelFontSize,
          fontWeight: 400,
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c} ({d}%)',
      textStyle: { fontSize: metrics.tooltipFontSize },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '77%'],
        center: ['50%', '50%'],
        startAngle: 90,
        clockwise: true,
        avoidLabelOverlap: true,
        percentPrecision: 0,
        itemStyle: {
          borderColor: 'rgba(3,12,15,0.9)',
          borderWidth: Math.max(1, Math.round(2 * viewport.unit)),
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          color: '#eafff9',
          fontSize: metrics.pieLabelFontSize,
          fontWeight: 500,
        },
        labelLine: { show: false },
        emphasis: { scale: false },
        data: data.map((slice, index) => ({
          name: slice.name ?? `分类${index + 1}`,
          value: slice.value,
          itemStyle: { color: slice.color },
        })),
      },
    ],
  }
}
