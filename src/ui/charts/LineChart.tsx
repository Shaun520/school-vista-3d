import styles from '../Hud.module.css'

const W = 400
const H = 156
const PL = 32
const PR = 8
const PT = 10
const PB = 22
const MAX = 600

const LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const SERIES = [
  { color: '#7ff0d8', data: [500, 500, 500, 500, 500, 500, 500], area: false },
  { color: '#35e0c0', data: [432, 446, 452, 438, 458, 452, 450], area: true },
  { color: '#ffd36a', data: [50, 44, 50, 52, 44, 50, 50], area: false },
]

const x = (index: number) => PL + ((W - PL - PR) * index) / (LABELS.length - 1)
const y = (value: number) => PT + (H - PT - PB) * (1 - value / MAX)

export function LineChart() {
  return (
    <svg
      className={styles.chartSvg}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="周一至周日学生出勤趋势"
    >
      <defs>
        <linearGradient id="areaGradLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35e0c0" stopOpacity=".5" />
          <stop offset="1" stopColor="#35e0c0" stopOpacity=".02" />
        </linearGradient>
        <filter id="glowLine" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0, 200, 400, 600].map((value) => (
        <g key={value}>
          <line
            x1={PL}
            y1={y(value)}
            x2={W - PR}
            y2={y(value)}
            stroke="rgba(56,232,198,.1)"
            strokeWidth="1"
          />
          <text
            x={PL - 6}
            y={y(value) + 3}
            fill="#5f827a"
            fontSize="8"
            textAnchor="end"
          >
            {value}
          </text>
        </g>
      ))}

      {LABELS.map((label, index) => (
        <text
          key={label}
          x={x(index)}
          y={H - 6}
          fill="#6c8d84"
          fontSize="8.5"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {SERIES.map((series) => (
        <g key={series.color}>
          {series.area && (
            <path
              d={`M ${x(0)} ${y(series.data[0])} L ${series.data
                .map((value, index) => `${x(index)} ${y(value)}`)
                .join(' L ')} L ${x(series.data.length - 1)} ${H - PB} L ${x(0)} ${H - PB} Z`}
              fill="url(#areaGradLine)"
              opacity=".55"
            />
          )}
          <polyline
            points={series.data.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
            fill="none"
            stroke={series.color}
            strokeWidth="1.9"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glowLine)"
          />
          {series.data.map((value, index) =>
            index === 2 || index === 4 ? (
              <circle
                key={`${series.color}-${index}`}
                cx={x(index)}
                cy={y(value)}
                r="2.6"
                fill="#05191b"
                stroke={series.color}
                strokeWidth="1.4"
              />
            ) : null,
          )}
        </g>
      ))}
    </svg>
  )
}
