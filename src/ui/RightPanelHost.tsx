import { useCampusStore } from '../store/useCampusStore'
import styles from './Hud.module.css'
import { AiPanel } from './panels/AiPanel'
import { SecurityPanel } from './panels/SecurityPanel'
import { SourcePanel } from './panels/SourcePanel'
import { StudentPanel } from './panels/StudentPanel'
import { VideoPanel } from './panels/VideoPanel'

export function RightPanelHost() {
  const activeTab = useCampusStore((state) => state.activeTab)

  return (
    <aside className={styles.rightPanel} aria-label="数据面板">
      {activeTab === 'home' || activeTab === 'base' ? <SecurityPanel /> : null}
      {activeTab === 'student' ? <StudentPanel /> : null}
      {activeTab === 'video' ? <VideoPanel /> : null}
      {activeTab === 'source' ? <SourcePanel /> : null}
      {activeTab === 'ai' ? <AiPanel /> : null}
    </aside>
  )
}
