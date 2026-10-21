// @vitest-environment node
/**
 * Runs the layout extractor in real Chromium (layout needs a rendering
 * engine; jsdom has none). Skipped when Playwright cannot launch a browser.
 * Set CHROME_PATH to use a specific Chromium build.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser } from '@playwright/test';
import { layoutRuntime } from '../../src/services/layout/LayoutExtractor';
import type { LayoutDeck, LayoutText } from '../../src/services/layout/LayoutModel';

const FIXTURE = `<!doctype html><html><head><style>
  html, body { margin: 0; }
  .slide { width: 960px; height: 540px; position: absolute; inset: 0; padding: 40px; box-sizing: border-box;
           background: rgb(27, 35, 64); color: rgb(240, 236, 228); font: 20px/30px sans-serif; visibility: hidden; }
  .slide.is-active { visibility: visible; }
  [data-anim] { opacity: 0; }
  .slide.is-active [data-anim] { animation: in 2s forwards; }
  @keyframes in { to { opacity: 1; } }
  h1 { margin: 0 0 20px; font-size: 40px; line-height: 48px; }
  em { color: rgb(201, 168, 106); font-style: normal; }
  .card { border: 2px solid rgb(46, 61, 92); border-radius: 8px; padding: 10px; width: 300px; }
  .rule { border-top: 1px solid rgb(46, 61, 92); }
  ul { list-style: none; padding: 0; margin: 0; }
  li::before { content: "\\2014"; margin-right: 8px; color: rgb(201, 168, 106); }
  .grid::before { content: ""; position: absolute; inset: 0; background-image: linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px); }
</style></head><body>
  <section class="slide is-active grid"><h1 data-anim>Hello <em>layout</em></h1>
    <div class="card">A long sentence that has to wrap onto more than one line inside the card.</div>
    <div class="rule"></div><ul><li>first point</li></ul></section>
  <section class="slide"><p>Second <a href="https://example.com/">slide</a></p></section>
</body></html>`;

let browser: Browser | null = null;

beforeAll(async () => {
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  } catch {
    browser = null;
  }
});

afterAll(async () => {
  await browser?.close();
});

describe('layoutRuntime in Chromium', () => {
  it('measures slides, text lines, borders, pseudo-elements and links', async (ctx) => {
    if (!browser) ctx.skip();
    const page = await browser!.newPage({ viewport: { width: 960, height: 540 } });
    await page.setContent(FIXTURE);
    const deck = (await page.evaluate(layoutRuntime, { options: {}, action: { type: 'extract' } })) as LayoutDeck;

    expect(deck.slides).toHaveLength(2);
    expect(deck.widthPx).toBe(960);
    const [s1, s2] = deck.slides;
    expect(s1.background.hex).toBe('1B2340');

    const texts = s1.items.filter((i): i is LayoutText => i.kind === 'text');
    const title = texts.find((t) => t.lines.flat().some((r) => r.text.includes('Hello')))!;
    // The animated title was finished, so it is visible, and the accent run keeps its colour.
    expect(title).toBeTruthy();
    expect(title.lines.flat().find((r) => r.text === 'layout')?.color.hex).toBe('C9A86A');
    expect(title.lines.flat()[0].fontSizePx).toBe(40);

    const card = texts.find((t) => t.lines.flat().some((r) => r.text.includes('sentence')))!;
    expect(card.lines.length).toBeGreaterThan(1);
    expect(card.wrap).toBe(false);

    // Uniform border -> stroked rounded box; single side -> line.
    expect(s1.items.some((i) => i.kind === 'box' && i.stroke?.color.hex === '2E3D5C' && i.radiusPx === 8)).toBe(true);
    expect(s1.items.some((i) => i.kind === 'line')).toBe(true);
    // Text pseudo-element becomes text; gradient pseudo-element becomes a raster.
    expect(texts.some((t) => t.lines.flat().some((r) => r.text === '—'))).toBe(true);
    expect(s1.items.some((i) => i.kind === 'raster' && i.mode === 'before')).toBe(true);

    const link = s2.items.flatMap((i) => (i.kind === 'text' ? i.lines.flat() : [])).find((r) => r.href);
    expect(link?.href).toBe('https://example.com/');

    // The page is restored afterwards: original active slide, no helper spans.
    const restored = await page.evaluate(() => ({
      active: document.querySelectorAll('.slide.is-active').length,
      helpers: document.querySelectorAll('[data-h2p-materialized]').length,
    }));
    expect(restored.helpers).toBe(0);
    expect(restored.active).toBe(1);
    await page.close();
  });
});
