import { useEffect, useRef, useState, type ReactNode } from 'react'
import styles from '../Hud.module.css'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: ReactNode
}

function Typing() {
  return (
    <span className={styles.typing}>
      <i />
      <i />
      <i />
    </span>
  )
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: 'assistant',
    content: (
      <>
        <span className={styles.cap}>AI问答小助手</span>
        您好，我是 DeepSeek，请提出您的问题。
      </>
    ),
  },
  {
    id: 2,
    role: 'assistant',
    content: (
      <>
        <span className={styles.capList}>
          <span>
            <b>免费使用：</b>目前完全免费，没有任何收费计划
          </span>
          <span>
            <b>超大上下文：</b>支持 1M 上下文，可以一次性处理像《三体》三部曲那样的长篇内容
          </span>
          <span>
            <b>文件处理：</b>支持上传图片、PDF、Word、Excel、PPT 等文件，从中读取文字信息
          </span>
          <span>
            <b>联网搜索：</b>支持联网功能（需要手动开启）
          </span>
          <span>
            <b>多平台：</b>可以在网页端使用，也有 App（支持语音输入）
          </span>
        </span>
        <div style={{ marginTop: 8 }}>有什么问题需要我帮忙吗？</div>
      </>
    ),
  },
]

function aiAnswer(question: string) {
  const text = question.toLowerCase()
  if (/天气|气温|下雨|雪/.test(text)) {
    return '当前唐山为晴天，气温 16℃，南风 3 级。你可以在左侧「天气与时间」面板切换到雨天或雪天，并拖动时间滑杆查看昼夜变化。'
  }
  if (/监控|摄像头|画面/.test(text)) {
    return '校园目前接入 4 路监控：学校大门、教学楼、后门和操场。可在「视频监控」面板查看，或点击左侧监控图标快速切换机位。'
  }
  if (/学生|人数|出勤|请假/.test(text)) {
    return '当前应到校 500 人，实际到校 450 人，缺勤 50 人，出勤率 90%。可以在「学生信息」面板查看年级分布与班级概览。'
  }
  if (/楼|教室|拆解/.test(text)) {
    return '教学楼共 4 层，包含阶梯教室、教室走廊、专业教室和媒体教室。点击左侧「楼层拆解」可以查看分层结构。'
  }
  if (/生源|来源|省份|地图/.test(text)) {
    return '生源主要来自河北、山东、河南、山西、辽宁等地，可在「生源信息」面板查看中国地图与省份占比。'
  }
  if (/介绍|校园|平台/.test(text)) {
    return '智慧校园综合管理平台整合了校园 3D 数字孪生、安防巡查、学生信息、视频监控、生源分布与 AI 助手，可在三维场景中自由浏览并查看建筑详情。'
  }
  return '我是接入 DeepSeek 的校园助手（演示模式），可以回答校园数据、监控、天气、楼层拆解和生源分布相关的问题。'
}

export function AiPanel() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const nextId = useRef(3)
  const timers = useRef<number[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 150)
    return () => window.clearTimeout(focusTimer)
  }, [])

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const send = () => {
    const question = input.trim()
    if (!question) return
    setInput('')

    const userMessage: Message = {
      id: nextId.current++,
      role: 'user',
      content: question,
    }
    const typingId = nextId.current++
    const typingMessage: Message = {
      id: typingId,
      role: 'assistant',
      content: <Typing />,
    }
    setMessages((previous) => [...previous, userMessage, typingMessage])

    const timer = window.setTimeout(() => {
      setMessages((previous) =>
        previous.map((message) =>
          message.id === typingId ? { ...message, content: aiAnswer(question) } : message,
        ),
      )
    }, 850)
    timers.current.push(timer)
  }

  return (
    <section className={`${styles.panel} ${styles.panelActive}`}>
      <div className={styles.panelHead}>
        <span className={styles.tri} />
        <h2 className={styles.panelTitle}>AI问答小助手</h2>
        <span className={styles.panelCode}>DEEPSEEK</span>
      </div>

      <div className={`${styles.panelBody} ${styles.panelBodyAi}`} ref={bodyRef}>
        <div className={styles.aiChat}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.msg} ${message.role === 'assistant' ? styles.msgAssistant : styles.msgUser}`}
            >
              {message.content}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.aiInput}>
        <input
          ref={inputRef}
          value={input}
          placeholder="向DeepSeek提问..."
          autoComplete="off"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send()
          }}
        />
        <button type="button" onClick={send}>
          发送
        </button>
      </div>

      <div className={styles.panelFoot} style={{ paddingTop: 9 }}>
        <span>DEMO MODE · 本地模拟回答</span>
        <span>API READY</span>
      </div>
    </section>
  )
}
