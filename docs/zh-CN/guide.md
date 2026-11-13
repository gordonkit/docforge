# DocForge 简体中文指南

本页是英文文档的精简版。细节与最新内容以英文文档为准（[schema](../schema.md)、[CLI](../cli.md)、[限制](../limitations.md)）。

## 命令

```text
docforge init [document.json]
docforge check <document.json> [--json]
docforge build <document.json> [--output document.html]
docforge export <document.json> --output document.docx [--overwrite]
docforge preview <document.json> [--output-dir <目錄>] [--engine word-com|libreoffice] [--json]
```

以 `npm install -g @gordonkit/docforge` 安装，或用 `npx @gordonkit/docforge <指令>` 运行单一命令。在本 repo 的 checkout 中，先运行 `npm ci` 与 `npm run build`，再用 `node dist/cli/index.js <指令>`。

| 命令 | 作用 |
| --- | --- |
| `init` | 写出起始文档，不会覆盖既有文件。 |
| `check` | 验证 schema 并 lint。`--json` 输出机器可读结果，每个问题含 `code`、`severity`、`path`、`message`，通常有 `fix` 提示。有错误时 exit 1。 |
| `build` | 生成自包含的 HTML 预览（仅供浏览器查看，不是 DOCX）。 |
| `export` | 透过 `gordon-doc` 输出 DOCX，并验证页眉、页脚、目录、脚注、图片、分页与模板是否都在。缺任何一项会删除文件并失败。 |
| `preview` | 导出后生成 PDF 与 PNG 页面。Windows 上建议 `--engine word-com`，目录才会被填入。 |

结束码：0 成功、1 验证或操作失败、2 用法错误。

## 环境需求

- `gordon-doc` 1.0.0 以上：`pip install "gordon-doc-converter[images]"`。若设置了环境变量 `DOCFORGE_GORDON_DOC` 就运行它指向的文件，否则运行 `PATH` 上的 `gordon-doc`，不会到其他位置寻找。版本低于 1.0.0 时 DocForge 会拒绝运行并提示升级。
- **Pandoc** 必须在 `PATH` 上。没有时 `gordon-doc` 会悄悄改用较弱的引擎而遗失页眉、目录等，所以 DocForge 会直接拒绝导出。DocForge 以 Pandoc 3.13 测试；旧版会遗失内容，例如 Ubuntu 24.04 套件库的 Pandoc 3.1.3 会丢掉脚注（导出验证会报告 DOCX 降级），请从 [pandoc.org](https://pandoc.org/installing.html) 安装新版。
- Windows 预览：安装 Word 并加装 `word` 附加套件（`pip install "gordon-doc-converter[word,images]"`）。

## 文档格式（schema v1）

单一 JSON 档，所有对象都是严格的，多余字段会被拒绝，错误会指出路径。

顶层字段：`version`（固定 1）、`title`、`language`（默认 `en`，简体中文文档请设 `zh-CN`）、`author`、`header`、`footer`、`template`、`blocks`。`header`/`footer` 可用 `{page}`、`{pages}` 生成页码字段，例如 `第 {page} 頁，共 {pages} 頁`。

区块类型：`heading`（层级 1–4）、`paragraph`、`list`（可嵌套）、`table`（栏宽为百分比且总和须为 100）、`image`（必须有 `alt`）、`quote`、`code`、`pageBreak`、`toc`。段落、清单与表格内可使用粗体、斜体、行内代码、上下标、链接与 `{ "footnote": "..." }` 脚注。范例见 `examples/report.json`。

## 模板

`default`（无衬线、蓝色标题）、`classic`（衬线、黑色标题、边距较大）、`compact`（紧凑、青绿色标题）、`minutes`（会议记录）、`proposal`（提案，大型深蓝标题）、`letter`（信函，衬线、边距宽）。模板控制字体、字级、标题与文字颜色、链接颜色、页边距；表格框线、代码底色与清单缩进目前由转换器固定。

## AI 撰写流程

1. 阅读 schema 与 `examples/report.json`。
2. 写出一份 JSON：只用 schema 内的字段，只有一个 level-1 标题，标题层级不跳级，表格栏宽总和 100，图片都有 `alt`。
3. 运行 `check --json`，依 `fix` 修正所有 `error`，查看警告，直到 `ok` 为 true。
4. 运行 `preview`，逐页查看分页、表格宽度、图片、页眉页脚与脚注。
5. 运行 `export`。若报告 DOCX 降级或缺少工具，修正环境，不要绕过。
6. 报告已验证与未验证的项目，不要宣称未检查过的视觉一致性。

完整技能说明见 [`skills/docforge/SKILL.md`](../../skills/docforge/SKILL.md)。

## 已知限制

- 仅支持 A4 直式；整份文档只有一组页眉与页脚。
- 图片必须是本机文件，且位于 JSON 档所在的文件夹（或其子文件夹）内；不接受 `..`、绝对路径与网址。
- 表格保存格只能放行内文字，不支持合并保存格或嵌套清单。
- 脚注是纯文字；不支持注解、追踪修订与交互参照。
- 目录由 Word 打开或导出时才会填入；LibreOffice 预览只显示占位文字。
- 字体不内嵌，打开 DOCX 的电脑需安装模板所用字体（中文默认 Microsoft JhengHei）。
- 模板的东亚字体目前固定为繁体中文字体；简体中文与日文的文档也会使用它，字形可能与预期不同。
- 输出以结构验证，不保证像素级一致。
