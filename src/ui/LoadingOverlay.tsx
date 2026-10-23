import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import styles from './Hud.module.css'

export function LoadingOverlay() {
  const { active, progress } = useProgress()
  const [started, setStarted] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (active) setStarted(true)
  }, [active])

  const done = started && !active && progress >= 100

  useEffect(() => {
    if (!done) return
    const timer = window.setTimeout(() => setHidden(true), 650)
    return () => window.clearTimeout(timer)
  }, [done])

  if (hidden) return null

  return (
    <div className={`${styles.loading} ${done ? styles.loadingHide : ''}`}>
      <div className={styles.loadInner}>
        <svg className={styles.loadLogo} viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="loadLogoGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0c6f68" />
              <stop offset=".55" stopColor="#2fe3c4" />
              <stop offset="1" stopColor="#c9fff4" />
            </linearGradient>
          </defs>
          <path
            d="M5 47c11-19 28-32 54-39-14 10-24 21-29 34-5-7-12-10-19-9 5-3 9-7 12-12-8 5-14 14-18 26z"
            fill="url(#loadLogoGradient)"
          />
          <path
            d="M17 55c8-12 21-21 38-25-8 7-14 14-17 24-4-4-9-6-14-5 3-2 5-5 7-8-6 3-10 8-14 14z"
            fill="url(#loadLogoGradient)"
            opacity=".55"
          />
        </svg>
        <h2 className={styles.loadTitle}>智慧校园综合管理平台</h2>
        <p className={styles.loadSub}>SMART CAMPUS INTEGRATED PLATFORM</p>
        <div className={styles.loadBar}>
          <i className={styles.loadBarFill} />
        </div>
        <div className={styles.loadText}>正在加载数字孪生场景…</div>
      </div>
    </div>
  )
}
