# DocForge 繁體中文指南

本頁是英文文件的精簡版。細節與最新內容以英文文件為準（[schema](../schema.md)、[CLI](../cli.md)、[限制](../limitations.md)）。

## 指令

```text
docforge init [document.json]
docforge check <document.json> [--json]
docforge build <document.json> [--output document.html]
docforge export <document.json> --output document.docx [--overwrite]
docforge preview <document.json> [--output-dir <目錄>] [--engine word-com|libreoffice] [--json]
```

以 `npm install -g @gordonkit/docforge` 安裝，或用 `npx @gordonkit/docforge <指令>` 執行單一指令。在本 repo 的 checkout 中，先執行 `npm ci` 與 `npm run build`，再用 `node dist/cli/index.js <指令>`。

| 指令 | 作用 |
| --- | --- |
| `init` | 寫出起始文件，不會覆蓋既有檔案。 |
| `check` | 驗證 schema 並 lint。`--json` 輸出機器可讀結果，每個問題含 `code`、`severity`、`path`、`message`，通常有 `fix` 提示。有錯誤時 exit 1。 |
| `build` | 產生自包含的 HTML 預覽（僅供瀏覽器查看，不是 DOCX）。 |
| `export` | 透過 `gordon-doc` 輸出 DOCX，並驗證頁首、頁尾、目錄、註腳、圖片、分頁與範本是否都在。缺任何一項會刪除檔案並失敗。 |
| `preview` | 匯出後產生 PDF 與 PNG 頁面。Windows 上建議 `--engine word-com`，目錄才會被填入。 |

結束碼：0 成功、1 驗證或操作失敗、2 用法錯誤。

## 環境需求

- `gordon-doc` 1.0.0 以上：`pip install "gordon-doc-converter[images]"`。若設定了環境變數 `DOCFORGE_GORDON_DOC` 就執行它指向的檔案，否則執行 `PATH` 上的 `gordon-doc`，不會到其他位置尋找。版本低於 1.0.0 時 DocForge 會拒絕執行並提示升級。
- **Pandoc** 必須在 `PATH` 上。沒有時 `gordon-doc` 會悄悄改用較弱的引擎而遺失頁首、目錄等，所以 DocForge 會直接拒絕匯出。DocForge 以 Pandoc 3.13 測試；舊版會遺失內容，例如 Ubuntu 24.04 套件庫的 Pandoc 3.1.3 會丟掉註腳（匯出驗證會回報 DOCX 降級），請從 [pandoc.org](https://pandoc.org/installing.html) 安裝新版。
- Windows 預覽：安裝 Word 並加裝 `word` 附加套件（`pip install "gordon-doc-converter[word,images]"`）。

## 文件格式（schema v1）

單一 JSON 檔，所有物件都是嚴格的，多餘欄位會被拒絕，錯誤會指出路徑。

頂層欄位：`version`（固定 1）、`title`、`language`（預設 `en`，中文文件請設 `zh-TW`）、`author`、`header`、`footer`、`template`、`blocks`。`header`/`footer` 可用 `{page}`、`{pages}` 產生頁碼欄位，例如 `第 {page} 頁，共 {pages} 頁`。

區塊類型：`heading`（層級 1–4）、`paragraph`、`list`（可巢狀）、`table`（欄寬為百分比且總和須為 100）、`image`（必須有 `alt`）、`quote`、`code`、`pageBreak`、`toc`。段落、清單與表格內可使用粗體、斜體、行內程式碼、上下標、連結與 `{ "footnote": "..." }` 註腳。範例見 `examples/report.json`。

## 範本

`default`（無襯線、藍色標題）、`classic`（襯線、黑色標題、邊距較大）、`compact`（緊湊、青綠色標題）、`minutes`（會議記錄）、`proposal`（提案，大型深藍標題）、`letter`（信函，襯線、邊距寬）。範本控制字型、字級、標題與文字顏色、連結顏色、頁邊距；表格框線、程式碼底色與清單縮排目前由轉換器固定。

## AI 撰寫流程

1. 閱讀 schema 與 `examples/report.json`。
2. 寫出一份 JSON：只用 schema 內的欄位，只有一個 level-1 標題，標題層級不跳級，表格欄寬總和 100，圖片都有 `alt`。
3. 執行 `check --json`，依 `fix` 修正所有 `error`，檢視警告，直到 `ok` 為 true。
4. 執行 `preview`，逐頁查看分頁、表格寬度、圖片、頁首頁尾與註腳。
5. 執行 `export`。若回報 DOCX 降級或缺少工具，修正環境，不要繞過。
6. 回報已驗證與未驗證的項目，不要宣稱未檢查過的視覺一致性。

完整技能說明見 [`skills/docforge/SKILL.md`](../../skills/docforge/SKILL.md)。

## 已知限制

- 僅支援 A4 直式；整份文件只有一組頁首與頁尾。
- 圖片必須是本機檔案，且位於 JSON 檔所在的資料夾（或其子資料夾）內；不接受 `..`、絕對路徑與網址。
- 表格儲存格只能放行內文字，不支援合併儲存格或巢狀清單。
- 註腳是純文字；不支援註解、追蹤修訂與交互參照。
- 目錄由 Word 開啟或匯出時才會填入；LibreOffice 預覽只顯示佔位文字。
- 字型不內嵌，開啟 DOCX 的電腦需安裝範本所用字型（中文預設 Microsoft JhengHei）。
- 輸出以結構驗證，不保證像素級一致。
