# DocForge

[English](README.md) · 繁體中文

> **狀態：早期版本（v0.1.3）。** CLI、schema、lint 與 DOCX 匯出已可使用，並在 Word 中驗證過。詳見[路線圖](docs/plan.md)與[變更紀錄](CHANGELOG.md)。

DocForge 是一個讓 AI 能穩定產生**可編輯 Word（DOCX）**文件的框架，是 [SlideForge](https://github.com/gordonkit/slideforge)（HTML/CSS → PPTX）的文件版姊妹專案：AI 只撰寫嚴格驗證的 JSON 內容，由 DocForge 負責渲染、預覽、lint 與匯出。

```text
嚴格 JSON ─► 驗證 + lint ─► HTML ─► gordon-doc (Pandoc) ─► DOCX ─► 結構驗證
                    └─► HTML 預覽                       └─► PDF + PNG 頁面（Word）
```

## 快速開始

```bash
npm install -g @gordonkit/docforge
docforge init document.json
docforge check document.json
docforge export document.json --output document.docx
docforge preview document.json --engine word-com
```

需求：Node.js 24+、[Pandoc](https://pandoc.org/installing.html)、[gordon-doc](https://github.com/gordonkit/gordon-doc-converter) 1.0.0 以上（`pip install "gordon-doc-converter[images]"`）；也可以改用已包含這些工具的[容器映像檔](docker/README.md) `gordonkit/docforge`。詳見 [`docs/zh-TW/guide.md`](docs/zh-TW/guide.md)。

## 原則

- **受限輸入**：AI 只寫嚴格的 JSON，不寫 HTML 或 CSS。
- **真正的 Word 結構**：標題對應 Heading 1–4，清單使用編號定義，目錄是欄位，使用者可繼續在 Word 編輯。
- **範本驅動**：內建六個範本（`default`、`classic`、`compact`、`minutes`、`proposal`、`letter`），換範本不必改內容。
- **回饋迴圈**：lint 與預覽結果可由機器讀取，AI 能自行修正。
- **誠實揭露限制**：不宣稱像素級一致，未支援的項目都有文件說明。

## 文件

[繁體中文指南](docs/zh-TW/guide.md) · [CLI](docs/cli.md) · [schema](docs/schema.md) · [範本](docs/templates.md) · [驗證](docs/validation.md) · [AI 工作流程](docs/ai-workflow.md) · [限制](docs/limitations.md) · [路線圖](docs/plan.md) · [變更紀錄](CHANGELOG.md)（其餘文件為英文）。
