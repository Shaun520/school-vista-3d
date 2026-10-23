import { create } from 'zustand'
import type { CameraPresetId, ClassroomCameraId } from '../types/layout'

export type Tab = 'home' | 'base' | 'student' | 'video' | 'source' | 'ai'
export type Weather = 'sunny' | 'rain' | 'snow'
export type CardId = 'weather' | 'camera' | 'settings' | 'places'
export type ViewMode = 'orbit' | 'free' | 'third'
export type SceneMode = 'campus' | 'classroom'

interface CampusState {
  mode: SceneMode
  enterClassroom: () => void
  exitClassroom: () => void
  classroomCamera: ClassroomCameraId
  setClassroomCamera: (camera: ClassroomCameraId) => void
  classroomTime: number
  setClassroomTime: (hour: number) => void
  classroomReady: boolean
  setClassroomReady: (ready: boolean) => void
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  selectedPoi: string | null
  setSelectedPoi: (id: string | null) => void
  cameraPreset: CameraPresetId
  setCameraPreset: (preset: CameraPresetId) => void
  cameraMoveId: number
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
  mode: 'campus',
  enterClassroom: () =>
    set((state) => ({
      mode: 'classroom',
      activeTab: 'home',
      classroomCamera: 'podium',
      classroomReady: false,
      selectedPoi: null,
      openCard: null,
      cameraMoveId: state.cameraMoveId + 1,
    })),
  exitClassroom: () =>
    set((state) => ({
      mode: 'campus',
      activeTab: 'home',
      cameraPreset: 'home',
      viewMode: 'orbit',
      classroomReady: false,
      selectedPoi: null,
      openCard: null,
      cameraMoveId: state.cameraMoveId + 1,
    })),
  classroomCamera: 'podium',
  setClassroomCamera: (classroomCamera) =>
    set((state) => ({
      classroomCamera,
      cameraMoveId: state.cameraMoveId + 1,
    })),
  classroomTime: 10,
  setClassroomTime: (classroomTime) => set({ classroomTime }),
  classroomReady: false,
  setClassroomReady: (classroomReady) => set({ classroomReady }),
  activeTab: 'home',
  setActiveTab: (activeTab) =>
    set((state) => {
      if (state.mode !== 'classroom') {
        return { activeTab, selectedPoi: null }
      }
      return {
        activeTab,
        mode: 'campus' as const,
        cameraPreset: 'home' as const,
        viewMode: 'orbit' as const,
        classroomReady: false,
        selectedPoi: null,
        openCard: null,
        cameraMoveId: state.cameraMoveId + 1,
      }
    }),
  selectedPoi: null,
  setSelectedPoi: (selectedPoi) => set({ selectedPoi }),
  cameraPreset: 'home',
  cameraMoveId: 0,
  setCameraPreset: (cameraPreset) =>
    set((state) => ({ cameraPreset, cameraMoveId: state.cameraMoveId + 1 })),
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
