// 教室模式 HUD：左右面板、返回校园、场景标识和模型加载遮罩。
import { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { classroomInfo, formatClassroomTime } from '../data/classroom'
import { getClassroomLightState } from '../scene/classroomLighting'
import { useCampusStore } from '../store/useCampusStore'
import { ClassroomConsole } from './ClassroomConsole'
import { ClassroomInfoPanel } from './ClassroomInfoPanel'
import styles from './Classroom.module.css'

export function ClassroomHud() {
  const mode = useCampusStore((state) => state.mode)
  const ready = useCampusStore((state) => state.classroomReady)
  const hour = useCampusStore((state) => state.classroomTime)
  const exitClassroom = useCampusStore((state) => state.exitClassroom)
  const { progress } = useProgress()
  const light = getClassroomLightState(hour)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') exitClassroom()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exitClassroom])

  if (mode !== 'classroom') return null

  return (
    <>
      <ClassroomInfoPanel />
      <ClassroomConsole />

      <div className={styles.sceneChrome}>
        <button
          type="button"
          className={styles.sceneBack}
          data-classroom-back
          onClick={exitClassroom}
        >
          ← 返回校园
        </button>
        <span className={styles.sceneBadge}>
          <i />
          {classroomInfo.building} · {classroomInfo.room} · {classroomInfo.roomName}
        </span>
        <span className={styles.sceneTime}>
          <b>{formatClassroomTime(hour)}</b>
          {light.modeLabel}
        </span>
        <span className={styles.sceneHint}>右键旋转 · 滚轮缩放 · 点击设备热点定位 · ESC 返回</span>
      </div>

      <div className={`${styles.roomLoading} ${ready ? styles.roomLoadingHide : ''}`} aria-hidden={ready}>
        <div className={styles.roomLoadingInner}>
          <h2 className={styles.roomLoadingTitle}>正在进入多媒体教室</h2>
          <p className={styles.roomLoadingSub}>LOADING CLASSROOM 3F-302</p>
          <div className={styles.roomLoadingBar}>
            <i style={{ width: `${Math.max(8, Math.round(progress))}%` }} />
          </div>
          <div className={styles.roomLoadingText}>
            {ready ? '场景已就绪' : `按需加载教室模型 · ${Math.round(progress)}%`}
          </div>
        </div>
      </div>
    </>
  )
}
