import { layout } from '../data/layout'
import { useCampusStore, type Weather } from '../store/useCampusStore'
import type { CameraPresetId } from '../types/layout'
import styles from './Hud.module.css'

const CAMERA_PRESETS: CameraPresetId[] = ['gate', 'teaching', 'playground', 'plaza']

const EXTERIOR_PLACES = layout.pois.filter((poi) => poi.scope === 'exterior' && poi.camera)

const INTERIOR_PLACES = [
  { id: 'classroom', name: '教室内' },
  { id: 'canteen-interior', name: '食堂内' },
  { id: 'history-interior', name: '校史馆内' },
  { id: 'library-interior', name: '图书馆内' },
  { id: 'gym-interior', name: '体育馆内' },
]

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function FloatCards() {
  const openCard = useCampusStore((state) => state.openCard)
  const closeCard = useCampusStore((state) => state.closeCard)
  const weather = useCampusStore((state) => state.weather)
  const setWeather = useCampusStore((state) => state.setWeather)
  const timeOfDay = useCampusStore((state) => state.timeOfDay)
  const setTimeOfDay = useCampusStore((state) => state.setTimeOfDay)
  const cameraIndex = useCampusStore((state) => state.cameraIndex)
  const setCameraIndex = useCampusStore((state) => state.setCameraIndex)
  const setCameraPreset = useCampusStore((state) => state.setCameraPreset)
  const settings = useCampusStore((state) => state.settings)
  const toggleSetting = useCampusStore((state) => state.toggleSetting)
  const setSensitivity = useCampusStore((state) => state.setSensitivity)
  const showToast = useCampusStore((state) => state.showToast)

  const timeValue = `${pad(Math.floor(timeOfDay))}:${pad(Math.round((timeOfDay % 1) * 60))}`

  const changeWeather = (next: Weather) => {
    setWeather(next)
    if (next === 'snow') {
      showToast('已切换为雪天，可拖动时间滑杆查看夜景')
      if (timeOfDay > 8 && timeOfDay < 18) setTimeOfDay(20.5)
    } else if (next === 'rain') {
      showToast('已切换为雨天')
      if (timeOfDay > 8 && timeOfDay < 18) setTimeOfDay(19.2)
    } else {
      showToast('已切换为晴天')
    }
  }

  return (
    <>
      <div
        className={`${styles.floatCard} ${styles.weatherCard} ${openCard === 'weather' ? styles.floatCardShow : ''}`}
        data-float-card="weather"
      >
        <div className={styles.fcHead}>
          <span className={styles.tri} />
          天气模拟面板
          <button
            type="button"
            className={styles.fcClose}
            aria-label="关闭天气面板"
            onClick={closeCard}
          >
            ×
          </button>
        </div>
        <div className={styles.wxTitle}>天气模拟</div>
        <div className={styles.wxIcons}>
          <button
            type="button"
            className={`${styles.wxButton} ${weather === 'sunny' ? styles.wxButtonActive : ''}`}
            data-weather="sunny"
            data-active={weather === 'sunny'}
            title="晴天"
            onClick={() => changeWeather('sunny')}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3.6" />
              <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
            </svg>
            <span>晴天</span>
          </button>
          <button
            type="button"
            className={`${styles.wxButton} ${weather === 'rain' ? styles.wxButtonActive : ''}`}
            data-weather="rain"
            data-active={weather === 'rain'}
            title="雨天"
            onClick={() => changeWeather('rain')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6.5 15.5A4.5 4.5 0 016 6.7a5.4 5.4 0 0110.2 1.1 4 4 0 01.3 7.7" />
              <path d="M8.5 18.5l-1 2M12.5 18.5l-1 2M16.5 18.5l-1 2" />
            </svg>
            <span>雨天</span>
          </button>
          <button
            type="button"
            className={`${styles.wxButton} ${weather === 'snow' ? styles.wxButtonActive : ''}`}
            data-weather="snow"
            data-active={weather === 'snow'}
            title="雪天"
            onClick={() => changeWeather('snow')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M6.5 15.5A4.5 4.5 0 016 6.7a5.4 5.4 0 0110.2 1.1 4 4 0 01.3 7.7" />
              <path d="M8.4 18v3M7 19.4l2.8 1.2M9.8 19.4L7 20.6M15.6 18v3M14.2 19.4l2.8 1.2M17 19.4l-2.8 1.2" />
            </svg>
            <span>雪天</span>
          </button>
        </div>
        <div className={styles.wxTitle}>时间模拟</div>
        <div className={styles.timeRow}>
          <svg className={styles.sunIcon} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6" />
          </svg>
          <input
            className={styles.timeSlider}
            data-time-slider
            type="range"
            min="0"
            max="24"
            step="0.1"
            value={timeOfDay}
            onChange={(event) => setTimeOfDay(Number(event.target.value))}
          />
          <span className={styles.timeValue} data-time-value>
            {timeValue}
          </span>
        </div>
      </div>

      <div
        className={`${styles.floatCard} ${styles.cameraCard} ${openCard === 'camera' ? styles.floatCardShow : ''}`}
        data-float-card="camera"
      >
        <div className={styles.fcHead}>
          <span className={styles.tri} />
          视频监控选择
          <button
            type="button"
            className={styles.fcClose}
            aria-label="关闭监控选择"
            onClick={closeCard}
          >
            ×
          </button>
        </div>
        <div className={styles.camGrid}>
          {[1, 2, 3, 4].map((index) => (
            <button
              key={index}
              type="button"
              className={`${styles.camButton} ${cameraIndex === index ? styles.camButtonActive : ''}`}
              data-cam={index}
              data-active={cameraIndex === index}
              onClick={() => {
                setCameraIndex(index)
                setCameraPreset(CAMERA_PRESETS[index - 1])
              }}
            >
              监控{index}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${styles.floatCard} ${styles.placesCard} ${openCard === 'places' ? styles.floatCardShow : ''}`}
        data-float-card="places"
      >
        <div className={styles.fcHead}>
          <span className={styles.tri} />
          地点建筑
          <button
            type="button"
            className={styles.fcClose}
            aria-label="关闭地点建筑"
            onClick={closeCard}
          >
            ×
          </button>
        </div>
        <div className={styles.placeGroup}>室外</div>
        <div className={styles.placeGrid}>
          {EXTERIOR_PLACES.map((poi) => (
            <button
              key={poi.id}
              type="button"
              className={styles.placeButton}
              data-place={poi.id}
              onClick={() => {
                if (!poi.camera) return
                setCameraPreset(poi.camera)
                showToast(`已定位：${poi.name}`)
              }}
            >
              {poi.name}
            </button>
          ))}
        </div>
        <div className={styles.placeGroup}>室内</div>
        <div className={`${styles.placeGrid} ${styles.placeGridInterior}`}>
          {INTERIOR_PLACES.map((place) => (
            <button
              key={place.id}
              type="button"
              className={`${styles.placeButton} ${styles.placeButtonPending}`}
              data-place={place.id}
              data-pending="true"
              onClick={() => showToast('室内场景模型待接入，暂未开放跳转')}
            >
              {place.name}
              <span className={styles.placePending}>待实现</span>
            </button>
          ))}
        </div>
      </div>

      <div
        className={`${styles.floatCard} ${styles.settingsCard} ${openCard === 'settings' ? styles.floatCardShow : ''}`}
        data-float-card="settings"
      >
        <div className={styles.fcHead}>
          <span className={styles.tri} />
          设置
          <button
            type="button"
            className={styles.fcClose}
            aria-label="关闭设置"
            onClick={closeCard}
          >
            ×
          </button>
        </div>
        <div className={styles.setRow}>
          <span>实时阴影</span>
          <div
            className={`${styles.switch} ${settings.shadows ? styles.switchOn : ''}`}
            data-setting="shadows"
            onClick={() => toggleSetting('shadows')}
            role="switch"
            aria-checked={settings.shadows}
          >
            <i />
          </div>
        </div>
        <div className={styles.setRow}>
          <span>显示网格</span>
          <div
            className={`${styles.switch} ${settings.grid ? styles.switchOn : ''}`}
            data-setting="grid"
            onClick={() => toggleSetting('grid')}
            role="switch"
            aria-checked={settings.grid}
          >
            <i />
          </div>
        </div>
        <div className={styles.setRow}>
          <span>高画质渲染</span>
          <div
            className={`${styles.switch} ${settings.quality ? styles.switchOn : ''}`}
            data-setting="quality"
            onClick={() => toggleSetting('quality')}
            role="switch"
            aria-checked={settings.quality}
          >
            <i />
          </div>
        </div>
        <div className={styles.setRow}>
          <span>视角灵敏度</span>
          <div className={styles.sens}>
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={settings.sensitivity}
              onChange={(event) => setSensitivity(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </>
  )
}
