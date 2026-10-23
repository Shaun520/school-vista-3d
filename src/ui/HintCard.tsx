import { useCampusStore } from '../store/useCampusStore'
import styles from './Hud.module.css'

export function HintCard() {
  const title = useCampusStore((state) => state.hintTitle)
  const lines = useCampusStore((state) => state.hintLines)

  return (
    <div className={styles.hintCard}>
      <div className={styles.hcTitle}>
        <span className={styles.tri} />
        <span>{title}</span>
      </div>
      <div className={styles.hcLine}>
        {lines.map((line, index) => (
          <span key={line}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
    </div>
  )
}
