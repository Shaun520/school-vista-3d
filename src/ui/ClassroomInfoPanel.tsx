// 教室左侧面板：班级、课程、到课情况与室内机位跳转。
import { classroomCameras, classroomInfo } from '../data/classroom'
import { useCampusStore } from '../store/useCampusStore'
import styles from './Classroom.module.css'

export function ClassroomInfoPanel() {
  const classroomCamera = useCampusStore((state) => state.classroomCamera)
  const setClassroomCamera = useCampusStore((state) => state.setClassroomCamera)
  const showToast = useCampusStore((state) => state.showToast)

  return (
    <aside className={styles.leftPanel} aria-label="教室数据">
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.tri} />
          <h2 className={styles.panelTitle}>教室概览</h2>
          <span className={styles.panelCode}>ROOM 302 / 3F</span>
        </div>

        <div className={styles.panelBody}>
          <div className={styles.classBlock}>
            <div className={styles.classRow}>
              <span className={styles.className}>{classroomInfo.className}</span>
              <span className={styles.badge}>上课中</span>
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span>班主任</span>
                <strong>{classroomInfo.headTeacher}</strong>
              </div>
              <div className={styles.metric}>
                <span>学生</span>
                <strong>{classroomInfo.studentCount} 人</strong>
              </div>
              <div className={styles.metric}>
                <span>教室</span>
                <strong>{classroomInfo.room}</strong>
              </div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>
            <i />
            课程参数
            <span className={styles.sectionEn}>COURSE</span>
          </h3>
          <div className={styles.courseCard}>
            <div className={styles.courseRow}>
              <span className={styles.courseName}>{classroomInfo.course.name}</span>
              <span className={styles.courseTeacher}>{classroomInfo.course.teacher}</span>
            </div>
            <div className={styles.courseMeta}>
              {classroomInfo.course.period} · 进行中
            </div>
            <div className={styles.progress}>
              <div className={styles.progressLabel}>
                <span>{classroomInfo.course.progressLabel}</span>
                <b>{classroomInfo.course.progress}%</b>
              </div>
              <div className={styles.progressBar}>
                <i style={{ width: `${classroomInfo.course.progress}%` }} />
              </div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>
            <i />
            到课情况
            <span className={styles.sectionEn}>ATTENDANCE</span>
          </h3>
          <div className={styles.attendanceCard}>
            <div className={styles.attendRow}>
              <span className={styles.attendRate}>
                {classroomInfo.attendance.rate}
                <small>%</small>
              </span>
              <span className={styles.attendSub}>
                实到 {classroomInfo.attendance.present} / 应到 {classroomInfo.attendance.expected}
              </span>
            </div>
            <div className={styles.attendStats}>
              <div>
                <span>实到</span>
                <b>{classroomInfo.attendance.present}</b>
              </div>
              <div>
                <span>请假</span>
                <b>{classroomInfo.attendance.leave}</b>
              </div>
              <div>
                <span>缺勤</span>
                <b>{classroomInfo.attendance.absent}</b>
              </div>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>
            <i />
            教室机位
            <span className={styles.sectionEn}>CAMERA</span>
          </h3>
          <div className={styles.cameraGrid}>
            {classroomCameras.map((camera) => (
              <button
                key={camera.id}
                type="button"
                className={`${styles.cameraButton} ${classroomCamera === camera.id ? styles.cameraButtonActive : ''}`}
                data-classroom-camera={camera.id}
                aria-pressed={classroomCamera === camera.id}
                onClick={() => {
                  setClassroomCamera(camera.id)
                  showToast(`已切换机位：${camera.label}`)
                }}
              >
                {camera.label}
                <span>{camera.channel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.panelFoot}>
          <span>DATA SYNC · LIVE</span>
          <span className={styles.online}>● ONLINE</span>
        </div>
      </section>
    </aside>
  )
}
