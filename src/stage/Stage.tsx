import { useEffect, useState, type ReactNode } from 'react'
import styles from './Stage.module.css'

export function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className={styles.viewport}>
      <div
        className={styles.stage}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}
