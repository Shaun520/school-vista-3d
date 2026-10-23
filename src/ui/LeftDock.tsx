import { useCampusStore } from '../store/useCampusStore'
import styles from './Hud.module.css'

const DEFAULT_HINT = {
  title: '视角移动模式',
  lines: ['按住鼠标右键，左右滑动旋转视角', 'WASD 前后左右移动，QE 上下升降'],
}

export function LeftDock() {
  const activeTab = useCampusStore((state) => state.activeTab)
  const setActiveTab = useCampusStore((state) => state.setActiveTab)
  const openCard = useCampusStore((state) => state.openCard)
  const toggleCard = useCampusStore((state) => state.toggleCard)
  const viewMode = useCampusStore((state) => state.viewMode)
  const setViewMode = useCampusStore((state) => state.setViewMode)
  const setHint = useCampusStore((state) => state.setHint)
  const setCameraPreset = useCampusStore((state) => state.setCameraPreset)
  const showToast = useCampusStore((state) => state.showToast)

  const goHome = () => {
    setActiveTab('home')
    setCameraPreset('home')
    setViewMode('orbit')
    setHint(DEFAULT_HINT.title, DEFAULT_HINT.lines)
  }

  const toggleView = () => {
    const next = viewMode === 'free' ? 'orbit' : 'free'
    setViewMode(next)
    if (next === 'free') {
      setHint('视角移动模式', [
        '按住鼠标右键，左右滑动旋转视角',
        'WASD 前后左右移动，QE 上下升降',
      ])
    } else {
      setHint('环绕视角', ['右键拖拽旋转视角', '滚轮缩放，左键平移'])
    }
  }

  const toggleWalk = () => {
    const next = viewMode === 'third' ? 'orbit' : 'third'
    setViewMode(next)
    if (next === 'third') {
      setHint('第三人称漫游', [
        '鼠标左右滑动旋转视角，WASD 前后左右移动',
        '第三人称角色漫游入口已保留，场景交互待接入',
      ])
    } else {
      setHint(DEFAULT_HINT.title, DEFAULT_HINT.lines)
    }
  }

  const resetCamera = () => {
    setCameraPreset('home')
    setViewMode('orbit')
    setHint(DEFAULT_HINT.title, DEFAULT_HINT.lines)
    showToast('视角已复位')
  }

  return (
    <aside className={styles.dock} aria-label="快捷工具栏">
      <button
        type="button"
        className={`${styles.dockButton} ${activeTab === 'home' ? styles.dockButtonActive : ''}`}
        data-act="home"
        aria-label="系统首页"
        onClick={goHome}
      >
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="8" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="3" y="15" width="7" height="6" />
          <rect x="14" y="12" width="7" height="9" />
        </svg>
        <span className={styles.tip}>系统首页</span>
      </button>

      <button
        type="button"
        className={`${styles.dockButton} ${activeTab === 'base' ? styles.dockButtonActive : ''}`}
        data-act="data"
        aria-label="基础数据"
        onClick={() => setActiveTab('base')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
        </svg>
        <span className={styles.tip}>基础数据</span>
      </button>

      <button
        type="button"
        className={`${styles.dockButton} ${viewMode === 'free' ? styles.dockButtonActive : ''}`}
        data-act="view"
        aria-label="视角模式"
        onClick={toggleView}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M15.5 8.5l-2.2 5-5 2.2 2.2-5z" />
        </svg>
        <span className={styles.tip}>视角模式</span>
      </button>

      <button
        type="button"
        className={`${styles.dockButton} ${openCard === 'settings' ? styles.dockButtonActive : ''}`}
        data-act="settings"
        aria-label="设置"
        onClick={() => toggleCard('settings')}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" />
        </svg>
        <span className={styles.tip}>设置</span>
      </button>

      <span className={styles.dockSep} />

      <button
        type="button"
        className={`${styles.dockButton} ${viewMode === 'third' ? styles.dockButtonActive : ''}`}
        data-act="walk"
        aria-label="第三人称漫游"
        onClick={toggleWalk}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="5.5" r="2.3" />
          <path d="M12 8.2v5.4M12 13.6l-2.4 6M12 13.6l2.4 6M7.6 10.6l4.4 1.2 4.4-1.2" />
        </svg>
        <span className={styles.tip}>第三人称漫游</span>
      </button>

      <button
        type="button"
        className={`${styles.dockButton} ${openCard === 'camera' ? styles.dockButtonActive : ''}`}
        data-act="cctv"
        aria-label="视频监控"
        onClick={() => {
          setActiveTab('video')
          toggleCard('camera')
        }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M2.5 12s3.4-5.2 9.5-5.2S21.5 12 21.5 12s-3.4 5.2-9.5 5.2S2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
        <span className={styles.tip}>视频监控</span>
      </button>

      <button
        type="button"
        className={styles.dockButton}
        data-act="floors"
        aria-label="楼层拆解"
        onClick={() => showToast('楼层拆解将在 3D 交互阶段接入')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 3l9 5-9 5-9-5 9-5z" />
          <path d="M3 12l9 5 9-5M3 16l9 5 9-5" />
        </svg>
        <span className={styles.tip}>楼层拆解</span>
      </button>

      <button
        type="button"
        className={styles.dockButton}
        data-act="weather"
        aria-label="天气与时间"
        onClick={() => toggleCard('weather')}
      >
        <svg viewBox="0 0 24 24">
          <circle cx="8" cy="9" r="3.2" />
          <path d="M8 3.3V2M8 16v-1.3M2.3 9H1M15 9h-1.3M4 5l-.9-.9M12.9 13.9l-.9-.9M4 13l-.9.9M12.9 4.1l-.9.9" />
          <path d="M13 19.5h7a2.5 2.5 0 000-5 4 4 0 00-7.6-1.2A3.2 3.2 0 0013 19.5z" />
        </svg>
        <span className={styles.tip}>天气与时间</span>
      </button>

      <span className={styles.dockSep} />

      <button
        type="button"
        className={`${styles.dockButton} ${styles.dockButtonReset}`}
        data-act="reset"
        aria-label="复位视角"
        onClick={resetCamera}
      >
        <svg viewBox="0 0 24 24">
          <path d="M3 11.5L12 4l9 7.5" />
          <path d="M5.5 10v9h13v-9" />
        </svg>
        <span className={styles.tip}>复位视角</span>
      </button>
    </aside>
  )
}
