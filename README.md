# &#10024; Sparkle Log · 闪光日记

**一份温和的、本地优先的自我关怀日记。**

不是任务管理，不是效率工具。Sparkle Log 帮助你从日常的微小事件中，发现那些容易被忽略的闪光点——你付出的时间、你的注意力、你已经做到的事。

---

## 核心理念

不做物理动作拆解（第一步干什么、第二步干什么），而是从你已经完成的事情中提取**值得被看见的价值**。比如：

> 输入："我做了一些翻译内容"
>
> 发现：
> - 我把一种语言里的内容，转换成了另一种语言
> - 为这件事花了一些时间
> - 留下了一点真实存在的成果

语言风格强调**描述事实、不评价人格**——不讲"你很棒""展现了执行力"，而是"今天让这件事向前移动了一点""花了一些时间，把注意力放在了这件事上"。

---

## 功能

- **事件录入** — 随手记下做了什么，支持手动设置开始/结束时间
- **AI 闪光点提取** — 支持真实 LLM API（OpenAI 兼容）或内置模拟，自动发现隐性价值
- **可编辑的发现** — 每个闪光点都是可编辑的输入框，不是死板文本
- **数据本地存储** — Dexie.js + IndexedDB，所有数据在本地，不上传任何服务器
- **PWA 桌面安装** — 浏览器一键安装，支持离线使用
- **导入/导出** — 设置面板中备份和恢复全部数据
- **Tauri 桌面打包** — 可编译为原生桌面应用

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 状态 | Zustand |
| 本地存储 | Dexie.js (IndexedDB) |
| 图标 | Lucide React |
| 桌面 | Tauri v2 / PWA |
| 语言 | TypeScript |

---

## 快速开始

```bash
npm install
npm run dev        # 开发模式 → http://localhost:3456
npm run build      # 构建静态文件
npm run serve      # 生产模式预览
```

### 配置 AI API

打开应用 → 右上角齿轮 → 填入你的 OpenAI 兼容 API 地址、密钥和模型名。密钥仅存本地。

### 安装为桌面应用

浏览器打开后，地址栏右侧 ⊕ → 安装。之后可在开始菜单找到 Sparkle Log。

---

## 项目结构

```
src/
├── app/            # Next.js App Router 页面和布局
├── components/     # UI 组件
│   ├── ui/         # shadcn 基础组件
│   ├── event-input.tsx       # 事件录入卡片
│   ├── breakdown-step.tsx    # 可编辑闪光点行
│   ├── diary-list.tsx        # 过往记录流
│   └── settings-dialog.tsx   # 设置面板
├── lib/
│   ├── db.ts       # Dexie 数据库
│   ├── store.ts    # Zustand 状态管理
│   ├── mock-ai.ts  # 内置 AI 模拟
│   └── api-ai.ts   # 真实 API 调用
public/             # 静态资源 + PWA manifest + SW
src-tauri/          # Tauri 桌面打包配置
```
