import styles from '../Hud.module.css'

interface Slice {
  value: number
  color: string
}

interface DonutChartProps {
  data: Slice[]
  centerTop: string
  centerSub: string
}

const SIZE = 200
const CENTER = 100
const RADIUS = 66
const STROKE = 22

export function DonutChart({ data, centerTop, centerSub }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let startAngle = -Math.PI / 2

  const arcs = data.map((item, index) => {
    const angle = (item.value / total) * Math.PI * 2
    const endAngle = startAngle + angle - 0.04
    const x1 = CENTER + Math.cos(startAngle) * RADIUS
    const y1 = CENTER + Math.sin(startAngle) * RADIUS
    const x2 = CENTER + Math.cos(endAngle) * RADIUS
    const y2 = CENTER + Math.sin(endAngle) * RADIUS
    const largeArc = angle > Math.PI ? 1 : 0
    const mid = startAngle + angle / 2
    const labelX = CENTER + Math.cos(mid) * (RADIUS + 20)
    const labelY = CENTER + Math.sin(mid) * (RADIUS + 20)
    const percent = Math.round((item.value / total) * 100)

    startAngle += angle

    return (
      <g key={`${item.color}-${index}`}>
        <path
          d={`M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={item.color}
          strokeWidth={STROKE}
          strokeLinecap="butt"
        />
        <text
          x={labelX}
          y={labelY + 4}
          fill="#9fc9bd"
          fontSize="11"
          textAnchor="middle"
        >
          {percent}%
        </text>
      </g>
    )
  })

  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ filter: 'drop-shadow(0 0 8px rgba(56,232,198,.15))' }}
      role="img"
      aria-label={centerSub}
    >
      {arcs}
      <text
        x={CENTER}
        y={CENTER - 4}
        fill="#eafff9"
        fontSize="24"
        fontWeight="600"
        textAnchor="middle"
      >
        {centerTop}
      </text>
      <text
        x={CENTER}
        y={CENTER + 16}
        fill="#7fa79f"
        fontSize="9"
        letterSpacing="2"
        textAnchor="middle"
      >
        {centerSub}
      </text>
    </svg>
  )
}
