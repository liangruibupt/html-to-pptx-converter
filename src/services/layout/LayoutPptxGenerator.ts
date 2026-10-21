import PptxGenJS from 'pptxgenjs';
import type { LayoutColor, LayoutDeck, LayoutItem, LayoutSlide, LayoutStroke, LayoutText } from './LayoutModel';

export interface LayoutPptxOptions {
  /** Slide width in inches. Height follows the deck's aspect ratio. Default 13.333 (16:9 widescreen). */
  slideWidthIn?: number;
  /** Replace font names, e.g. { 'Source Serif 4': 'Georgia' }. Applied after the HTML font stack is resolved. */
  fontMap?: Record<string, string>;
  title?: string;
  author?: string;
}

/** Converts a measured LayoutDeck into a PptxGenJS presentation with native, editable objects. */
export class LayoutPptxGenerator {
  private readonly options: Required<Pick<LayoutPptxOptions, 'slideWidthIn'>> & LayoutPptxOptions;

  constructor(options: LayoutPptxOptions = {}) {
    this.options = { slideWidthIn: 13.333, ...options };
  }

  build(deck: LayoutDeck): PptxGenJS {
    if (!deck.slides.length || deck.widthPx <= 0 || deck.heightPx <= 0) {
      throw new Error('Layout deck has no measurable slides');
    }
    const pptx = new PptxGenJS();
    const wIn = this.options.slideWidthIn;
    const hIn = +(wIn * (deck.heightPx / deck.widthPx)).toFixed(3);
    pptx.defineLayout({ name: 'H2P_LAYOUT', width: wIn, height: hIn });
    pptx.layout = 'H2P_LAYOUT';
    if (this.options.title) pptx.title = this.options.title;
    if (this.options.author) pptx.author = this.options.author;

    for (const s of deck.slides) this.addSlide(pptx, s, wIn / s.widthPx);
    return pptx;
  }

  /** inches per CSS px → helpers */
  private addSlide(pptx: PptxGenJS, s: LayoutSlide, inPerPx: number) {
    const slide = pptx.addSlide();
    slide.background = { color: s.background.hex };
    const ptPerPx = inPerPx * 72;
    for (const item of s.items) this.addItem(slide, item, inPerPx, ptPerPx);
  }

  private addItem(slide: PptxGenJS.Slide, item: LayoutItem, k: number, ptk: number) {
    switch (item.kind) {
      case 'box': {
        const radius = Math.min(item.radiusPx, item.w / 2, item.h / 2);
        const shapeOpts: PptxGenJS.ShapeProps = {
          x: item.x * k, y: item.y * k, w: item.w * k, h: item.h * k,
          fill: item.fill ? colorFill(item.fill) : { type: 'none' } as PptxGenJS.ShapeFillProps,
          line: item.stroke ? strokeLine(item.stroke, ptk) : { type: 'none' } as PptxGenJS.ShapeLineProps,
        };
        if (radius >= 1) shapeOpts.rectRadius = radius * k;
        slide.addShape(radius >= 1 ? 'roundRect' : 'rect', shapeOpts);
        return;
      }
      case 'line': {
        const x = Math.min(item.x1, item.x2);
        const y = Math.min(item.y1, item.y2);
        const w = Math.abs(item.x2 - item.x1);
        const h = Math.abs(item.y2 - item.y1);
        slide.addShape('line', { x: x * k, y: y * k, w: w * k, h: h * k, line: strokeLine(item.stroke, ptk) });
        return;
      }
      case 'raster': {
        if (item.src) {
          slide.addImage({ data: item.src, x: item.x * k, y: item.y * k, w: item.w * k, h: item.h * k });
        } else if (item.fallbackFill) {
          slide.addShape('rect', {
            x: item.x * k, y: item.y * k, w: item.w * k, h: item.h * k,
            fill: colorFill(item.fallbackFill), line: { type: 'none' } as PptxGenJS.ShapeLineProps,
          });
        }
        return;
      }
      case 'text':
        this.addText(slide, item, k, ptk);
        return;
    }
  }

  private font(name: string) {
    return this.options.fontMap?.[name] ?? name;
  }

  private addText(slide: PptxGenJS.Slide, t: LayoutText, k: number, ptk: number) {
    const runs: PptxGenJS.TextProps[] = [];
    t.lines.forEach((line, li) => {
      line.forEach((r, ri) => {
        const opts: PptxGenJS.TextPropsOptions = {
          fontFace: this.font(r.fontFamily),
          fontSize: round2(r.fontSizePx * ptk),
          bold: r.bold,
          italic: r.italic,
          color: r.color.hex,
        };
        if (r.color.alpha < 0.99) opts.transparency = Math.round((1 - r.color.alpha) * 100);
        if (r.underline) opts.underline = { style: 'sng' };
        if (r.strike) opts.strike = 'sngStrike';
        if (r.letterSpacingPx) opts.charSpacing = round2(r.letterSpacingPx * ptk);
        if (r.href) opts.hyperlink = { url: r.href };
        if (ri === line.length - 1 && li < t.lines.length - 1) opts.breakLine = true;
        runs.push({ text: r.text, options: opts });
      });
    });
    if (!runs.length) return;
    slide.addText(runs, {
      x: t.x * k, y: t.y * k, w: t.w * k, h: t.h * k,
      margin: 0,
      align: t.align,
      valign: 'top',
      wrap: t.wrap,
      fit: 'none',
      lineSpacing: round2(t.lineHeightPx * ptk),
      paraSpaceBefore: 0,
      paraSpaceAfter: 0,
    });
  }

  async toBlob(deck: LayoutDeck): Promise<Blob> {
    return (await this.build(deck).write({ outputType: 'blob' })) as Blob;
  }

  async toBuffer(deck: LayoutDeck): Promise<Uint8Array> {
    const out = await this.build(deck).write({ outputType: 'nodebuffer' });
    return out as Uint8Array;
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function colorFill(c: LayoutColor): PptxGenJS.ShapeFillProps {
  const f: PptxGenJS.ShapeFillProps = { type: 'solid', color: c.hex };
  if (c.alpha < 0.99) f.transparency = Math.round((1 - c.alpha) * 100);
  return f;
}

function strokeLine(s: LayoutStroke, ptk: number): PptxGenJS.ShapeLineProps {
  const l: PptxGenJS.ShapeLineProps = { color: s.color.hex, width: Math.max(0.25, round2(s.widthPx * ptk)), dashType: s.dash };
  if (s.color.alpha < 0.99) l.transparency = Math.round((1 - s.color.alpha) * 100);
  return l;
}
