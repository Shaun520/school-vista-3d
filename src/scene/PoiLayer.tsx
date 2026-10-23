import { Html } from '@react-three/drei'
import { layout } from '../data/layout'
import { useCampusStore } from '../store/useCampusStore'
import styles from '../ui/Hud.module.css'

export function PoiLayer() {
  const setSelectedPoi = useCampusStore((state) => state.setSelectedPoi)

  return (
    <>
      {layout.pois
        .filter((poi) => poi.scope === 'exterior')
        .map((poi) => (
          <Html key={poi.id} position={poi.position} center zIndexRange={[27, 0]}>
            <button
              type="button"
              className={styles.poiLabel}
              data-poi={poi.id}
              onClick={() => setSelectedPoi(poi.id)}
            >
              {poi.name}
            </button>
          </Html>
        ))}
    </>
  )
}
