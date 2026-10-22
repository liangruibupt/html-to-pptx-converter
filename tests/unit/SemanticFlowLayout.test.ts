import { describe, it, expect } from 'vitest';
import { HTMLParser } from '../../src/services/parser/HTMLParser';
import { SlideCreator } from '../../src/services/conversion/SlideCreator';
import { PptxGenerator } from '../../src/services/pptx/PptxGenerator';
import { ImageHandler } from '../../src/services/conversion/ImageHandler';
import { TableHandler } from '../../src/services/conversion/TableHandler';
import { ListHandler } from '../../src/services/conversion/ListHandler';
import { LinkHandler } from '../../src/services/conversion/LinkHandler';
import { ThemeHandler } from '../../src/services/conversion/ThemeHandler';
import {
  estimateLines,
  estimateTextHeightIn,
  fitFontSize,
  plainText,
  resolveWidthIn,
  slideSizeFor,
  MIN_FONT_PT
} from '../../src/services/conversion/SemanticFlowLayout';
import { ConversionConfig, PresentationTheme, SlideLayout, SplitStrategy } from '../../src/models';

// Semantic mode used to place every element of a section at the same fixed
// offset, so a heading, a paragraph and a list rendered on top of each other.
// These tests drive the real parser + slide creator and record where each box
// lands on which slide.

type Box = { slide: number; kind: string; y: number; h: number; text: string; opts: any };

const recordingGenerator = () => {
  const boxes: Box[] = [];
  const titles: string[] = [];
  let slideCount = 0;
  const textOf = (c: any) => (typeof c === 'string' ? c : c?.content ?? c?.text ?? '');
  const gen: any = {
    initialize: async () => {},
    createPresentation: () => ({ layout: 'LAYOUT_16x9', defineSlideMaster: () => {} }),
    applyTheme: () => {},
    addSlide: (_p: any, title: string) => {
      titles.push(title);
      return { index: slideCount++ };
    },
    addTextElement: (s: any, t: any, o: any) => boxes.push({ slide: s.index, kind: 'text', y: o.y, h: o.h, text: textOf(t), opts: o }),
    addListElement: (s: any, l: any, o: any) => boxes.push({ slide: s.index, kind: 'list', y: o.y, h: o.h, text: l.items.join('|'), opts: o }),
    addTableElement: (s: any, t: any, o: any) => boxes.push({ slide: s.index, kind: 'table', y: o.y, h: NaN, text: String(t._formattedData?.length), opts: o }),
    addImageElement: (s: any, _i: any, o: any) => boxes.push({ slide: s.index, kind: 'image', y: o.y, h: o.h, text: '', opts: o }),
    addLinkElement: (s: any, l: any, o: any) => boxes.push({ slide: s.index, kind: 'link', y: o.y, h: o.h, text: l.text, opts: o }),
    savePresentation: async () => new Blob()
  };
  return { gen, boxes, titles };
};

const config: ConversionConfig = {
  slideLayout: SlideLayout.WIDE,
  includeImages: true,
  theme: PresentationTheme.DEFAULT,
  splitSections: SplitStrategy.BY_H1,
  preserveLinks: true,
  customStyles: {}
};

const convert = async (html: string) => {
  const { gen, boxes, titles } = recordingGenerator();
  const creator = new SlideCreator(gen, new ImageHandler(), new TableHandler(), new ListHandler(), new LinkHandler(), new ThemeHandler());
  const parsed = new HTMLParser().parseHTML(html, SplitStrategy.BY_H1);
  await creator.createSlides(parsed, config);
  return { boxes, titles };
};

const SLIDE_BOTTOM = slideSizeFor('LAYOUT_16x9').h;

describe('SemanticFlowLayout estimates', () => {
  it('resolves percentage and absolute widths', () => {
    expect(resolveWidthIn('90%', 10)).toBeCloseTo(9);
    expect(resolveWidthIn(4, 10)).toBe(4);
  });

  it('wraps long text and counts CJK characters as full width', () => {
    expect(estimateLines('short', 18, 9)).toBe(1);
    expect(estimateLines('word '.repeat(200), 18, 9)).toBeGreaterThan(5);
    // 60 CJK characters at 18pt need ~1080pt, more than one 9in (630pt) line
    expect(estimateLines('逆'.repeat(60), 18, 9)).toBe(2);
  });

  it('shrinks the font until the text fits, but not below the minimum', () => {
    const text = 'lorem ipsum '.repeat(80);
    const size = fitFontSize(text, 18, 9, 2);
    expect(size).toBeLessThan(18);
    expect(estimateTextHeightIn(text, size, 9)).toBeLessThanOrEqual(2);
    expect(fitFontSize(text.repeat(50), 18, 9, 0.5)).toBe(MIN_FONT_PT);
  });

  it('extracts plain text without parsing the HTML in the DOM', () => {
    expect(plainText('<b>A&amp;B</b> &lt;tag&gt; &#26085;&#x672C;')).toBe('A&B <tag> 日本');
    expect(plainText({ text: '<i>x</i>  y' })).toBe('x y');
    // innerHTML would fire this handler; a string-based strip never does
    (globalThis as { __pwned?: boolean }).__pwned = false;
    expect(plainText('<img src=x onerror="globalThis.__pwned=true">ok')).toBe('ok');
    expect((globalThis as { __pwned?: boolean }).__pwned).toBe(false);
  });
});

describe('semantic mode flow layout', () => {
  it('keeps elements in document order without the duplicated title or nested copies', async () => {
    const { boxes, titles } = await convert(
      '<h1>Overview</h1><p>First <strong>bold</strong> paragraph</p><ul><li>One <a href="https://x.test">link</a></li><li>Two</li></ul><p>Last paragraph</p>'
    );
    expect(titles).toEqual(['Overview']);
    expect(boxes.map((b) => b.kind)).toEqual(['text', 'list', 'text']);
    expect(boxes[0].text).toContain('First');
    expect(boxes[2].text).toContain('Last');
  });

  it('stacks boxes top to bottom without overlap', async () => {
    const { boxes } = await convert(
      '<h1>Stack</h1><p>Intro paragraph</p><h2>Subheading</h2><p>Body text that is a little longer than the intro.</p><ol><li>a</li><li>b</li><li>c</li></ol>'
    );
    expect(boxes.length).toBe(4);
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].slide).toBe(0);
      expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].h);
    }
    for (const b of boxes) expect(b.y + b.h).toBeLessThanOrEqual(SLIDE_BOTTOM);
    expect(boxes[0].y).toBeGreaterThanOrEqual(1.5); // below the title box
  });

  it('continues a full section on a "(cont.)" slide and keeps list numbering', async () => {
    const items = Array.from({ length: 30 }, (_, i) => `<li>Item ${i + 1}</li>`).join('');
    const { boxes, titles } = await convert(`<h1>Long</h1><p>Intro</p><ol>${items}</ol><p>After</p>`);
    expect(titles.length).toBeGreaterThan(1);
    expect(titles.slice(1).every((t) => t === 'Long (cont.)')).toBe(true);

    const lists = boxes.filter((b) => b.kind === 'list');
    expect(lists.length).toBeGreaterThan(1);
    const allItems = lists.flatMap((l) => l.text.split('|'));
    expect(allItems).toEqual(Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`));
    // the second part starts numbering where the first stopped
    const firstCount = lists[0].text.split('|').length;
    expect(lists[1].opts.bullet.startAt).toBe(1 + firstCount);

    for (const b of boxes) expect(b.y + b.h).toBeLessThanOrEqual(SLIDE_BOTTOM);
    expect(boxes[boxes.length - 1].text).toContain('After');
  });

  it('splits a long table across slides and repeats the header row', async () => {
    const rows = Array.from({ length: 25 }, (_, i) => `<tr><td>r${i}</td><td>v${i}</td></tr>`).join('');
    const { boxes } = await convert(`<h1>Table</h1><table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody>${rows}</tbody></table>`);
    const tables = boxes.filter((b) => b.kind === 'table');
    expect(tables.length).toBeGreaterThan(1);
    // each part carries the header row on top of its body rows
    const bodyRows = tables.reduce((n, t) => n + Number(t.text) - 1, 0);
    expect(bodyRows).toBe(25);
    expect(new Set(tables.map((t) => t.slide)).size).toBe(tables.length);
  });

  it('shrinks a single text block too tall for an empty slide', async () => {
    const { boxes, titles } = await convert(`<h1>Wall</h1><p>${'very long text '.repeat(400)}</p>`);
    expect(titles).toEqual(['Wall']);
    expect(boxes.length).toBe(1);
    expect(boxes[0].opts.fontSize).toBeLessThan(18);
    expect(boxes[0].y + boxes[0].h).toBeLessThanOrEqual(SLIDE_BOTTOM);
  });
});

describe('PptxGenerator list bullets', () => {
  // pptxgenjs applies a box-level bullet to the first paragraph only, so items
  // 2..n used to render without a bullet; LibreOffice also restarts numbering
  // on each paragraph unless it carries its own startAt.
  it('puts the bullet on every item and numbers items individually', () => {
    const calls: any[] = [];
    const slide = { addText: (runs: any, opts: any) => calls.push({ runs, opts }) };
    const gen = new PptxGenerator();
    gen.addListElement(slide, { items: ['a', 'b'], ordered: false });
    gen.addListElement(slide, { items: ['x', 'y', 'z'], ordered: true, style: { start: '4' } });
    expect(calls[0].runs.map((r: any) => r.options.bullet)).toEqual([
      { type: 'bullet', code: '•' },
      { type: 'bullet', code: '•' }
    ]);
    expect(calls[1].runs.map((r: any) => r.options.bullet.startAt)).toEqual([4, 5, 6]);
  });
});
