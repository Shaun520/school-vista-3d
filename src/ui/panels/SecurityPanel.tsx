import { DonutChart } from '../charts/DonutChart'
import { LineChart } from '../charts/LineChart'
import styles from '../Hud.module.css'

export function SecurityPanel() {
  return (
    <section className={`${styles.panel} ${styles.panelActive}`}>
      <div className={styles.panelHead}>
        <span className={styles.tri} />
        <h2 className={styles.panelTitle}>学校安保巡查</h2>
        <span className={styles.panelCode}>SECURITY / A</span>
      </div>

      <div className={styles.panelBody}>
        <div className={styles.guardRow}>
          <div className={styles.guardCard}>
            <div className={styles.guardIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M12 2.5l7 2.6v6.1c0 4.6-2.9 8-7 10.3-4.1-2.3-7-5.7-7-10.3V5.1l7-2.6z" />
                <path d="M9 12l2.2 2.2L15.5 10" />
              </svg>
            </div>
            <div>
              <span>本月巡查</span>
              <strong>534</strong>
            </div>
          </div>
          <div className={styles.guardCard}>
            <div className={styles.guardIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M12 2.5l7 2.6v6.1c0 4.6-2.9 8-7 10.3-4.1-2.3-7-5.7-7-10.3V5.1l7-2.6z" />
                <path d="M9 12l2.2 2.2L15.5 10" />
              </svg>
            </div>
            <div>
              <span>今日巡查</span>
              <strong>46</strong>
            </div>
          </div>
        </div>

        <h3 className={styles.secTitle}>
          <i />
          学生在校情况
          <span className={styles.secEn}>STUDENT ATTENDANCE</span>
        </h3>
        <div className={styles.kvRow}>
          <div className={styles.kv}>
            <span>应到校</span>
            <strong>500</strong>
          </div>
          <div className={styles.kv}>
            <span>实际到校</span>
            <strong>450</strong>
          </div>
          <div className={styles.kv}>
            <span>缺勤人数</span>
            <strong>50</strong>
          </div>
        </div>

        <div className={styles.chartWrap}>
          <LineChart />
        </div>
        <div className={styles.chartLegend}>
          <span>
            <i style={{ background: '#7ff0d8' }} />
            应到校
          </span>
          <span>
            <i style={{ background: '#35e0c0' }} />
            实际到校
          </span>
          <span>
            <i style={{ background: '#ffd36a' }} />
            缺勤人数
          </span>
        </div>

        <h3 className={`${styles.secTitle} ${styles.secTitleTop}`}>
          <i />
          学校教师总览
          <span className={styles.secEn}>TEACHERS</span>
        </h3>
        <div className={styles.donutRow}>
          <div className={styles.donutBox}>
            <DonutChart
              data={[
                { value: 31, color: '#38e8c6' },
                { value: 27, color: '#2f9c8a' },
                { value: 25, color: '#22616c' },
              ]}
              centerTop="83"
              centerSub="教职工总数"
            />
          </div>
          <div className={styles.donutLegend}>
            <div>
              <i style={{ background: '#38e8c6' }} />
              专任教师<b>31</b>
            </div>
            <div>
              <i style={{ background: '#2f9c8a' }} />
              行政人员<b>27</b>
            </div>
            <div>
              <i style={{ background: '#22616c' }} />
              后勤职工<b>25</b>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.panelFoot}>
        <span>DATA SYNC · 2026-08-07</span>
        <span>ONLINE</span>
      </div>
    </section>
  )
}
