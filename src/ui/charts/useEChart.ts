import { useEffect, useRef } from 'react'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts/core'
import { getViewport, subscribeViewport } from '../../utils/viewport'
import { CAMPUS_THEME } from './echartsTheme'

type OptionFactory = () => EChartsOption

// ECharts 实例管理：首屏、容器 resize、档位/布局变化重建、卸载销毁。
export function useEChart(buildOption: OptionFactory) {
  const hostRef = useRef<HTMLDivElement>(null)
  const buildRef = useRef(buildOption)
  buildRef.current = buildOption

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const chart = echarts.init(host, CAMPUS_THEME, {
      renderer: 'canvas',
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    })
    chart.setOption(buildRef.current())

    const observer = new ResizeObserver(() => chart.resize())
    observer.observe(host)

    let lastTier = getViewport().tier
    let lastLayout = getViewport().layout

    const unsubscribe = subscribeViewport((snapshot) => {
      if (snapshot.tier === lastTier && snapshot.layout === lastLayout) return
      lastTier = snapshot.tier
      lastLayout = snapshot.layout
      // 订阅本身已在视口工具里用 rAF 合并，这里直接重建，避免再叠一层 rAF 造成延迟。
      chart.setOption(buildRef.current(), true)
      chart.resize()
    })

    return () => {
      unsubscribe()
      observer.disconnect()
      chart.dispose()
    }
  }, [])

  return hostRef
}
