import sourceMap from '../source-map.svg?raw'
import '../source-map.css'
import styles from '../Hud.module.css'

const PROVINCES = [
  { name: '河北', percent: '26%', width: '92%' },
  { name: '山东', percent: '18%', width: '64%' },
  { name: '河南', percent: '14%', width: '50%' },
  { name: '山西', percent: '10%', width: '36%' },
  { name: '辽宁', percent: '8%', width: '29%' },
]

export function SourcePanel() {
  return (
    <section className={`${styles.panel} ${styles.panelActive}`}>
      <div className={styles.panelHead}>
        <span className={styles.tri} />
        <h2 className={styles.panelTitle}>学生来源分布</h2>
        <span className={styles.panelCode}>SOURCE / MAP</span>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.mapWrap} dangerouslySetInnerHTML={{ __html: sourceMap }} />

        <h3 className={styles.secTitle} style={{ marginTop: -4 }}>
          <i />
          生源省份 TOP 5
          <span className={styles.secEn}>PROVINCE</span>
        </h3>
        <div className={styles.sourceList}>
          {PROVINCES.map((province) => (
            <div key={province.name} className={styles.sourceRow}>
              <span>{province.name}</span>
              <div className={styles.sourceBar}>
                <i style={{ width: province.width }} />
              </div>
              <b>{province.percent}</b>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.panelFoot}>
        <span>生源地数据 · 演示</span>
        <span>24 PROVINCES</span>
      </div>
    </section>
  )
}
