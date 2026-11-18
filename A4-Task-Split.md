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
| 视觉风格 | **已确定**：以深色为主的"夜间"风格，靛紫强调色、毛玻璃卡片、表盘和周图表；浅色模式同样支持（见下方设计规范） |
| 界面语言 | 英文（助教用英文评分） |

## 设计规范

第一版用的是 Kazuha 网站那套白色细边框卡片，放到手机上显得简陋、过时，所以改成了现在主流睡眠 app（iOS 时钟的睡眠日程、Apple 健康、Sleep Cycle、Rise）的风格。实际取值以 `src/theme/variables.scss` 为准。

### 颜色

| Token | 深色（主设计） | 浅色 |
| --- | --- | --- |
| 页面背景 | 渐变 `#0b1026 → #141a3d` | 渐变 `#f4f3fb → #ebe9f8` |
| 卡片 | `rgba(255,255,255,.06)`，背景模糊 | `rgba(255,255,255,.8)`，背景模糊 |
| 正文 / 次要文字 | `#eef0ff` / `#9aa3c7` | `#15172b` / `#5d6283` |
| 强调色 | `#8b7cf6` | `#5b4bdb` |
| 主按钮渐变 | `#6f5ff0 → #5546d6` | `#6b5be6 → #4d3fd0` |

困倦度 1–7 分按三档上色，颜色一定和数字、文字一起出现，不单靠颜色表达：1–2 青绿（`#34d399` 系）、3–4 琥珀（`#fbbf24` 系）、5–7 珊瑚（`#fb7185` 系）。深浅两种模式下，文字和底色的对比度都至少 4.5:1。

深色模式跟随系统设置。浏览器里固定用 iOS 风格（`main.ts` 里 `mode: 'ios'`）。

### 字体

- 系统字体：`-apple-system, system-ui, "PingFang SC", sans-serif`。
- 数字（时长、分数）用圆体：`ui-rounded`，字重 700，`tabular-nums`。
- 大标题用 iOS 的 large title。

### 卡片、按钮、间距

- 卡片：圆角 22px，毛玻璃效果，没有可见边框。
- 主按钮：高 50px，胶囊形，渐变色；次按钮用浅色底。
- 最小点击区域 44px；间距用 8 的倍数。

### 图标

用 Ionic 自带的 Ionicons，只用 outline 版本。

### 页面结构

- **Today**（首页）：
  - 顶部是 24 小时睡眠表盘，用弧线画出从就寝到起床的时间，中间是时长，下面一个小标签显示和本周其他晚上的对比。
  - 最近 7 天的柱状图：柱子是每天睡了多久（一天记了多晚的话取最长的那晚），下面的圆点是当天的平均困倦度。
  - 今天的困倦度：最新分数用大号数字显示，下面列出今天的每条记录。
  - 两个按钮："Log sleepiness"（主按钮）和 "Log sleep"。
- **History**：按天分组；用胶囊形分段按钮筛选"全部 / 睡眠 / 困倦度"；左滑删除，点击编辑。
- **Settings**：分组列表，里面有提醒的开关和时间、加载演示数据、清空数据。
- **记录**：不占 tab，用 iOS 卡片式弹窗，左上 Cancel、右上 Save。

### 记录睡眠的交互

参考 iOS 时钟的睡眠日程和 Sleep Cycle：

1. 先选是哪一晚："Last night"（默认）/ "Night before" / "Pick date…"。
2. 在表盘上拖动 🌙（就寝）和 ☀️（起床），以 5 分钟为一格，拖动时手机轻震；也可以在下面的 "Bedtime" / "Wake up" 两行里精确选时间，只选时间、不选日期。
3. 日期自动推算（`src/app/shared/night.ts`）：就寝在中午 12 点以后，算作选中那天的晚上，否则算作第二天凌晨；起床时间一定在就寝之后，所以时长永远在 0 到 24 小时之间。"起床早于就寝""67 小时"这类错误从设计上就不会出现。
4. 下方摘要显示星期几，比如 "8h 0m · Fri 11:00 PM → Sat 7:00 AM"。
5. 校验：起床时间不能在未来；少于 1 小时或超过 14 小时给出提醒；同一晚已经记过时给出提醒。

### 记录困倦度的交互

- 横向 1–7 刻度，颜色从绿到琥珀再到珊瑚；选中的那档放大并加圈，下方显示 Stanford 量表的描述。选中后点 Save 保存，多一步确认可以防止误触。
- 时间默认是 "Now"，点开可以改。新记录如果选了比现在晚的时间，自动算作昨天，显示为 "Yesterday 11:50 PM"。

### 交互规则

- 删除后弹出带 Undo 按钮的提示（显示在 tab 栏上方），不用确认弹窗。
- 空状态写明下一步怎么做。
- 保存成功时轻震，校验出错时用警告式震动。
- 动画要克制，并尊重系统的"减弱动态效果"设置。
- 在 375px 和 320px 两种宽度、浅色和深色两种模式下都要检查。

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
  - [ ] 1–7 分做成大按钮或卡片，每档显示 Stanford 量表的文字描述；选中一档后点 Save 保存（多一步确认，防止误触，编辑时也需要 Save）
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
