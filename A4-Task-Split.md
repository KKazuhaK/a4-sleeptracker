# A4 Sleep Tracker 分工

- **Group 8**：Kazuha Mo、Wanke Hou
- **截止**：Mon Nov 23, 2026 11:59pm
- **目标分数**：11/10 起步（必做 3 + 原生功能和持久化都做 3 + 设计 2 + 吸引力 2 + readme 1），争取吸引力加分到 12/10
- 作业原文见 [A4-Sleep-Tracker-Ionic.md](A4-Sleep-Tracker-Ionic.md)

## 总体方案（已确定）

| 项 | 暂定 |
| --- | --- |
| 目标用户 | **已确定**：大学生（作息不规律、白天容易犯困） |
| 优先平台 | **已确定**：iOS（用 iOS 模拟器演示原生功能） |
| 二选一 | **已确定**：原生功能和持久化都做：Local Notifications + Ionic Storage |
| 页面结构 | 底部 3 个 tab：Today / History / Settings；记录用底部弹出的 sheet（见下方设计规范） |
| 视觉风格 | 沿用 Kazuha 一贯的风格：中性底色、单一蓝色强调色、细线卡片、大圆角，深色模式跟随系统（见下方设计规范） |
| 界面语言 | 英文（助教用英文评分） |

## 设计规范

参考了 Kazuha 之前的项目：kazuha.me、uci.kazuha.me、steward-web、AlertHub、Report Portal、Passwall-Sub-Panel。下面是这些项目共有的风格，以及换到 iOS 上要做的调整。

### 颜色

只用一个强调色，其他颜色只用来表示状态。

| Token | 浅色 | 深色 | 来源 |
| --- | --- | --- | --- |
| 背景 `--app-bg` | `#f7f7f5` | `#0a0d12` | kazuha.me / uci.kazuha.me |
| 卡片 `--app-surface` | `#ffffff` | `#14181f` | 同上 |
| 边框 `--app-border` | `#e2e4e9` | `rgba(255,255,255,.08)` | 同上 |
| 正文 `--app-text` | `#16181d` | `#f1f5f9` | 同上 |
| 次要文字 `--app-text-2` | `#5a5f6b` | `#94a3b8` | 同上 |
| 强调色 `--ion-color-primary` | `#2448c9` | `#8ab4f8` | kazuha.me / steward-web |
| 强调色浅底 | `#eef1fb` | `rgba(138,180,248,.14)` | kazuha.me |

困倦度 1–7 分是一种"状态"，按三档上色。颜色一定和数字、文字描述一起出现，不单靠颜色表达（沿用 Report Portal 的 StatusTag 规则）：

| 分数 | 含义 | 颜色（浅底 / 深色字） |
| --- | --- | --- |
| 1–2 | 清醒 | `#e8f5ee` / `#1b6b41` |
| 3–4 | 有点困 | `#fff5db` / `#8a6100` |
| 5–7 | 很困 | `#fdeee6` / `#a8360b` |

深色模式用 Ionic 自带的 `dark.system.css`，跟随系统设置。

### 字体

- 系统字体：`-apple-system, system-ui, "PingFang SC", sans-serif`，在 iOS 上就是 SF Pro。
- 大标题用 iOS 的 large title（`ion-header collapse="condense"`），字重 600。
- 正文 16px / 1.5。时长这类数字用 `font-variant-numeric: tabular-nums`，避免数字变化时宽度跳动。

### 间距、圆角、卡片

- 间距用 8 的倍数：8 / 16 / 24 / 32。
- 圆角：按钮 10–12，卡片 16，标签和小按钮用胶囊形（999）。
- 卡片是平的：1px 细边框，没有阴影。
- 主按钮最小高度 44px，这也是 iOS 规定的最小点击区域。

### 图标

用 Ionic 自带的 Ionicons，**只用 outline 版本**，和 Kazuha 其他项目里 Lucide、antd outlined 的线条风格保持一致，也不需要多装依赖。

### 页面结构

Kazuha 之前的项目用的是顶部导航或侧边栏，没有底部 tab。但 iOS 规范要求 app 用底部 tab bar，所以这里改用 tab。"首页就是概况"这个习惯照旧保留。

- **Today**（首页）：
  - 顶部卡片显示昨晚睡了多久，以及和近 7 天平均值的对比。
  - 下面是今天的困倦度记录，以及最近一次的分数。
  - 两个主按钮："Log sleep" 和 "Log sleepiness"。
- **History**：
  - 两类记录按天分组，类似 iOS"健康"app 的列表。
  - 上方用 segment 切换"全部 / 睡眠 / 困倦度"。
  - 左滑删除，点击编辑。
- **Settings**：通知提醒的开关和时间、加载演示数据、清空数据（需要二次确认，按钮文字写明具体操作，比如 "Delete all logs"）。
- **记录**：不单独占一个 tab，用 `ion-modal` 做成底部弹出的 sheet，这是 iOS 常见的做法。
  - 从 Today 页的按钮打开，也可以点通知直接打开。
  - 右上角是 Save，左上角是 Cancel。

### 交互规则（沿用 Report Portal 的前端规范）

- 删除后弹出带 Undo 按钮的 toast，不用"确定删除吗？"这种确认弹窗。
- 空状态写明下一步怎么做，比如 "No sleep logged yet — tap Log sleep"。
- 文案直接说明数值是什么，比如 "7 h 32 min"，不写 "7.53"。
- 动画要克制，并且尊重系统的"减弱动态效果"设置（`prefers-reduced-motion`）。
- 在 375px（iPhone）和 320px（小屏）两种宽度下都要检查，浅色、深色都要看。

## 分工

两人之间只靠 `SleepService` 的接口对接。接口先定下来，Kazuha 用假数据做界面，Wanke 实现数据层，两边互不阻塞。

### Kazuha：界面和交互

- [ ] 全局主题：按上面的设计规范，在 `src/theme/variables.scss` 里写好颜色、字体和圆角的 token，并开启深色模式
- [ ] Tab 结构和路由（`app.routes.ts`）：Today / History / Settings
- [ ] **Today** 页（首页）：昨晚睡了多久、今天最近一次困倦度、两个快捷记录入口
- [ ] **Settings** 页的界面（通知相关的逻辑由 Wanke 接）
- [ ] 两个记录 sheet 都用 `ion-modal`
- [ ] **记录夜间睡眠**
  - [ ] 用 `ion-datetime` 选上床和起床时间，默认值设成昨晚 23:00 到今早 7:00
  - [ ] 防错：起床时间早于上床时间时禁用保存，时长异常（超过 14 小时或不到 1 小时）时提示，同一晚已经记过时提示
  - [ ] 可选字段：睡眠质量、备注
- [ ] **记录困倦度**
  - [ ] 1–7 分做成大按钮或卡片，每档显示 Stanford 量表的文字描述，点一下就记完
  - [ ] 记录时间默认是现在，可以改
- [ ] **History** 页：两类记录按日期分组显示，用 segment 筛选，支持左滑删除和点击编辑；可选加周视图或图表
- [ ] 撤销的界面部分：删除后弹出带"撤销"按钮的 toast，调用 Wanke 提供的接口
- [ ] 组件样式统一

### Wanke：数据和原生功能

- [ ] 改写 `SleepService`，实现下面的接口
- [ ] 数据类扩展字段（和 Kazuha 一起确认）
- [ ] **持久化**：接入 Ionic Storage，每次增、删、改都写入存储，启动时读出来；Date 字段存进去会变成字符串，读出来要还原成 Date
- [ ] 去掉或改掉默认的假数据（保留一个开关方便演示）
- [ ] 删除和撤销：`delete` 返回被删的记录，`restore` 把它恢复回去
- [ ] 统计计算：近 7 天平均睡眠时长、困倦度平均值
- [ ] **本地通知**（`@capacitor/local-notifications`）
  - [ ] 白天定时提醒填困倦度（比如 10:00 / 14:00 / 18:00，可以开关）
  - [ ] 早上提醒记录昨晚的睡眠
  - [ ] 点通知直接跳到对应的记录页
  - [ ] 给 Settings 页提供接口：读取和保存提醒的开关和时间（界面由 Kazuha 做）
- [ ] iOS 模拟器构建：`npx cap add ios` → `npx cap sync` → `npx cap run ios`，**第一天就跑通**

### 一起做

- [x] 确认总体方案
- [ ] 确认 Service 接口（第一天）
- [ ] 联调和修 bug
- [ ] readme（见下面的对照表）
- [ ] 录 demo 视频
- [ ] 一个人交 zip；两个人都在 Canvas 填分工评价

## Service 接口草案

```ts
// SleepService 对外的方法（名字和字段可以再改，定下来以后两边都按这个写）
init(): Promise<void>                              // 启动时从存储加载数据
getOvernight(): OvernightSleepData[]               // 按时间倒序
getSleepiness(): StanfordSleepinessData[]          // 按时间倒序
getAll(): SleepData[]                              // 两类混在一起，按时间倒序
getLastNight(): OvernightSleepData | undefined

logOvernight(start: Date, end: Date, extra?: { quality?: number; note?: string }): Promise<OvernightSleepData>
logSleepiness(value: number, at?: Date, note?: string): Promise<StanfordSleepinessData>
update(record: SleepData): Promise<void>
delete(id: string): Promise<SleepData>             // 返回被删的记录，用来撤销
restore(record: SleepData): Promise<void>

stats(days?: number): { avgSleepMinutes: number; avgSleepiness: number }
```

数据类需要给界面暴露的 getter：`sleepStart`、`sleepEnd`、`durationMinutes`、`loggedValue`。现在这些字段都是 `private`，需要改。

## 时间线

| 日期 | 内容 |
| --- | --- |
| 11/16–17 | 确认方案和接口；搭骨架（tab、空页面、Service 接口的空实现）；Wanke 跑通 iOS 模拟器 |
| 11/18–20 | 分头实现 |
| 11/21 | 合并代码、联调、打磨视觉 |
| 11/22 | 写 readme、录 demo |
| 11/23 | 检查后提交，留出缓冲时间 |

## Git 约定

- 每人在自己的分支上开发：`feat/ui-*`（Kazuha）、`feat/data-*`（Wanke），合并进 `master`
- 开始干活前先 `git pull`
- `SleepService` 的接口有改动时，先在群里说一声再改

## readme 对照

| 题号 | 负责人 |
| --- | --- |
| 1–5（分数、用时、参考资料、运行说明） | 一起写；第 5 题（运行说明）由 Wanke 写 |
| 6–7（目标用户、平台） | 一起写 |
| 8–10（怎么记录和查看数据，为什么这样设计） | Kazuha |
| 11–13（原生功能、持久化） | Wanke |
| 14（设计原则） | Kazuha 主写，Wanke 补充 |

第 14 题要逐条说明 4 条原则是怎么体现的：

1. **打开就有用的首页**：Today 页的概况和快捷记录入口
2. **撤销按钮**：删除后的撤销 toast，以及编辑功能
3. **防止输错**：时间选择器、默认值、保存前的校验
4. **遵循平台规范**：iOS 的 tab bar、large title、底部弹出的 sheet、左滑删除、原生的日期选择器，最小点击区域 44px

## Demo 视频清单（1 分钟左右，在 iOS 模拟器上录）

- [ ] 记一次夜间睡眠（展示防错校验）
- [ ] 记几次困倦度
- [ ] 在历史页查看两类数据，编辑一条、删除一条再撤销
- [ ] 收到通知，点开后跳到记录页
- [ ] 重启 app，数据还在
