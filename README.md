# School Vista 3D · 智慧校园 3D 平台

> 用 React + React Three Fiber 在浏览器中还原智慧校园数字孪生：3D 校园、科技感 HUD、数据面板与 AI 助手。

![教室模式 · 多媒体教室](docs/images/classroom-mode.png)

> 教室模式：3D 教室内景、左侧班级概览、右侧教室控制台与四路室内监控。

## 当前状态

- **工程骨架已落地**：Vite + React + TypeScript + three / R3F / drei，全屏多分辨率 HUD、顶部导航、左侧工具栏、右侧数据面板、实时时钟。
- **多分辨率大屏**：以 1920×1080 为设计基准，使用 vw/vh 派生单位与 SCSS 转换函数，覆盖 1366×768 至 15360×4320、21:9 与 32:9；3D 支持档位渲染、像素预算与自适应 dpr。
- **校园外景**：双教学楼、操场与 6 个占位建筑按 `src/data/layout.json` 摆放，支持 POI 标签、详情卡、13 个室外机位、加载进度和性能读数。
- **数据面板**：安保、学生、生源、视频、AI 面板使用 mock 数据；出勤折线与教师 / 性别环形图已接入 ECharts，并随分辨率档位重建字号。
- **教室模式**：从「地点建筑 → 教室内」进入，教室 GLB 按需加载，提供 4 个室内机位、设备热点、班级概览、教室控制台、四路室内监控与时间/灯光联动。
- **原型仍保留**：`docs/智慧校园3D平台_原型资料/prototype.html` 是交互与视觉参考，不是最终技术栈。

详细方案见 [docs/项目开发方案.md](docs/项目开发方案.md)，资产规范见 [docs/Blender三维资产接入方案.md](docs/Blender三维资产接入方案.md)。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://127.0.0.1:5173/。

常用命令：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run measure` | 输出 GLB 包围盒、锚点、材质统计 |
| `npm run verify:ui` | 无头浏览器截图与交互验证 |
| `npm run verify:ui:matrix` | 多分辨率验证矩阵，截图与报告写入 `.workbuddy/verify-matrix` |

两个 `verify` 命令都需要先启动 `npm run dev`，默认查找本机 Chrome / Edge，也可通过 `CHROME_PATH` 指定可执行文件。

## 多分辨率适配

以 1920×1080 为设计基准，采用 vw/vh 派生单位而非整页 `transform: scale()`：

- `--u = min(100vw / 1920, 100vh / 1080)`：字号、间距、图标、边框统一等比缩放；`--u-vw`、`--u-vh` 用于单轴铺满。
- `src/styles/_responsive.scss` 提供 `u() / vw() / vh() / hairline()`，SCSS 中直接按设计稿像素书写。
- 全屏壳层替代固定 1920×1080 舞台；`data-layout="wide"` / `"ultra"` 驱动 21:9、32:9 的面板加宽与导航间距。
- ECharts 通过 `chartMetrics()` 按档位计算字号，`ResizeObserver` 跟随容器；档位或布局变化时重建 option。
- 3D 渲染按物理像素判定档位：1080P / 2K / 4K 全分辨率；8K 默认 0.75 渲染比例；16K 受 20MP 像素预算约束；8K 阴影贴图降至 1024。
- 自适应画质：5s 预热、2s 采样，低于 28fps 降档、高于 50fps 升档；可在设置面板关闭。

| 视口 | 渲染 DPR | 3D buffer |
| --- | --- | --- |
| 1920×1080 | 1.00 | 1920×1080 |
| 3840×2160 | 1.00 | 3840×2160 |
| 3840×2160 @dpr2 | 1.50 | 5760×3240 |
| 7680×4320 | 0.75 | 5760×3240 |
| 15360×4320 | 0.55 | 8432×2371 |

```bash
npm run verify:ui:matrix
```

覆盖 1366×768 / 1920×1080 / 2560×1440 / 3440×1440 / 3840×2160 / 3840×2160@2x / 5120×1440 / 7680×4320 / 15360×4320，断言溢出、HUD 尺寸、3D buffer、ECharts canvas、导航与 POI 交互。报告写入 `.workbuddy/verify-matrix/report.json`。

## 目录结构

```text
.
├─ src/
│  ├─ config/                # 分辨率档位、渲染预算、图表 metrics
│  ├─ scene/                 # R3F 场景、模型加载、POI、相机、性能探针
│  ├─ ui/                    # HUD、面板、ECharts 图表、POI 卡片
│  ├─ utils/                 # 视口单例、dpr 跟随
│  ├─ store/                 # Zustand 状态
│  ├─ data/layout.json       # 布局冻结（模型、POI、相机、道路）
│  ├─ types/                 # 布局类型
│  └─ styles/                # global.scss + _responsive.scss 转换函数
├─ public/assets/
│  ├─ campus/                # 教学楼群、操场
│  └─ interior/              # 教室
├─ tools/
│  ├─ asset-pipeline/        # GLB 实测脚本
│  └─ verify/                # screenshot.mjs、resolution-matrix.mjs
├─ docs/                     # 原型资料、资产方案、项目开发方案、界面截图
├─ model/                    # Blender 源文件与原始贴图
└─ README.md
```

## 技术栈

- Vite + React + TypeScript
- three + `@react-three/fiber` + `@react-three/drei`
- Zustand
- CSS Modules + SCSS + CSS Variables
- ECharts 6（按需引入 + canvas 渲染）
- Blender + glTF 2.0 + gltf-transform + Meshopt
- hls.js / flv.js（视频监控后续接入）

## 资产与预算

| 资产 | 文件 | 体积 | 三角面 | draw call |
| --- | --- | --- | --- | --- |
| 第一教学楼 | `public/assets/campus/teaching-1.glb` | 4.89MB | 72,274 | 10 |
| 第二教学楼 | `public/assets/campus/teaching-2.glb` | 2.81MB | 47,056 | 8 |
| 操场 | `public/assets/campus/playground.glb` | 4.18MB | 43,290 | 12 |
| 教室 | `public/assets/interior/classroom.glb` | 9.68MB | 92,722 | 58 |

- 1 单位 = 1 米，Y 轴向上，地面 `y = 0`。
- 外景合计 11.88MB / 16.3 万面 / 30 draw call。
- 教室按需加载，不占首屏。

## 说明

- `model/` 中的 Blender 场景与贴图为源资产，公开部署前需确认素材授权。
- AI 面板当前为骨架占位；接入真实接口时通过服务端 BFF 代理，避免在前端暴露 API Key。
