// 多媒体教室面板的演示数据与机位/监控配置；接入教务、考勤和设备接口后替换。
import type { ClassroomCameraId } from '../types/layout'

export interface ClassroomCameraOption {
  id: ClassroomCameraId
  label: string
  channel: string
}

export interface ClassroomTimePreset {
  id: string
  label: string
  hour: number
}

export type ClassroomFeedKind = 'podium' | 'seats' | 'door' | 'corridor'

export interface ClassroomFeed {
  id: string
  label: string
  channel: string
  kind: ClassroomFeedKind
}

export const classroomInfo = {
  building: '第一教学楼',
  room: '3F-302',
  roomName: '多媒体教室',
  className: '高一(1)班',
  headTeacher: '李雅婷',
  studentCount: 48,
  course: {
    name: '数学',
    teacher: '王建国',
    period: '第3节 10:00–10:40',
    progressLabel: '第二章 函数',
    progress: 68,
  },
  attendance: {
    expected: 48,
    present: 46,
    leave: 1,
    absent: 1,
    rate: 95.8,
  },
}

export const classroomCameras: ClassroomCameraOption[] = [
  { id: 'podium', label: '讲台', channel: 'CAM-01' },
  { id: 'seats', label: '座位区', channel: 'CAM-02' },
  { id: 'rear', label: '后排', channel: 'CAM-03' },
  { id: 'door', label: '后门', channel: 'CAM-04' },
]

export const classroomFeeds: ClassroomFeed[] = [
  { id: 'feed-podium', label: '讲台全景', channel: 'CH-01', kind: 'podium' },
  { id: 'feed-seats', label: '学生区', channel: 'CH-02', kind: 'seats' },
  { id: 'feed-door', label: '后门', channel: 'CH-03', kind: 'door' },
  { id: 'feed-corridor', label: '走廊', channel: 'CH-04', kind: 'corridor' },
]

export const classroomTimePresets: ClassroomTimePreset[] = [
  { id: 'morning', label: '上午', hour: 10 },
  { id: 'noon', label: '正午', hour: 12.5 },
  { id: 'dusk', label: '黄昏', hour: 17.5 },
  { id: 'night', label: '夜间', hour: 20.5 },
]

export function formatClassroomTime(hour: number) {
  const normalized = ((hour % 24) + 24) % 24
  const whole = Math.floor(normalized)
  const minutes = Math.round((normalized - whole) * 60) % 60
  return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
