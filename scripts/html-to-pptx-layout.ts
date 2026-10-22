#!/usr/bin/env node
/**
 * Layout-mode HTML -> PPTX converter (command line).
 *
 * Renders the HTML deck in headless Chromium, measures where every box, text
 * line and image landed, and rebuilds each slide from native PowerPoint shapes
 * and editable text boxes at the same positions.
 *
 *   node scripts/html-to-pptx-layout.ts deck.html -o deck.pptx
 *
 * Requires Node >= 22.18 (runs the TypeScript sources directly) and a Chromium
 * that Playwright can launch (`npx playwright install chromium`, or --chrome).
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { layoutRuntime } from '../src/services/layout/LayoutExtractor.ts';
import { LayoutPptxGenerator } from '../src/services/layout/LayoutPptxGenerator.ts';
import type { LayoutDeck, LayoutExtractOptions, LayoutRaster } from '../src/services/layout/LayoutModel.ts';
import type { ShowResult } from '../src/services/layout/LayoutExtractor.ts';

const USAGE = `usage: html-to-pptx-layout <input.html|url> [-o out.pptx] [options]

  -o, --output <file>        output .pptx (default: input name + .pptx)
      --width <px>           viewport / slide width in CSS px (default 1920)
      --height <px>          viewport / slide height in CSS px (default 1080)
      --slide-selector <css> selector for slide roots (default: auto)
      --active-class <name>  class marking the visible slide (default: auto; "none" disables)
      --font-map <map>       rename fonts: "Source Serif 4=Georgia;DM Sans=Arial"
      --wait <ms>            extra settle time after load (default 800)
      --scale <n>            raster pixel density (default 2)
      --reflow               let PowerPoint wrap text instead of keeping the browser's line breaks
      --chrome <path>        Chromium executable (default: Playwright's)
      --dump <file.json>     also write the measured layout as JSON
  -h, --help`;

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: 'string', short: 'o' },
      width: { type: 'string', default: '1920' },
      height: { type: 'string', default: '1080' },
      'slide-selector': { type: 'string' },
      'active-class': { type: 'string' },
      'font-map': { type: 'string' },
      wait: { type: 'string', default: '800' },
      scale: { type: 'string', default: '2' },
      reflow: { type: 'boolean', default: false },
      chrome: { type: 'string' },
      dump: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help || positionals.length !== 1) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 2);
  }

  const input = positionals[0];
  const url = /^(https?|file):/.test(input) ? input : pathToFileURL(resolve(input)).href;
  const output = resolve(values.output || input.replace(/\.(html?|xhtml)$/i, '') + '.pptx');
  const width = Number(values.width);
  const height = Number(values.height);
  const scale = Number(values.scale);
  if (!(width > 0 && height > 0 && scale > 0)) throw new Error('--width, --height and --scale must be positive numbers');

  const extractOptions: LayoutExtractOptions = {
    slideSelector: values['slide-selector'],
    activeClass: values['active-class'] === 'none' ? null : values['active-class'],
    preserveLineBreaks: !values.reflow,
  };
  const fontMap = parseFontMap(values['font-map']);

  const browser = await chromium.launch({ executablePath: values.chrome || process.env.CHROME_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(async () => {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
    });
    await page.waitForTimeout(Number(values.wait));

    const t0 = Date.now();
    const deck = (await page.evaluate(layoutRuntime, { options: extractOptions, action: { type: 'extract' } })) as LayoutDeck;
    const counts = { box: 0, line: 0, text: 0, raster: 0 };
    deck.slides.forEach((s) => s.items.forEach((i) => counts[i.kind]++));
    console.log(`measured ${deck.slides.length} slides (${deck.widthPx}x${deck.heightPx}px) in ${Date.now() - t0} ms: ` +
      `${counts.text} text boxes, ${counts.box} shapes, ${counts.line} lines, ${counts.raster} rasters`);

    // Rasterise what cannot be native: one screenshot per region, everything else hidden.
    for (const slide of deck.slides) {
      const rasters = slide.items.filter((i): i is LayoutRaster => i.kind === 'raster');
      for (const r of rasters) {
        const shown = (await page.evaluate(layoutRuntime, {
          options: extractOptions,
          action: { type: 'show', slide: slide.index, soloId: r.id, soloMode: r.mode },
        })) as ShowResult;
        const clip = clampClip({ x: shown.x + r.x, y: shown.y + r.y, width: r.w, height: r.h }, width, height);
        if (!clip) continue;
        const png = await page.screenshot({ clip, omitBackground: true, animations: 'disabled' });
        r.src = 'data:image/png;base64,' + png.toString('base64');
        // Keep the clipped geometry so the image is not stretched.
        r.x = clip.x - shown.x;
        r.y = clip.y - shown.y;
        r.w = clip.width;
        r.h = clip.height;
      }
    }
    await page.evaluate(layoutRuntime, { options: extractOptions, action: { type: 'reset' } });

    for (const w of deck.warnings) console.log(`note: ${w}`);
    if (values.dump) {
      await writeFile(resolve(values.dump), JSON.stringify(deck, (k, v) => (k === 'src' ? `[${String(v).length} chars]` : v), 1));
    }

    const gen = new LayoutPptxGenerator({ fontMap, title: await page.title() });
    await writeFile(output, await gen.toBuffer(deck));
    console.log(`wrote ${output}`);
  } finally {
    await browser.close();
  }
}

function parseFontMap(spec?: string): Record<string, string> | undefined {
  if (!spec) return undefined;
  const map: Record<string, string> = {};
  for (const pair of spec.split(';')) {
    const [from, to] = pair.split('=').map((s) => s.trim());
    if (from && to) map[from] = to;
  }
  return map;
}

function clampClip(c: { x: number; y: number; width: number; height: number }, vw: number, vh: number) {
  const x = Math.max(0, c.x);
  const y = Math.max(0, c.y);
  const w = Math.min(vw, c.x + c.width) - x;
  const h = Math.min(vh, c.y + c.height) - y;
  return w >= 1 && h >= 1 ? { x, y, width: w, height: h } : null;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
