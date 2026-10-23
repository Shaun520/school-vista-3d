import { CampusScene } from './scene/CampusScene'
import { Stage } from './stage/Stage'
import { FloatCards } from './ui/FloatCards'
import { HeaderNav } from './ui/HeaderNav'
import { HintCard } from './ui/HintCard'
import { LeftDock } from './ui/LeftDock'
import { LoadingOverlay } from './ui/LoadingOverlay'
import { PoiCard } from './ui/PoiCard'
import { RightPanelHost } from './ui/RightPanelHost'
import { Toast } from './ui/Toast'
import hud from './ui/Hud.module.css'
import styles from './App.module.css'

export default function App() {
  return (
    <Stage>
      <div className={styles.canvas}>
        <CampusScene />
      </div>
      <div className={hud.hud}>
        <div className={hud.vignette} />
        <div className={hud.scanlines} />
        <div className={hud.edgeGlow} />
        <HeaderNav />
        <LeftDock />
        <RightPanelHost />
        <FloatCards />
        <HintCard />
        <PoiCard />
        <Toast />
        <span id="perf-readout" className={hud.perfProbe} aria-hidden="true" />
      </div>
      <LoadingOverlay />
    </Stage>
  )
}
