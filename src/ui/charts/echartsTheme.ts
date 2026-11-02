import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  AxisPointerComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  PieChart,
  AxisPointerComponent,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LabelLayout,
  CanvasRenderer,
])

export const CAMPUS_THEME = 'campus-dark'

echarts.registerTheme(CAMPUS_THEME, {
  color: ['#7ff0d8', '#35e0c0', '#ffd36a', '#38e8c6', '#2f9c8a', '#22616c'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", sans-serif',
    color: '#9fc9bd',
  },
  title: {
    textStyle: { color: '#eafff9', fontWeight: 600 },
    subtextStyle: { color: '#7fa79f' },
  },
  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#6c8d84' },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#5f827a' },
    splitLine: { lineStyle: { color: 'rgba(56,232,198,0.1)' } },
  },
  tooltip: {
    backgroundColor: 'rgba(6,24,25,0.94)',
    borderColor: 'rgba(56,232,198,0.4)',
    textStyle: { color: '#eafff9' },
  },
})
