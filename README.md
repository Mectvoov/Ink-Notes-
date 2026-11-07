# 墨记

把今天留在纸上。

## 简介

「墨记」是一份中文 Obsidian 日记库，用来记录日常、整理分类，并通过首页与索引快速回看。当前收录 16 篇日记，其中 15 篇来自旧 App「墨记」的迁移记录；分类共 5 个。仓库同时保存模板、附件和 Obsidian 配置，当前跟踪 56 个文件。

GitHub 页面可以直接阅读 Markdown 正文，但首页、索引和分类页中的 DataviewJS 需要在 Obsidian 中渲染。

## 快速开始

1. 将仓库克隆到本地。
2. 打开 Obsidian，选择「打开文件夹作为 vault」，选中仓库根目录 `墨记`，不要只选择 `ink notes/`。
3. 首次打开时若出现受限模式提示，进入「设置 → 社区插件」，关闭受限模式并启用 Calendar、Dataview、Homepage、Templater。
4. 进入「设置 → 外观 → CSS 片段」，确认 `moji` 已启用；若列表中没有该片段，刷新后启用 `.obsidian/snippets/moji.css`。
5. Homepage 会在启动时打开 `ink notes/首页.md`。若没有自动打开，可手动进入该页；`ink notes/日记索引.md` 用于浏览全部日记和分类页入口。
6. 如果页面显示的是 `dataviewjs` 代码块而不是仪表盘或索引，请在 Dataview 设置中确认「启用 JavaScript 查询」。本仓库的 `enableDataviewJs` 已设为 `true`。

## 目录结构

```text
墨记/
├── .obsidian/                    # Obsidian 配置、插件与样式
│   ├── plugins/                  # 四个社区插件的安装文件与设置
│   └── snippets/moji.css         # 首页、日记、索引的自定义版式
└── ink notes/
    ├── 首页.md                   # DataviewJS 日记仪表盘与快捷入口
    ├── 日记索引.md               # 按日期聚合的全部日记索引
    ├── 分类配置.md               # 分类清单与分类配置来源
    ├── 分类/                     # 生活、工作、学习、灵感、未分类页
    ├── 日记/                     # 日记正文，按年/月归档
    │   └── 墨记导入/             # 旧 App「墨记」迁移的历史日记
    ├── 模板/                     # Templater 日记模板
    └── 附件/                     # 图片等附件，含墨记导入附件
```

## 核心插件与自定义样式

| 插件 | 版本 | 作用 |
| --- | --- | --- |
| Calendar | 1.5.10 | 提供日历视图，可从日期打开或创建对应日笔记。 |
| Dataview | 0.5.68 | 查询日记 frontmatter，并渲染首页、日记索引与分类页。 |
| Homepage | 4.6.0 | 在启动时打开 `ink notes/首页.md`，作为固定入口。 |
| Templater | 2.26.0 | 在 `ink notes/日记/` 下创建文件时套用日记模板。 |

`.obsidian/snippets/moji.css` 共 862 行，需要在「设置 → 外观 → CSS 片段」中启用。本仓库的 `appearance.json` 已记录启用 `moji`。样式定义了三套页面版式：

| CSS class | 用途 |
| --- | --- |
| `moji-home` | 首页仪表盘，展示统计、今日记录、分类与最近日记。 |
| `moji-diary` | 日记正文版式，控制字体、元信息与阅读宽度。 |
| `moji-index` | 日记索引和分类页版式，统一日期、缩略图与列表密度。 |

## 笔记约定

- 常规日记优先使用 `YYYY-MM-DD-HHmmss.md`，历史导入日记使用 `YYYY-MM-DD-HHmm.md`。
- 日记存放在 `ink notes/日记/YYYY/MM/`；同一秒发生冲突时，首页创建入口会添加数字后缀。
- 附件存放在 `ink notes/附件/`，旧 App 导入附件位于 `ink notes/附件/墨记导入/`。
- 正文使用 `![[文件名]]` 嵌入附件，链接格式为 Obsidian 短链接。

日记模板写入以下 frontmatter 字段：

| 字段 | 说明 |
| --- | --- |
| `type` | 固定为 `diary`。 |
| `date` | 日期，格式 `YYYY-MM-DD`。 |
| `week` | ISO 周次，格式 `GGGG-[W]WW`。 |
| `weekday` | 中文星期，例如 `星期五`。 |
| `time` | 时间，格式 `HH:mm:ss`。 |
| `category` | 当前分类名称。 |
| `category_ref` | 指向对应分类页的短链接。 |
| `mood` | 心情，默认留空。 |
| `weather` | 天气，默认留空。 |
| `tags` | 默认包含 `日记`。 |
| `cover` | 封面附件，默认留空。 |
| `cssclasses` | 默认包含 `moji-diary`。 |

当前分类清单为：生活、工作、学习、灵感、未分类。

## 写作流程

1. **Homepage 首页入口**：从 `ink notes/首页.md` 的今日区域新建日记，文件按 `YYYY-MM-DD-HHmmss.md` 命名。
2. **Calendar 日历**：在 Calendar 视图中选择日期，通过日笔记入口打开或创建当天笔记。
3. **核心日记插件命令**：使用命令面板中的日记命令打开或创建当天笔记。

Templater 在 `ink notes/日记/` 下创建文件时自动套用 `ink notes/模板/日记模板.md`，根据文件名或当前时间回填日期、周次、星期和时间等 frontmatter。

当前核心日记插件设置为目录 `ink notes/日记`、格式 `YYYY/MM/YYYY-MM-DD`，因此 Calendar 和日记命令会创建日期文件名；若要保持带时分秒的统一命名，请从首页入口新建或创建后重命名。

## 数据来源与迁移

`ink notes/日记/墨记导入/` 保存从旧 App「墨记」迁移的历史记录，文件名采用 `YYYY-MM-DD-HHmm.md`。同源图片位于 `ink notes/附件/墨记导入/`，正文通过附件短链接引用。

## 版本与备份

本仓库本身就是这份 vault 的版本历史。提交 Markdown、附件、插件设置和 `moji.css` 后，可从 Git 记录回溯内容变化。

`.obsidian/workspace.json`、`workspace-mobile.json`、缓存目录、`.trash/`、`.DS_Store`、旧插件数据备份和临时文件不会入库；`.obsidian/plugins/*/data.json` 属于插件设置，会保留在版本库中。
