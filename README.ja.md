# DocForge

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · 日本語

> **ステータス：初期リリース（v0.1.3）。** CLI、スキーマ、lint、DOCX の書き出しは利用でき、Word で検証済みです。詳しくは[ロードマップ](docs/plan.md)と[変更履歴](CHANGELOG.md)をご覧ください。

DocForge は、AI が**編集可能な Word**（DOCX）文書を安定して作れるようにするフレームワークです。[SlideForge](https://github.com/gordonkit/slideforge)（HTML/CSS → PPTX）の文書版にあたる姉妹プロジェクトで、AI は厳密に検証される JSON の内容だけを書き、レンダリング、プレビュー、lint、書き出しは DocForge が担当します。

```text
厳密な JSON ─► 検証 + lint ─► HTML ─► gordon-doc (Pandoc) ─► DOCX ─► 構造の検証
                    └─► HTML プレビュー                       └─► PDF + PNG ページ（Word）
```

## クイックスタート

```bash
npm install -g @gordonkit/docforge
docforge init document.json
docforge check document.json
docforge export document.json --output document.docx
docforge preview document.json --engine word-com
```

必要なもの：Node.js 24 以降、[Pandoc](https://pandoc.org/installing.html)、[gordon-doc](https://github.com/gordonkit/gordon-doc-converter) 1.0.0 以降（`pip install "gordon-doc-converter[images]"`）。これらを同梱した[コンテナイメージ](docker/README.md) `gordonkit/docforge` を使うこともできます。詳しくは [`docs/ja/guide.md`](docs/ja/guide.md) をご覧ください。

## 原則

- **入力を絞る**：AI が書くのは厳密な JSON だけで、HTML や CSS は書きません。
- **本物の Word の構造**：見出しは Heading 1–4 に対応し、リストは番号定義を使い、目次はフィールドになるので、ユーザーは Word でそのまま編集を続けられます。
- **テンプレート駆動**：組み込みのテンプレートは6種類（`default`、`classic`、`compact`、`minutes`、`proposal`、`letter`）で、内容を変えずにテンプレートだけを切り替えられます。
- **フィードバックループ**：lint とプレビューの結果は機械で読み取れるので、AI が自分で修正できます。
- **制限を正直に示す**：ピクセル単位の一致は謳わず、未対応の項目はすべてドキュメントに記載しています。

## ドキュメント

[日本語ガイド](docs/ja/guide.md) · [CLI](docs/cli.md) · [スキーマ](docs/schema.md) · [テンプレート](docs/templates.md) · [検証](docs/validation.md) · [AI ワークフロー](docs/ai-workflow.md) · [制限](docs/limitations.md) · [ロードマップ](docs/plan.md) · [変更履歴](CHANGELOG.md)（そのほかのドキュメントは英語です）。

## GordonKit のほかのサービス

DocForge は [GordonKit](https://gordonkit.com/ja/) の一部です。GordonKit は、無料のオンラインツールとオープンソースプロジェクトを提供しています。

- [gordon-doc-converter](https://docs.gordonkit.com/ja/overview/)：DOCX などの文書を PDF、HTML、Markdown、画像に変換します。Python ライブラリ、CLI、HTTP API として使えます。
- [SlideForge](https://slideforge.gordonkit.com/ja/overview/)：検証済みの JSON とテンプレートから統一感のあるプレゼンテーションを作成し、テキストと図形を編集できる PowerPoint として書き出します。
- [GordonKit Math](https://math.gordonkit.com/)：5〜9年生向けのインタラクティブな数学学習。視覚的で段階的なトピックを通して、考え方を理解できます（現在は英語と繁体字中国語のみ）。
- [Math Background Studio](https://bg.gordonkit.com/ja/)：数学的なパターンから壁紙やスライドの背景を生成し、PNG または SVG で書き出せます。
