import { z } from 'zod';

/**
 * Document schema v1. Every object is strict: unknown fields are rejected so that an AI
 * author gets immediate feedback instead of silently losing content.
 */

const nonEmpty = z.string().trim().min(1);

/** One run of inline text. A bare string is shorthand for a plain text run. */
export const textRunSchema = z
  .object({
    text: z.string(),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    code: z.boolean().optional(),
    sup: z.boolean().optional(),
    sub: z.boolean().optional(),
    href: z.string().regex(/^(https?:\/\/|mailto:|#)/, 'href must be http(s), mailto: or #anchor').optional(),
  })
  .strict();

export const footnoteRunSchema = z.object({ footnote: nonEmpty }).strict();
export const breakRunSchema = z.object({ break: z.literal(true) }).strict();

export const runSchema = z.union([z.string(), textRunSchema, footnoteRunSchema, breakRunSchema]);
/** Inline content: a plain string or a list of runs. */
export const inlineSchema = z.union([z.string(), z.array(runSchema).min(1)]);

export type TextRun = z.infer<typeof textRunSchema>;
export type FootnoteRun = z.infer<typeof footnoteRunSchema>;
export type Run = z.infer<typeof runSchema>;
export type Inline = z.infer<typeof inlineSchema>;

const headingSchema = z
  .object({
    type: z.literal('heading'),
    level: z.number().int().min(1).max(4),
    text: nonEmpty,
    pageBreakBefore: z.boolean().optional(),
  })
  .strict();

const paragraphSchema = z.object({ type: z.literal('paragraph'), text: inlineSchema }).strict();

export interface ListItem {
  text: Inline;
  children?: Array<string | ListItem>;
}
const listItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z
    .object({
      text: inlineSchema,
      children: z.array(z.union([z.string(), listItemSchema])).min(1).optional(),
    })
    .strict(),
);

const listSchema = z
  .object({
    type: z.literal('list'),
    ordered: z.boolean().default(false),
    items: z.array(z.union([z.string(), listItemSchema])).min(1),
  })
  .strict();

const tableColumnSchema = z
  .object({
    header: nonEmpty,
    /** Column width as a percentage of the text width. Widths must add up to 100. */
    width: z.number().positive().max(100),
  })
  .strict();

const tableSchema = z
  .object({
    type: z.literal('table'),
    columns: z.array(tableColumnSchema).min(1).max(12),
    rows: z.array(z.array(inlineSchema).min(1)).min(1),
    /** Render the first cell of every row as a bold row header (key/value tables). */
    headerColumn: z.boolean().optional(),
    caption: nonEmpty.optional(),
  })
  .strict()
  .superRefine((table, context) => {
    table.rows.forEach((row, index) => {
      if (row.length !== table.columns.length) {
        context.addIssue({
          code: 'custom',
          path: ['rows', index],
          message: `row has ${row.length} cells but the table has ${table.columns.length} columns`,
        });
      }
    });
  });

const imageSchema = z
  .object({
    type: z.literal('image'),
    /** Path relative to the document file. */
    src: nonEmpty,
    /** Required: describes the image for accessibility and for reviewers of the output. */
    alt: nonEmpty,
    caption: nonEmpty.optional(),
    /** Display width as a percentage of the text width. Defaults to 100. */
    width: z.number().positive().max(100).optional(),
  })
  .strict();

const quoteSchema = z.object({ type: z.literal('quote'), text: inlineSchema }).strict();
const codeSchema = z
  .object({ type: z.literal('code'), text: z.string().min(1), language: nonEmpty.optional() })
  .strict();
const pageBreakSchema = z.object({ type: z.literal('pageBreak') }).strict();
const tocSchema = z
  .object({
    type: z.literal('toc'),
    depth: z.number().int().min(1).max(4).default(3),
    title: z.string().optional(),
  })
  .strict();

export const blockSchema = z.discriminatedUnion('type', [
  headingSchema,
  paragraphSchema,
  listSchema,
  tableSchema,
  imageSchema,
  quoteSchema,
  codeSchema,
  pageBreakSchema,
  tocSchema,
]);

export const documentSchema = z
  .object({
    version: z.literal(1),
    /** Document title; also stored as the document property. */
    title: nonEmpty,
    language: nonEmpty.default('en'),
    author: nonEmpty.optional(),
    /** Page header text. `{page}` and `{pages}` become live page-number fields. */
    header: nonEmpty.optional(),
    /** Page footer text. `{page}` and `{pages}` become live page-number fields. */
    footer: nonEmpty.optional(),
    /** Name of a built-in template or a path to a template JSON file. */
    template: nonEmpty.default('default'),
    blocks: z.array(blockSchema).min(1),
  })
  .strict();

export type Block = z.infer<typeof blockSchema>;
export type DocumentInput = z.input<typeof documentSchema>;
export type DocForgeDocument = z.output<typeof documentSchema>;

export interface SchemaIssue {
  path: string;
  message: string;
}

export type ParseResult =
  | { ok: true; document: DocForgeDocument }
  | { ok: false; issues: SchemaIssue[] };

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.length === 0
    ? '$'
    : path.reduce<string>(
        (text, part) => (typeof part === 'number' ? `${text}[${part}]` : `${text}.${String(part)}`),
        '$',
      );
}

/** Validate untrusted JSON content and describe every problem with its location. */
export function parseDocument(input: unknown): ParseResult {
  const result = documentSchema.safeParse(input);
  if (result.success) return { ok: true, document: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((issue) => ({
      path: formatPath(issue.path),
      message: issue.message,
    })),
  };
}
