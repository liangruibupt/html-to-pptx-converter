/**
 * Vertical flow layout for the semantic conversion mode.
 *
 * Semantic mode used to drop every element of a section at the same fixed
 * offset (text at y=1.5in, everything else at y=2in), so any section with more
 * than one element produced boxes stacked on top of each other. These helpers
 * estimate how tall each element will render so SlideCreator can stack them
 * top-to-bottom and continue onto a new slide when a slide fills up.
 *
 * The estimates are deliberately a little generous: an element that ends up
 * slightly shorter than its box only leaves whitespace, one that ends up taller
 * overlaps the next element.
 */

/** Slide size in inches for a pptxgenjs layout name. */
export function slideSizeFor(layoutName?: string): { w: number; h: number } {
  switch (layoutName) {
    case 'LAYOUT_4x3':
      return { w: 10, h: 7.5 };
    case 'LAYOUT_16x10':
      return { w: 10, h: 6.25 };
    case 'LAYOUT_WIDE':
      return { w: 13.33, h: 7.5 };
    case 'LAYOUT_16x9':
    default:
      return { w: 10, h: 5.625 };
  }
}

/** Vertical gap between stacked elements, inches. */
export const FLOW_GAP_IN = 0.15;
/** Bottom margin kept free on every slide, inches. */
export const FLOW_BOTTOM_MARGIN_IN = 0.3;
/** Where content starts on a slide with a title (title box is y=0.5, h=1). */
export const FLOW_TOP_WITH_TITLE_IN = 1.5;
/** Where content starts on a slide without a title. */
export const FLOW_TOP_NO_TITLE_IN = 0.5;
/** Smallest font a too-tall text block is shrunk to before it is allowed to overflow. */
export const MIN_FONT_PT = 10;

/** Default left/right and top/bottom text-box insets pptxgenjs/PowerPoint apply, inches. */
const TEXT_INSET_X_IN = 0.2;
const TEXT_INSET_Y_IN = 0.1;
const LINE_HEIGHT_FACTOR = 1.2;

/** Resolve a pptxgenjs width (inches, or a 'NN%' string of the slide width) to inches. */
export function resolveWidthIn(w: unknown, slideWidthIn: number, fallbackIn = slideWidthIn * 0.9): number {
  if (typeof w === 'number' && w > 0) return w;
  if (typeof w === 'string') {
    const pct = w.trim().match(/^(\d+(?:\.\d+)?)%$/);
    if (pct) return (parseFloat(pct[1]) / 100) * slideWidthIn;
    const n = parseFloat(w);
    if (!isNaN(n) && n > 0) return n;
  }
  return fallbackIn;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

/** Decode the common named and all numeric HTML entities, without a DOM. */
function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? m;
  });
}

/**
 * Plain text of an HTML snippet: tags removed, entities decoded.
 * Deliberately string-based: parsing via innerHTML would execute inline
 * event handlers (e.g. <img onerror>) from untrusted input. Only used to
 * estimate text height, so exact HTML parsing is not needed.
 */
export function plainText(html: unknown): string {
  if (html == null) return '';
  if (typeof html === 'object') {
    const t = (html as { text?: unknown }).text;
    return typeof t === 'string' ? plainText(t) : '';
  }
  const stripped = String(html).replace(/<[^>]*>/g, ' ');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

/**
 * Width of a string in "em" units: CJK / full-width characters are ~1em,
 * Latin letters and digits ~0.55em, spaces ~0.3em.
 */
export function textWidthEm(text: string): number {
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) || 0;
    if (ch === ' ') em += 0.3;
    else if (code >= 0x2e80) em += 1;
    else if ('mwMW@'.includes(ch)) em += 0.85;
    else if (/[A-Z]/.test(ch)) em += 0.65;
    else em += 0.55;
  }
  return em;
}

/** Number of wrapped lines `text` needs at `fontPt` in a box `widthIn` wide. */
export function estimateLines(text: string, fontPt: number, widthIn: number): number {
  const usablePt = Math.max(1, (widthIn - TEXT_INSET_X_IN) * 72);
  const paragraphs = text.split(/\n/);
  let lines = 0;
  for (const p of paragraphs) {
    const widthPt = textWidthEm(p) * fontPt;
    lines += Math.max(1, Math.ceil(widthPt / usablePt));
  }
  return lines;
}

/** Height of one rendered line at `fontPt`, inches. */
export function lineHeightIn(fontPt: number): number {
  return (fontPt * LINE_HEIGHT_FACTOR) / 72;
}

/** Estimated box height for a block of text, inches. */
export function estimateTextHeightIn(text: string, fontPt: number, widthIn: number): number {
  return estimateLines(text, fontPt, widthIn) * lineHeightIn(fontPt) + TEXT_INSET_Y_IN;
}

/**
 * Largest font size (stepping down 1pt, not below MIN_FONT_PT) at which `text`
 * fits in `maxHeightIn`. Returns MIN_FONT_PT when nothing fits.
 */
export function fitFontSize(text: string, fontPt: number, widthIn: number, maxHeightIn: number): number {
  let size = fontPt;
  while (size > MIN_FONT_PT && estimateTextHeightIn(text, size, widthIn) > maxHeightIn) size -= 1;
  return size;
}

/** Bullet indent pptxgenjs adds in front of each list item, inches. */
export const LIST_INDENT_IN = 0.4;

/** Estimated height of each list item (one bullet paragraph), inches. */
export function estimateListItemHeightsIn(items: unknown[], fontPt: number, widthIn: number): number[] {
  const itemWidth = Math.max(0.5, widthIn - LIST_INDENT_IN);
  return items.map((item) => estimateLines(plainText(item) || ' ', fontPt, itemWidth) * lineHeightIn(fontPt));
}

/** Estimated height of a whole list block, inches. */
export function estimateListHeightIn(items: unknown[], fontPt: number, widthIn: number): number {
  return estimateListItemHeightsIn(items, fontPt, widthIn).reduce((a, b) => a + b, 0) + TEXT_INSET_Y_IN;
}

/** Estimated height of each table row, inches (tallest wrapped cell in the row). */
export function estimateTableRowHeightsIn(rows: unknown[][], widthIn: number, fontPt = 14): number[] {
  return rows.map((row) => {
    const cols = Math.max(1, row.length);
    const cellWidth = widthIn / cols;
    const tallest = Math.max(1, ...row.map((cell) => estimateLines(plainText(cell) || ' ', fontPt, cellWidth)));
    return tallest * lineHeightIn(fontPt) + 0.12;
  });
}

/**
 * Font size the semantic generator renders a text resource at. Shared with
 * PptxGenerator.addTextElement so the estimate matches what is drawn.
 */
export function textResourceFontPt(format: { headingLevel?: number; fontSize?: string } | undefined): number {
  if (format?.headingLevel) {
    switch (format.headingLevel) {
      case 1:
        return 24;
      case 2:
        return 20;
      case 3:
        return 18;
      default:
        return 16;
    }
  }
  const m = format?.fontSize?.match(/(\d+)/);
  if (m && m[1]) return parseInt(m[1], 10);
  return 18;
}
