// @vitest-environment node
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { LayoutPptxGenerator } from '../../src/services/layout/LayoutPptxGenerator';
import type { LayoutDeck, LayoutTextRun } from '../../src/services/layout/LayoutModel';

const run = (text: string, extra: Partial<LayoutTextRun> = {}): LayoutTextRun => ({
  text, fontFamily: 'Source Serif 4', fontSizePx: 40, bold: false, italic: false, underline: false, strike: false,
  color: { hex: 'C9A86A', alpha: 1 }, letterSpacingPx: 0, ...extra,
});

const deck: LayoutDeck = {
  widthPx: 1920,
  heightPx: 1080,
  warnings: [],
  slides: [{
    index: 0, widthPx: 1920, heightPx: 1080, background: { hex: '1B2340', alpha: 1 },
    items: [
      { kind: 'box', z: 0, x: 96, y: 96, w: 480, h: 240, fill: { hex: 'FFFFFF', alpha: 0.5 }, radiusPx: 12 },
      { kind: 'line', z: 0, x1: 144, y1: 200, x2: 1776, y2: 200, stroke: { color: { hex: '2E3D5C', alpha: 1 }, widthPx: 2, dash: 'solid' } },
      {
        kind: 'text', z: 1, x: 144, y: 300, w: 900, h: 120, align: 'left', lineHeightPx: 60, wrap: false,
        lines: [[run('REA：'), run('Agent', { bold: true })], [run('时代的逆向工程', { fontFamily: 'Noto Serif SC', href: 'https://example.com/' })]],
      },
    ],
  }],
};

async function slideXml(d: LayoutDeck, opts = {}) {
  const buf = await new LayoutPptxGenerator(opts).toBuffer(d);
  const zip = await JSZip.loadAsync(buf);
  return {
    slide: await zip.file('ppt/slides/slide1.xml')!.async('string'),
    pres: await zip.file('ppt/presentation.xml')!.async('string'),
  };
}

describe('LayoutPptxGenerator', () => {
  it('sizes the slide from the deck aspect ratio', async () => {
    const { pres } = await slideXml(deck);
    // 13.333in x 7.5in in EMU
    expect(pres).toMatch(/<p:sldSz cx="1219169\d" cy="685800\d"/);
  });

  it('places shapes at scaled positions with fill transparency and rounded corners', async () => {
    const { slide } = await slideXml(deck);
    // 96px of 1920px on a 13.333in slide = 0.6667in = 609585 EMU (+/- rounding)
    expect(slide).toMatch(/<a:off x="6095\d\d" y="6095\d\d"\/>/);
    expect(slide).toContain('prst="roundRect"');
    expect(slide).toContain('<a:alpha val="50000"/>');
    expect(slide).toContain('prst="line"');
    expect(slide).toContain('<a:srgbClr val="1B2340"/>');
  });

  it('keeps browser line breaks, run styles, fonts and links in one text box', async () => {
    const { slide } = await slideXml(deck);
    expect(slide).toContain('REA：');
    expect(slide).toContain('时代的逆向工程');
    expect(slide.match(/<a:p>/g)?.length).toBeGreaterThanOrEqual(2);
    expect(slide).toMatch(/<a:rPr[^>]* b="1"[^>]*>/);
    expect(slide).toContain('typeface="Noto Serif SC"');
    expect(slide).toContain('hlinkClick');
    expect(slide).toContain('wrap="none"');
    // 40px on a 1920px slide = 20pt
    expect(slide).toContain('sz="2000"');
  });

  it('applies the font map', async () => {
    const { slide } = await slideXml(deck, { fontMap: { 'Source Serif 4': 'Georgia' } });
    expect(slide).toContain('typeface="Georgia"');
    expect(slide).not.toContain('typeface="Source Serif 4"');
  });

  it('rejects an empty deck', () => {
    expect(() => new LayoutPptxGenerator().build({ widthPx: 0, heightPx: 0, slides: [], warnings: [] })).toThrow();
  });
});
