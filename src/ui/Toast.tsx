import { useCampusStore } from '../store/useCampusStore'
import styles from './Hud.module.css'

export function Toast() {
  const visible = useCampusStore((state) => state.toastVisible)
  const message = useCampusStore((state) => state.toastMessage)

  return (
    <div className={`${styles.toast} ${visible ? styles.toastShow : ''}`} role="status">
      {message}
    </div>
  )
}
