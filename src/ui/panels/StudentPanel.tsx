import { DonutChart } from '../charts/DonutChart'
import styles from '../Hud.module.css'

const GRADES = [
  { label: '高一', value: 168, width: '68%' },
  { label: '高二', value: 166, width: '66%' },
  { label: '高三', value: 166, width: '66%' },
]

const CLASSES = [
  { name: '高一（1）班', total: 42, present: 39, status: '正常' },
  { name: '高二（3）班', total: 44, present: 40, status: '正常' },
  { name: '高三（2）班', total: 41, present: 36, status: '关注' },
]

export function StudentPanel() {
  return (
    <section className={`${styles.panel} ${styles.panelActive}`}>
      <div className={styles.panelHead}>
        <span className={styles.tri} />
        <h2 className={styles.panelTitle}>学生信息</h2>
        <span className={styles.panelCode}>STUDENT / B</span>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.stuStats}>
          <div className={styles.kv}>
            <span>在校学生</span>
            <strong>500</strong>
          </div>
          <div className={styles.kv}>
            <span>今日出勤</span>
            <strong>450</strong>
          </div>
          <div className={styles.kv}>
            <span>请假人数</span>
            <strong>50</strong>
          </div>
        </div>

        <h3 className={styles.secTitle}>
          <i />
          年级分布
          <span className={styles.secEn}>GRADE</span>
        </h3>
        <div className={styles.barCard}>
          {GRADES.map((grade) => (
            <div key={grade.label} className={styles.barRow}>
              <span>{grade.label}</span>
              <div className={styles.bar}>
                <i style={{ width: grade.width }} />
              </div>
              <b>{grade.value}</b>
            </div>
          ))}
        </div>

        <h3 className={styles.secTitle}>
          <i />
          性别比例
          <span className={styles.secEn}>GENDER</span>
        </h3>
        <div className={styles.donutRow}>
          <div className={styles.donutBox}>
            <DonutChart
              data={[
                { value: 260, color: '#38e8c6' },
                { value: 240, color: '#2f9c8a' },
              ]}
              centerTop="52%"
              centerSub="男生占比"
            />
          </div>
          <div className={styles.donutLegend}>
            <div>
              <i style={{ background: '#38e8c6' }} />
              男生<b>260</b>
            </div>
            <div>
              <i style={{ background: '#2f9c8a' }} />
              女生<b>240</b>
            </div>
          </div>
        </div>

        <h3 className={styles.secTitle}>
          <i />
          班级概览
          <span className={styles.secEn}>CLASS</span>
        </h3>
        <table className={styles.miniTable}>
          <thead>
            <tr>
              <th>班级</th>
              <th>人数</th>
              <th>出勤</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.total}</td>
                <td>{item.present}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.panelFoot}>
        <span>DATA SYNC · 2026-08-07</span>
        <span>ONLINE</span>
      </div>
    </section>
  )
}
