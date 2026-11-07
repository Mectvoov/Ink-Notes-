# 墨记 · ink notes

Obsidian 日记库。把今天留在纸上。

## 目录结构

```
ink notes/
├── 首页.md           # 入口页，DataviewJS 仪表盘（按日期/分类聚合）
├── 日记索引.md       # 全部日记的索引
├── 分类配置.md       # 分类清单（type: category-config）
├── 分类/             # 生活 / 工作 / 学习 / 灵感 / 未分类
├── 日记/             # 正文，按 年/月 归档
│   └── 墨记导入/     # 从旧 App「墨记」迁移过来的历史日记
├── 模板/日记模板.md  # Templater 模板，从文件名解析日期与时间
└── 附件/             # 图片等附件，按来源分子目录
```

## 约定

- 日记文件名：`YYYY-MM-DD-HHmmss.md`，模板会从文件名回填 frontmatter。
- frontmatter 关键字段：`type: diary`、`date`、`week`、`weekday`、`time`、`category`。
- 附件放在 `附件/` 下，正文用 `![[文件名]]` 嵌入。
- 首页与索引依赖 Dataview / DataviewJS 插件渲染，纯文本浏览时看到的是代码块。

## 使用

1. Obsidian 打开本目录作为 vault。
2. 启用核心插件：Templater（模板）、Dataview（首页与索引）。
3. 新建日记时套用 `模板/日记模板.md`。
