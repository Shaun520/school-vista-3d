import styles from '../Hud.module.scss'
import { buildLineOption } from './chartOptions'
import { useEChart } from './useEChart'

export function LineChart() {
  const hostRef = useEChart(buildLineOption)

  return (
    <div
      ref={hostRef}
      className={styles.chartSvg}
      role="img"
      aria-label="周一至周日学生出勤趋势"
    />
  )
}
