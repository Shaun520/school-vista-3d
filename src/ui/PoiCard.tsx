import { useEffect } from 'react'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'
import { poiDetails } from './poiDetails'
import styles from './Hud.module.css'

export function PoiCard() {
  const selectedPoi = useCampusStore((state) => state.selectedPoi)
  const setSelectedPoi = useCampusStore((state) => state.setSelectedPoi)
  const poi = layout.pois.find((item) => item.id === selectedPoi)

  useEffect(() => {
    if (!selectedPoi) return
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-poi-card]')) return
      if (target.closest('[data-poi]')) return
      setSelectedPoi(null)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [selectedPoi, setSelectedPoi])

  if (!poi) return null

  const metrics = poiDetails[poi.id] ?? []

  return (
    <aside className={styles.poiCard} data-poi-card aria-label="POI 详情">
      <div className={styles.pcHead}>
        <span className={styles.tri} />
        <b className={styles.pcTitle}>{poi.name}</b>
        <button
          type="button"
          className={styles.pcClose}
          data-poi-close
          aria-label="关闭详情"
          onClick={() => setSelectedPoi(null)}
        >
          ×
        </button>
      </div>
      <div className={styles.pcBody}>
        <div className={styles.pcDesc}>{poi.description}</div>
        {metrics.length > 0 ? (
          <div className={styles.pcMetrics}>
            {metrics.map((metric) => (
              <div key={metric.label}>
                <span>{metric.label}</span>
                <em>{metric.value}</em>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  )
}
