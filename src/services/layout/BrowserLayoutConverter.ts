import { layoutRuntime } from './LayoutExtractor';
import type { LayoutDeck, LayoutExtractOptions, LayoutRaster } from './LayoutModel';
import { LayoutPptxGenerator, type LayoutPptxOptions } from './LayoutPptxGenerator';

export interface BrowserLayoutOptions extends LayoutExtractOptions, LayoutPptxOptions {
  /** Viewport the HTML is rendered at, in CSS px. Default 1920 x 1080. */
  viewportWidth?: number;
  viewportHeight?: number;
  /** Extra settle time after load, ms. Default 500. */
  settleMs?: number;
  /** Abort if the document has not loaded by then, ms. Default 20000. */
  timeoutMs?: number;
}

export interface LayoutConversionResult {
  blob: Blob;
  deck: LayoutDeck;
}

/**
 * Layout-mode conversion inside the web app.
 *
 * The HTML is rendered in an off-screen iframe at slide size, measured with
 * the same runtime the CLI uses, and turned into a PPTX. Differences from the
 * CLI: there is no screenshot API in a page, so <img> is copied through a
 * canvas, <svg> is embedded as SVG, and gradient / url() backgrounds fall back
 * to their first solid colour.
 */
export async function convertHtmlByLayout(html: string, options: BrowserLayoutOptions = {}): Promise<LayoutConversionResult> {
  if (typeof document === 'undefined') throw new Error('Layout mode needs a browser DOM; use scripts/html-to-pptx-layout.ts in Node');
  const width = options.viewportWidth ?? 1920;
  const height = options.viewportHeight ?? 1080;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
  iframe.style.cssText = `position:fixed;left:-${width + 100}px;top:0;width:${width}px;height:${height}px;border:0;visibility:hidden;pointer-events:none;`;
  document.body.appendChild(iframe);
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timed out rendering HTML for layout conversion')), options.timeoutMs ?? 20000);
      iframe.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      iframe.srcdoc = html;
    });
    const doc = iframe.contentDocument;
    if (!doc) throw new Error('Cannot access the rendering frame');
    await (doc as Document & { fonts?: FontFaceSet }).fonts?.ready;
    await new Promise((r) => setTimeout(r, options.settleMs ?? 500));

    const deck = layoutRuntime({ options, action: { type: 'extract' } }, doc) as LayoutDeck;
    for (const slide of deck.slides) {
      for (const item of slide.items) {
        if (item.kind === 'raster') item.src = rasterInPage(doc, item);
      }
    }
    const blob = await new LayoutPptxGenerator(options).toBlob(deck);
    return { blob, deck };
  } finally {
    iframe.remove();
  }
}

function rasterInPage(doc: Document, r: LayoutRaster): string | undefined {
  if (r.mode !== 'element') return undefined; // backgrounds use fallbackFill
  const el = doc.querySelector(`[data-h2p-id="${r.id}"]`);
  if (!el) return undefined;
  try {
    if (el.tagName.toLowerCase() === 'svg') {
      const clone = el.cloneNode(true) as SVGElement;
      if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', String(r.w));
      clone.setAttribute('height', String(r.h));
      return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
    }
    if (el instanceof (doc.defaultView as Window & typeof globalThis).HTMLCanvasElement) {
      return (el as HTMLCanvasElement).toDataURL('image/png');
    }
    if (el.tagName.toLowerCase() === 'img') {
      const img = el as HTMLImageElement;
      if (!img.complete || !img.naturalWidth) return undefined;
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = Math.round(r.w * scale);
      canvas.height = Math.round(r.h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png'); // throws for cross-origin images without CORS
    }
  } catch {
    return undefined;
  }
  return undefined;
}
