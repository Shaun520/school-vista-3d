import styles from '../Hud.module.scss'
import { buildDonutOption, type DonutChartInput } from './chartOptions'
import { useEChart } from './useEChart'

export function DonutChart({ data, centerTop, centerSub }: DonutChartInput) {
  const hostRef = useEChart(() => buildDonutOption({ data, centerTop, centerSub }))

  return (
    <div
      ref={hostRef}
      className={styles.chartSvg}
      role="img"
      aria-label={centerSub}
    />
  )
}
