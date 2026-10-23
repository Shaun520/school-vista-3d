import { useEffect, useState } from 'react'
import { useCampusStore, type Tab, type Weather } from '../store/useCampusStore'
import styles from './Hud.module.css'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'home', label: '系统首页' },
  { id: 'base', label: '基础数据' },
  { id: 'student', label: '学生信息' },
  { id: 'video', label: '视频监控' },
  { id: 'source', label: '生源信息' },
  { id: 'ai', label: 'AI小助手' },
]

const WEATHER_META: Record<Weather, { label: string; temp: string }> = {
  sunny: { label: '晴', temp: '16℃' },
  rain: { label: '雨', temp: '12℃' },
  snow: { label: '雪', temp: '-3℃' },
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function HeaderNav() {
  const activeTab = useCampusStore((state) => state.activeTab)
  const setActiveTab = useCampusStore((state) => state.setActiveTab)
  const weather = useCampusStore((state) => state.weather)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  const date = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`
  const weatherMeta = WEATHER_META[weather]

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <svg className={styles.logo} viewBox="0 0 64 64" aria-hidden="true">
          <defs>
            <linearGradient id="brandLogoGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0c6f68" />
              <stop offset=".55" stopColor="#2fe3c4" />
              <stop offset="1" stopColor="#c9fff4" />
            </linearGradient>
          </defs>
          <path
            d="M5 47c11-19 28-32 54-39-14 10-24 21-29 34-5-7-12-10-19-9 5-3 9-7 12-12-8 5-14 14-18 26z"
            fill="url(#brandLogoGradient)"
            opacity=".92"
          />
          <path
            d="M17 55c8-12 21-21 38-25-8 7-14 14-17 24-4-4-9-6-14-5 3-2 5-5 7-8-6 3-10 8-14 14z"
            fill="url(#brandLogoGradient)"
            opacity=".55"
          />
        </svg>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>智慧校园综合管理平台</h1>
          <p className={styles.brandSub}>SMART CAMPUS INTEGRATED PLATFORM</p>
        </div>
      </div>

      <nav className={styles.nav} aria-label="主导航">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.navItem} ${activeTab === tab.id ? styles.navItemActive : ''}`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={styles.status}>
        <div className={styles.timeBox}>
          <span className={styles.clock}>{time}</span>
          <span className={styles.date}>{date}</span>
        </div>
        <i className={styles.sep} />
        <div className={styles.weatherBox}>
          <span className={styles.statLoc}>唐山</span>
          <span className={styles.statWeather}>{weatherMeta.label}</span>
          <span className={styles.statTemp}>{weatherMeta.temp}</span>
          <span className={styles.statWind}>南风 3级</span>
        </div>
      </div>
    </header>
  )
}
