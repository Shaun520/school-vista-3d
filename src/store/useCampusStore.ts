import { create } from 'zustand'
import type { CameraPresetId } from '../types/layout'

export type Tab = 'home' | 'base' | 'student' | 'video' | 'source' | 'ai'
export type Weather = 'sunny' | 'rain' | 'snow'
export type CardId = 'weather' | 'camera' | 'settings'
export type ViewMode = 'orbit' | 'free' | 'third'

interface CampusState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  selectedPoi: string | null
  setSelectedPoi: (id: string | null) => void
  cameraPreset: CameraPresetId
  setCameraPreset: (preset: CameraPresetId) => void
  weather: Weather
  setWeather: (weather: Weather) => void
  timeOfDay: number
  setTimeOfDay: (hour: number) => void
  cameraIndex: number
  setCameraIndex: (index: number) => void
  openCard: CardId | null
  toggleCard: (card: CardId) => void
  closeCard: () => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  hintTitle: string
  hintLines: string[]
  setHint: (title: string, lines: string[]) => void
  settings: {
    shadows: boolean
    grid: boolean
    quality: boolean
    sensitivity: number
  }
  toggleSetting: (key: 'shadows' | 'grid' | 'quality') => void
  setSensitivity: (value: number) => void
  toastMessage: string
  toastVisible: boolean
  showToast: (message: string) => void
}

let toastTimer: number | undefined

export const useCampusStore = create<CampusState>((set) => ({
  activeTab: 'home',
  setActiveTab: (activeTab) => set({ activeTab, selectedPoi: null }),
  selectedPoi: null,
  setSelectedPoi: (selectedPoi) => set({ selectedPoi }),
  cameraPreset: 'home',
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  weather: 'sunny',
  setWeather: (weather) => set({ weather }),
  timeOfDay: 20,
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  cameraIndex: 1,
  setCameraIndex: (cameraIndex) => set({ cameraIndex }),
  openCard: null,
  toggleCard: (card) =>
    set((state) => ({ openCard: state.openCard === card ? null : card })),
  closeCard: () => set({ openCard: null }),
  viewMode: 'orbit',
  setViewMode: (viewMode) => set({ viewMode }),
  hintTitle: '视角移动模式',
  hintLines: ['按住鼠标右键，左右滑动旋转视角', 'WASD 前后左右移动，QE 上下升降'],
  setHint: (hintTitle, hintLines) => set({ hintTitle, hintLines }),
  settings: {
    shadows: true,
    grid: false,
    quality: true,
    sensitivity: 1,
  },
  toggleSetting: (key) =>
    set((state) => ({
      settings: { ...state.settings, [key]: !state.settings[key] },
    })),
  setSensitivity: (sensitivity) =>
    set((state) => ({ settings: { ...state.settings, sensitivity } })),
  toastMessage: '',
  toastVisible: false,
  showToast: (toastMessage) => {
    if (toastTimer) window.clearTimeout(toastTimer)
    set({ toastMessage, toastVisible: true })
    toastTimer = window.setTimeout(() => set({ toastVisible: false }), 2200)
  },
}))
