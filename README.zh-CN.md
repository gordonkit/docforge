# DocForge

[English](README.md) · [繁體中文](README.zh-TW.md) · 简体中文 · [日本語](README.ja.md)

> **状态：早期版本（v0.1.3）。** CLI、schema、lint 与 DOCX 导出已可使用，并在 Word 中验证过。详见[路线图](docs/plan.md)与[更新日志](CHANGELOG.md)。

DocForge 是一个让 AI 能稳定生成**可编辑 Word**（DOCX）文档的框架，是 [SlideForge](https://github.com/gordonkit/slideforge)（HTML/CSS → PPTX）的文档版姊妹项目：AI 只撰写严格验证的 JSON 内容，由 DocForge 负责渲染、预览、lint 与导出。

```text
嚴格 JSON ─► 驗證 + lint ─► HTML ─► gordon-doc (Pandoc) ─► DOCX ─► 結構驗證
                    └─► HTML 預覽                       └─► PDF + PNG 頁面（Word）
```

## 快速开始

```bash
npm install -g @gordonkit/docforge
docforge init document.json
docforge check document.json
docforge export document.json --output document.docx
docforge preview document.json --engine word-com
```

需求：Node.js 24+、[Pandoc](https://pandoc.org/installing.html)、[gordon-doc](https://github.com/gordonkit/gordon-doc-converter) 1.0.0 以上（`pip install "gordon-doc-converter[images]"`）；也可以改用已包含这些工具的[容器映像档](docker/README.md) `gordonkit/docforge`。详见 [`docs/zh-CN/guide.md`](docs/zh-CN/guide.md)。

## 原则

- **受限输入**：AI 只写严格的 JSON，不写 HTML 或 CSS。
- **真正的 Word 结构**：标题对应 Heading 1–4，清单使用编号定义，目录是字段，用户可继续在 Word 编辑。
- **模板驱动**：内置六个模板（`default`、`classic`、`compact`、`minutes`、`proposal`、`letter`），换模板不必改内容。
- **反馈循环**：lint 与预览结果可由机器读取，AI 能自行修正。
- **诚实揭露限制**：不宣称像素级一致，未支持的项目都有文档说明。

## 文档

[简体中文指南](docs/zh-CN/guide.md) · [CLI](docs/cli.md) · [schema](docs/schema.md) · [模板](docs/templates.md) · [验证](docs/validation.md) · [AI 工作流程](docs/ai-workflow.md) · [限制](docs/limitations.md) · [路线图](docs/plan.md) · [更新日志](CHANGELOG.md)（其余文档为英文）。

## GordonKit 的其他服务

DocForge 是 [GordonKit](https://gordonkit.com/zh-CN/) 的一部分，GordonKit 提供免费的在线工具与开源项目：

- [gordon-doc-converter](https://docs.gordonkit.com/zh-CN/overview/)：将 DOCX 等文档转为 PDF、HTML、Markdown 与图片，提供 Python 套件、CLI 与 HTTP API。
- [SlideForge](https://slideforge.gordonkit.com/zh-CN/overview/)：以验证过的 JSON 与版型制作风格一致的演示文稿，并导出可编辑文字与图形的 PowerPoint。
- [GordonKit Math](https://math.gordonkit.com/zh-tw/)：五到九年级的交互式数学学习，以可视化、循序渐进的单元带你理解概念。
- [Math Background Studio](https://bg.gordonkit.com/zh-cn/)：用数学图案生成壁纸与演示文稿背景，并导出为 PNG 或 SVG。
