// 教室右侧控制台：设备状态、四路室内监控与时间/灯光联动。
import { classroomTimePresets, formatClassroomTime } from '../data/classroom'
import { getClassroomLightState } from '../scene/classroomLighting'
import { useCampusStore } from '../store/useCampusStore'
import { ClassroomMonitor } from './ClassroomMonitor'
import styles from './Classroom.module.css'

type DeviceIconKind = 'projector' | 'light' | 'ac' | 'fan' | 'door' | 'curtain'

function DeviceIcon({ kind }: { kind: DeviceIconKind }) {
  if (kind === 'projector') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="6" width="13" height="8" rx="1" />
        <path d="M16 9.5h3.5M19.5 9.5l2 2M19.5 9.5l2-2M7 14v3M6 20h12" />
      </svg>
    )
  }
  if (kind === 'light') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="4" rx="1" />
        <path d="M8 9v3M12 9v4M16 9v3M7 20h10" />
      </svg>
    )
  }
  if (kind === 'ac') {
    return (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="5" width="18" height="8" rx="1.5" />
        <path d="M6 9h12M7 16c1.5 2 3 2 4.5 0s3-2 4.5 0" />
      </svg>
    )
  }
  if (kind === 'fan') {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="2" />
        <path d="M12 10c-1-4 2-6 4-4 2 2 0 5-4 4zM14 12c4-1 6 2 4 4-2 2-5 0-4-4zM12 14c1 4-2 6-4 4-2-2 0-5 4-4zM10 12c-4 1-6-2-4-4 2-2 5 0 4 4z" />
      </svg>
    )
  }
  if (kind === 'door') {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M5 21V4h14v17M3 21h18" />
        <path d="M9 12h.01M15 12h.01" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 4h18M5 4v16M10 4v16M14 4v16M19 4v16" />
      <path d="M5 8h5M14 8h5" />
    </svg>
  )
}

const DEVICES: Array<{
  id: string
  name: string
  icon: DeviceIconKind
  status: string
  tone?: 'off' | 'warn'
}> = [
  { id: 'projector', name: '投影仪', icon: 'projector', status: '运行中' },
  { id: 'light', name: '照明', icon: 'light', status: '' },
  { id: 'ac', name: '空调', icon: 'ac', status: '26℃ 制冷' },
  { id: 'fan', name: '吊扇', icon: 'fan', status: '已关闭', tone: 'off' },
  { id: 'door', name: '门窗', icon: 'door', status: '已锁闭', tone: 'off' },
  { id: 'curtain', name: '窗帘', icon: 'curtain', status: '半开', tone: 'warn' },
]

export function ClassroomConsole() {
  const hour = useCampusStore((state) => state.classroomTime)
  const setClassroomTime = useCampusStore((state) => state.setClassroomTime)
  const showToast = useCampusStore((state) => state.showToast)
  const light = getClassroomLightState(hour)
  const timeText = formatClassroomTime(hour)

  return (
    <aside className={styles.rightPanel} aria-label="教室控制台">
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.tri} />
          <h2 className={styles.panelTitle}>教室控制台</h2>
          <span className={styles.panelCode}>CLASSROOM / LIVE</span>
        </div>

        <div className={styles.panelBody}>
          <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
            <i />
            设备状态
            <span className={styles.sectionEn}>DEVICES</span>
          </h3>
          <div className={styles.deviceGrid}>
            {DEVICES.map((device) => {
              const status = device.id === 'light'
                ? `${light.lampCount}/4 · ${light.lampCount === 0 ? '自然光' : '开启'}`
                : device.status
              return (
                <div
                  key={device.id}
                  className={`${styles.deviceCard} ${device.tone === 'off' ? styles.deviceOff : ''} ${device.tone === 'warn' ? styles.deviceWarn : ''}`}
                  data-classroom-device={device.id}
                >
                  <span className={styles.deviceIcon}>
                    <DeviceIcon kind={device.icon} />
                  </span>
                  <span className={styles.deviceMeta}>
                    <span className={styles.deviceName}>{device.name}</span>
                    <span className={styles.deviceStatus}>{status}</span>
                  </span>
                </div>
              )
            })}
          </div>

          <h3 className={styles.sectionTitle}>
            <i />
            室内监控
            <span className={styles.sectionEn}>INDOOR CCTV</span>
          </h3>
          <ClassroomMonitor />

          <h3 className={styles.sectionTitle}>
            <i />
            时间与灯光
            <span className={styles.sectionEn}>LIGHT</span>
          </h3>
          <div className={styles.timeBlock}>
            <div className={styles.timeHead}>
              <span className={styles.timeValue}>{timeText}</span>
              <span className={styles.timeMode}>{light.modeLabel}</span>
            </div>
            <div className={styles.lightLine}>
              <span data-classroom-light>{light.lampLabel}</span>
              <b>自动联动</b>
            </div>
            <input
              className={styles.timeSlider}
              data-classroom-time-slider
              type="range"
              min="0"
              max="24"
              step="0.1"
              value={hour}
              aria-label="教室时间"
              onChange={(event) => setClassroomTime(Number(event.target.value))}
            />
            <div className={styles.timeTicks}>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>24</span>
            </div>
            <div className={styles.presetRow} role="group" aria-label="时间预设">
              {classroomTimePresets.map((preset) => {
                const active = Math.abs(hour - preset.hour) < 0.2
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`${styles.preset} ${active ? styles.presetActive : ''}`}
                    data-classroom-time={preset.id}
                    aria-pressed={active}
                    onClick={() => {
                      setClassroomTime(preset.hour)
                      showToast(`已切换至${preset.label} · 灯光已联动`)
                    }}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <div className={styles.timeNote}>时间模拟仅联动教室灯光与窗景，不改动课程数据</div>
          </div>
        </div>

        <div className={styles.panelFoot}>
          <span>CAM 4/4 · LIGHT AUTO</span>
          <span className={styles.online}>● SYNC</span>
        </div>
      </section>
    </aside>
  )
}
