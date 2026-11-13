# DocForge 日本語ガイド

このページは英語ドキュメントの要約版です。詳細と最新の内容は英語ドキュメントが優先されます（[スキーマ](../schema.md)、[CLI](../cli.md)、[制限](../limitations.md)）。

## コマンド

```text
docforge init [document.json]
docforge check <document.json> [--json]
docforge build <document.json> [--output document.html]
docforge export <document.json> --output document.docx [--overwrite]
docforge preview <document.json> [--output-dir <ディレクトリ>] [--engine word-com|libreoffice] [--json]
```

インストールは `npm install -g @gordonkit/docforge` で行うか、`npx @gordonkit/docforge <コマンド>` で単発のコマンドを実行します。このリポジトリのチェックアウトでは、先に `npm ci` と `npm run build` を実行してから、`node dist/cli/index.js <コマンド>` を使います。

| コマンド | 内容 |
| --- | --- |
| `init` | 開始用の文書を書き出します。既存のファイルは上書きしません。 |
| `check` | スキーマを検証し、lint を実行します。`--json` で機械可読な結果を出力し、各問題には `code`、`severity`、`path`、`message` が含まれ、多くは `fix` のヒントも付きます。エラーがあると exit 1 になります。 |
| `build` | 自己完結した HTML プレビューを生成します（ブラウザーで見るためだけのもので、DOCX ではありません）。 |
| `export` | `gordon-doc` 経由で DOCX を書き出し、ヘッダー、フッター、目次、脚注、画像、改ページ、テンプレートがすべて揃っているかを検証します。ひとつでも欠けていればファイルを削除して失敗します。 |
| `preview` | 書き出したあと、PDF と PNG のページを生成します。Windows では `--engine word-com` をおすすめします。目次が埋められるためです。 |

終了コード：0 は成功、1 は検証または操作の失敗、2 は使い方の誤りです。

## 動作環境

- `gordon-doc` 1.0.0 以降：`pip install "gordon-doc-converter[images]"`。環境変数 `DOCFORGE_GORDON_DOC` が設定されていれば、それが指すファイルを実行し、設定がなければ `PATH` 上の `gordon-doc` を実行します。ほかの場所は探しません。バージョンが 1.0.0 未満だと、DocForge は実行を拒否してアップグレードを促します。
- **Pandoc** が `PATH` 上にある必要があります。ない場合、`gordon-doc` は黙ってより弱いエンジンに切り替えてヘッダーや目次などを失うので、DocForge は書き出しそのものを拒否します。DocForge は Pandoc 3.13 でテストされています。古いバージョンでは内容が失われます。たとえば Ubuntu 24.04 のリポジトリにある Pandoc 3.1.3 は脚注を落とすため（書き出しの検証が DOCX の劣化を報告します）、[pandoc.org](https://pandoc.org/installing.html) から新しいバージョンをインストールしてください。
- Windows でのプレビュー：Word をインストールし、`word` エクストラを追加します（`pip install "gordon-doc-converter[word,images]"`）。

## 文書の形式（スキーマ v1）

単一の JSON ファイルで、すべてのオブジェクトが厳密です。余分なフィールドは拒否され、エラーにはパスが示されます。

トップレベルのフィールド：`version`（固定で 1）、`title`、`language`（既定は `en`。日本語の文書では `ja` を設定します）、`author`、`header`、`footer`、`template`、`blocks`。`header` と `footer` では `{page}` と `{pages}` でページ番号のフィールドを作れます。たとえば `{page} / {pages} ページ` のように書きます。

ブロックの種類：`heading`（レベル 1–4）、`paragraph`、`list`（入れ子にできます）、`table`（列幅はパーセントで、合計が 100 である必要があります）、`image`（`alt` が必須）、`quote`、`code`、`pageBreak`、`toc`。段落、リスト、表の中では、太字、斜体、インラインコード、上付き・下付き、リンク、`{ "footnote": "..." }` の脚注が使えます。例は `examples/report.json` をご覧ください。

## テンプレート

`default`（サンセリフ、青い見出し）、`classic`（セリフ、黒い見出し、余白が広め）、`compact`（コンパクト、青緑の見出し）、`minutes`（議事録）、`proposal`（提案書、大きな紺色の見出し）、`letter`（書簡、セリフ、余白が広い）。テンプレートが制御するのは、フォント、文字サイズ、見出しと本文の色、リンクの色、ページ余白です。表の罫線、コードの背景色、リストのインデントは、現時点ではコンバーターによって固定されています。

## AI の執筆フロー

1. スキーマと `examples/report.json` を読みます。
2. JSON を1つ書きます。スキーマにあるフィールドだけを使い、レベル 1 の見出しはひとつだけにし、見出しのレベルを飛ばさず、表の列幅の合計を 100 にし、画像にはすべて `alt` を付けます。
3. `check --json` を実行し、`fix` に従ってすべての `error` を直し、警告も確認して、`ok` が true になるまで繰り返します。
4. `preview` を実行し、改ページ、表の幅、画像、ヘッダーとフッター、脚注をページごとに確認します。
5. `export` を実行します。DOCX の劣化やツールの不足が報告されたら、環境を直してください。回避しないでください。
6. 検証した項目と検証していない項目を報告し、確認していない見た目の一致を謳わないでください。

スキルの詳しい説明は [`skills/docforge/SKILL.md`](../../skills/docforge/SKILL.md) をご覧ください。

## 既知の制限

- 対応するのは A4 縦のみで、文書全体でヘッダーとフッターはそれぞれ1組だけです。
- 画像はローカルのファイルで、JSON ファイルがあるフォルダー（またはそのサブフォルダー）の中にある必要があります。`..`、絶対パス、URL は受け付けません。
- 表のセルに入れられるのはインラインのテキストだけで、セルの結合や入れ子のリストには対応していません。
- 脚注はプレーンテキストです。コメント、変更履歴、相互参照には対応していません。
- 目次は、Word で開くか書き出すときに初めて埋められます。LibreOffice のプレビューでは、プレースホルダーのテキストだけが表示されます。
- フォントは埋め込まれないので、DOCX を開くコンピューターには、テンプレートが使うフォントがインストールされている必要があります。
- テンプレートの東アジア言語用フォント（既定は Microsoft JhengHei など）は、現時点では繁体字中国語のフォントに固定されています。日本語や簡体字中国語の文書でも同じフォントが使われるため、字形が期待と異なることがあります。
- 出力は構造で検証され、ピクセル単位の一致は保証しません。
