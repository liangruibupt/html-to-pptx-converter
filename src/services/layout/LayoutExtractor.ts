import type {
  LayoutColor,
  LayoutDeck,
  LayoutExtractOptions,
  LayoutItem,
  LayoutRaster,
  LayoutSlide,
  LayoutStroke,
  LayoutText,
  LayoutTextRun,
} from './LayoutModel';

export type LayoutRuntimeAction =
  /** Measure every slide and return a LayoutDeck. */
  | { type: 'extract' }
  /**
   * Show one slide on screen for capture and return its viewport rect.
   * With soloId, hide everything except that element (mode 'element') or
   * everything except that element's own background (mode 'background').
   */
  | { type: 'show'; slide: number; soloId?: string; soloMode?: LayoutRaster['mode'] }
  /** Undo every change made by 'show' / 'extract'. */
  | { type: 'reset' };

export interface LayoutRuntimeInput {
  options: LayoutExtractOptions;
  action: LayoutRuntimeAction;
}

export interface ShowResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout extraction runtime.
 *
 * This function is deliberately SELF-CONTAINED (every helper is nested, no
 * imports are referenced at runtime) so that it can be shipped into a page as
 * source text with Playwright's `page.evaluate(layoutRuntime, input)`, and also
 * called directly against an iframe's document inside the web app.
 */
export function layoutRuntime(input: LayoutRuntimeInput, docArg?: Document): LayoutDeck | ShowResult | null {
  const doc: Document = docArg || document;
  const win = doc.defaultView as Window & typeof globalThis;
  const options = input.options || {};
  const STYLE_ID = 'h2p-layout-style';
  const ACTIVE_CANDIDATES = ['is-active', 'active', 'present', 'current', 'is-current', 'visible', 'is-visible'];
  const CJK_RE = /[\u1100-\u11FF\u2E80-\u2FDF\u3000-\u30FF\u3100-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFFEF]/;
  const CJK_FONT_RE = /(\bSC\b|\bTC\b|\bHK\b|\bJP\b|\bKR\b|CJK|Hei|Song|Kai|Ming|YaHei|Yahei|PingFang|Gothic|Mincho|Han Sans|Han Serif|雅黑|宋|黑|楷)/i;

  // ── Slide discovery ──────────────────────────────────────────────────────
  function findSlides(): HTMLElement[] {
    const selectors = options.slideSelector
      ? [options.slideSelector]
      : ['section.slide', '.slide', '.reveal .slides > section', '[data-slide]', 'body > section', 'section'];
    for (const sel of selectors) {
      let list = Array.from(doc.querySelectorAll<HTMLElement>(sel));
      list = list.filter((el) => !list.some((other) => other !== el && other.contains(el)));
      if (list.length) return list;
    }
    return [doc.body];
  }

  function detectActiveClass(slides: HTMLElement[]): string | null {
    if (options.activeClass === null) return null;
    if (options.activeClass) return options.activeClass;
    for (const c of ACTIVE_CANDIDATES) {
      if (slides.some((s) => s.classList.contains(c))) return c;
    }
    return slides.length > 1 ? 'is-active' : null;
  }

  function ensureStyle() {
    if (doc.getElementById(STYLE_ID)) return;
    const style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'html.h2p-capture *, html.h2p-capture *::before, html.h2p-capture *::after { transition: none !important; caret-color: transparent !important; }',
      'html.h2p-capture [data-h2p-hidden] { visibility: hidden !important; }',
      'html.h2p-capture [data-h2p-mat~="before"]::before, html.h2p-capture [data-h2p-mat~="after"]::after { display: none !important; }',
      'html.h2p-solo, html.h2p-solo body { background: transparent !important; }',
      // Hide everything (deck navigation, other slides, siblings); the rules below re-show the solo target.
      'html.h2p-solo body, html.h2p-solo body * { visibility: hidden !important; }',
      'html.h2p-solo [data-h2p-solo="element"], html.h2p-solo [data-h2p-solo="element"] * { visibility: visible !important; }',
      'html.h2p-solo [data-h2p-solo="background"] { visibility: visible !important; color: transparent !important; border-color: transparent !important; text-shadow: none !important; box-shadow: none !important; }',
      'html.h2p-solo [data-h2p-solo="background"]::before, html.h2p-solo [data-h2p-solo="background"]::after { visibility: hidden !important; }',
      'html.h2p-solo [data-h2p-solo="before"], html.h2p-solo [data-h2p-solo="after"] { visibility: visible !important; color: transparent !important; background: transparent !important; border-color: transparent !important; text-shadow: none !important; box-shadow: none !important; }',
      'html.h2p-solo [data-h2p-solo="before"]::after, html.h2p-solo [data-h2p-solo="after"]::before { visibility: hidden !important; }',
    ].join('\n');
    (doc.head || doc.documentElement).appendChild(style);
  }

  function finishAnimations() {
    const anyDoc = doc as Document & { getAnimations?: () => Animation[] };
    if (typeof anyDoc.getAnimations !== 'function') return;
    for (const a of anyDoc.getAnimations()) {
      try {
        a.finish();
      } catch {
        // Infinite animations cannot finish; freeze them at their start.
        try {
          a.pause();
          a.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    }
  }

  function activate(slides: HTMLElement[], index: number, activeClass: string | null) {
    ensureStyle();
    doc.documentElement.classList.add('h2p-capture');
    slides.forEach((s, i) => {
      if (activeClass) s.classList.toggle(activeClass, i === index);
    });
    void slides[index].offsetHeight; // flush style so CSS animations start
    finishAnimations();
    void slides[index].offsetHeight;
  }

  function resetAll() {
    const de = doc.documentElement;
    de.classList.remove('h2p-capture', 'h2p-solo');
    doc.querySelectorAll('[data-h2p-hidden]').forEach((e) => e.removeAttribute('data-h2p-hidden'));
    doc.querySelectorAll('[data-h2p-materialized]').forEach((e) => e.remove());
    doc.querySelectorAll('[data-h2p-mat]').forEach((e) => e.removeAttribute('data-h2p-mat'));
    doc.querySelectorAll('[data-h2p-scope]').forEach((e) => e.removeAttribute('data-h2p-scope'));
    doc.querySelectorAll('[data-h2p-solo]').forEach((e) => e.removeAttribute('data-h2p-solo'));
    doc.querySelectorAll<HTMLElement>('[data-h2p-shift]').forEach((e) => {
      e.style.transform = e.getAttribute('data-h2p-shift') || '';
      e.removeAttribute('data-h2p-shift');
    });
  }

  // ── Colour parsing ───────────────────────────────────────────────────────
  const colorCache = new Map<string, LayoutColor | null>();
  let probeCtx: CanvasRenderingContext2D | null = null;

  function parseColor(value: string, opacity: number): LayoutColor | null {
    let base = colorCache.get(value);
    if (base === undefined) {
      base = parseColorRaw(value);
      colorCache.set(value, base);
    }
    if (!base) return null;
    const alpha = base.alpha * opacity;
    return alpha < 0.01 ? null : { hex: base.hex, alpha };
  }

  function toHex(r: number, g: number, b: number) {
    return [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function parseColorRaw(value: string): LayoutColor | null {
    if (!value || value === 'transparent' || value === 'none') return null;
    const m = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (m) {
      let a = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      if (isNaN(a)) a = 1;
      return a <= 0 ? null : { hex: toHex(+m[1], +m[2], +m[3]), alpha: a };
    }
    // oklch(), color(), lab() ... : let the engine paint one pixel and read it back.
    try {
      if (!probeCtx) {
        const c = doc.createElement('canvas');
        c.width = c.height = 1;
        probeCtx = c.getContext('2d', { willReadFrequently: true } as CanvasRenderingContext2DSettings);
      }
      if (!probeCtx) return null;
      probeCtx.clearRect(0, 0, 1, 1);
      probeCtx.fillStyle = value;
      probeCtx.fillRect(0, 0, 1, 1);
      const d = probeCtx.getImageData(0, 0, 1, 1).data;
      if (d[3] === 0) return null;
      return { hex: toHex(d[0], d[1], d[2]), alpha: d[3] / 255 };
    } catch {
      return null;
    }
  }

  function firstGradientColor(bgImage: string, opacity: number): LayoutColor | undefined {
    const m = bgImage.match(/(rgba?\([^)]*\)|#[0-9a-f]{3,8}\b)/i);
    return (m && parseColor(m[1], opacity)) || undefined;
  }

  // ── Fonts ────────────────────────────────────────────────────────────────
  const familyCache = new Map<string, { primary: string; cjk: string }>();
  function families(stack: string) {
    let f = familyCache.get(stack);
    if (!f) {
      const names = stack.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      const generic = ['serif', 'sans-serif', 'monospace', 'system-ui', 'cursive', 'fantasy', 'ui-sans-serif', 'ui-serif', 'ui-monospace'];
      const real = names.filter((n) => !generic.includes(n.toLowerCase()));
      const primary = real[0] || (names[0] === 'monospace' ? 'Courier New' : names[0] === 'serif' ? 'Georgia' : 'Arial');
      const cjk = real.find((n) => CJK_FONT_RE.test(n)) || primary;
      f = { primary, cjk };
      familyCache.set(stack, f);
    }
    return f;
  }

  // ── Geometry helpers ─────────────────────────────────────────────────────
  let origin = { x: 0, y: 0 };
  function rel(r: DOMRect | { left: number; top: number; width: number; height: number }) {
    return { x: r.left - origin.x, y: r.top - origin.y, w: r.width, h: r.height };
  }
  const px = (v: string) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  };

  // ── Extraction state ─────────────────────────────────────────────────────
  let items: LayoutItem[] = [];
  let seq = 0;
  let rasterSeq = 0;
  let warnings: string[] = [];
  let slideW = 0;
  let slideH = 0;
  type MarkerReq = { text: string; style: CSSStyleDeclaration; opacity: number; liTop: number; outside: boolean; done: boolean };
  let markerStack: MarkerReq[] = [];

  function push(item: LayoutItem) {
    (item as LayoutItem & { _seq: number })._seq = seq++;
    items.push(item);
  }

  function strokeOf(cs: CSSStyleDeclaration, side: 'Top' | 'Right' | 'Bottom' | 'Left', opacity: number): LayoutStroke | null {
    const width = px(cs.getPropertyValue(`border-${side.toLowerCase()}-width`));
    const style = cs.getPropertyValue(`border-${side.toLowerCase()}-style`);
    if (width <= 0 || style === 'none' || style === 'hidden') return null;
    const color = parseColor(cs.getPropertyValue(`border-${side.toLowerCase()}-color`), opacity);
    if (!color) return null;
    const dash = style === 'dashed' ? 'dash' : style === 'dotted' ? 'sysDot' : 'solid';
    return { color, widthPx: width, dash };
  }

  function sameStroke(a: LayoutStroke | null, b: LayoutStroke | null) {
    return !!a && !!b && a.widthPx === b.widthPx && a.dash === b.dash && a.color.hex === b.color.hex && Math.abs(a.color.alpha - b.color.alpha) < 0.01;
  }

  function paintBoxes(el: Element, cs: CSSStyleDeclaration, opacity: number, z: number, isSlideRoot: boolean) {
    const inline = cs.display === 'inline';
    const rects = inline ? Array.from(el.getClientRects()) : [el.getBoundingClientRect()];
    const fill = isSlideRoot ? null : parseColor(cs.backgroundColor, opacity);
    const bgImage = cs.backgroundImage;
    const hasBgImage = !!bgImage && bgImage !== 'none';
    const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).map((s) => strokeOf(cs, s, opacity));
    const uniform = sides.every((s) => sameStroke(s, sides[0]));
    const radius = Math.min(px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius) || Infinity);

    for (const r of rects) {
      const b = rel(r);
      if (b.w < 0.5 || b.h < 0.5) continue;
      if (b.x > slideW || b.y > slideH || b.x + b.w < 0 || b.y + b.h < 0) continue;

      if (hasBgImage && !inline) {
        let id = el.getAttribute('data-h2p-id');
        if (!id) {
          id = `h2p-r${rasterSeq++}`;
          el.setAttribute('data-h2p-id', id);
        }
        const raster: LayoutRaster = {
          kind: 'raster', id, z, x: b.x, y: b.y, w: b.w, h: b.h, mode: 'background', tag: el.tagName.toLowerCase(),
          opacity, fallbackFill: fill || firstGradientColor(bgImage, opacity),
        };
        if (fill) push({ kind: 'box', z, x: b.x, y: b.y, w: b.w, h: b.h, fill, radiusPx: radius });
        push(raster);
      } else if (fill || (uniform && sides[0])) {
        const stroke = uniform && sides[0] ? sides[0] : undefined;
        const inset = stroke ? stroke.widthPx / 2 : 0;
        push({
          kind: 'box', z,
          x: b.x + inset, y: b.y + inset, w: Math.max(0.5, b.w - 2 * inset), h: Math.max(0.5, b.h - 2 * inset),
          fill: fill || undefined, stroke, radiusPx: radius,
        });
      }
      if (!uniform || (hasBgImage && sides[0])) {
        const [t, rgt, btm, l] = sides;
        if (t) push({ kind: 'line', z, x1: b.x, y1: b.y + t.widthPx / 2, x2: b.x + b.w, y2: b.y + t.widthPx / 2, stroke: t });
        if (btm) push({ kind: 'line', z, x1: b.x, y1: b.y + b.h - btm.widthPx / 2, x2: b.x + b.w, y2: b.y + b.h - btm.widthPx / 2, stroke: btm });
        if (l) push({ kind: 'line', z, x1: b.x + l.widthPx / 2, y1: b.y, x2: b.x + l.widthPx / 2, y2: b.y + b.h, stroke: l });
        if (rgt) push({ kind: 'line', z, x1: b.x + b.w - rgt.widthPx / 2, y1: b.y, x2: b.x + b.w - rgt.widthPx / 2, y2: b.y + b.h, stroke: rgt });
      }
    }
    if (cs.boxShadow && cs.boxShadow !== 'none' && !isSlideRoot) {
      if (!warnings.includes('box-shadow is not converted')) warnings.push('box-shadow is not converted');
    }
  }

  function paintPseudo(el: Element, which: '::before' | '::after', opacity: number, z: number) {
    const ps = win.getComputedStyle(el, which);
    const content = ps.content;
    if ((el.getAttribute('data-h2p-mat') || '').split(' ').includes(which.slice(2))) return;
    if (!content || content === 'none' || content === 'normal' || ps.display === 'none') return;
    if (ps.position !== 'absolute' && ps.position !== 'fixed') return; // inline pseudo text is handled with the text runs
    const host = el.getBoundingClientRect();
    const hcs = win.getComputedStyle(el);
    const padLeft = host.left + px(hcs.borderLeftWidth);
    const padTop = host.top + px(hcs.borderTopWidth);
    const padRight = host.right - px(hcs.borderRightWidth);
    const padBottom = host.bottom - px(hcs.borderBottomWidth);
    const w = px(ps.width);
    const h = px(ps.height);
    if (w <= 0 || h <= 0) return;
    const left = ps.left !== 'auto' ? padLeft + px(ps.left) : ps.right !== 'auto' ? padRight - px(ps.right) - w : padLeft;
    const top = ps.top !== 'auto' ? padTop + px(ps.top) : ps.bottom !== 'auto' ? padBottom - px(ps.bottom) - h : padTop;
    const pOpacity = opacity * px(ps.opacity || '1');
    const pz = zOf(ps, z);
    const fill = parseColor(ps.backgroundColor, pOpacity);
    const b = rel({ left, top, width: w, height: h });
    if (fill) {
      push({ kind: 'box', z: pz, x: b.x, y: b.y, w: b.w, h: b.h, fill, radiusPx: px(ps.borderTopLeftRadius) });
    }
    if (ps.backgroundImage && ps.backgroundImage !== 'none') {
      let id = el.getAttribute('data-h2p-id');
      if (!id) {
        id = `h2p-r${rasterSeq++}`;
        el.setAttribute('data-h2p-id', id);
      }
      push({
        kind: 'raster', id, z: pz, x: b.x, y: b.y, w: b.w, h: b.h, mode: which === '::before' ? 'before' : 'after',
        tag: el.tagName.toLowerCase() + which, opacity: pOpacity, fallbackFill: fill || undefined,
      });
    }
  }

  function zOf(cs: CSSStyleDeclaration, parentZ: number) {
    if (cs.position !== 'static' && cs.zIndex !== 'auto') {
      const n = parseInt(cs.zIndex, 10);
      if (!isNaN(n)) return n;
    }
    return parentZ;
  }

  const RASTER_TAGS = new Set(['IMG', 'SVG', 'CANVAS', 'VIDEO', 'PICTURE', 'OBJECT', 'EMBED', 'IFRAME']);

  function isInlineLevel(cs: CSSStyleDeclaration) {
    return cs.display === 'inline' || cs.display === 'contents';
  }

  function markerText(cs: CSSStyleDeclaration, li: Element): string | null {
    const t = cs.listStyleType;
    if (!t || t === 'none') return null;
    if (t === 'disc') return '•';
    if (t === 'circle') return '◦';
    if (t === 'square') return '▪';
    if (/^"(.*)"$/.test(t)) return t.slice(1, -1);
    let idx = 1;
    let p = li.previousElementSibling;
    while (p) {
      if (win.getComputedStyle(p).display === 'list-item') idx++;
      p = p.previousElementSibling;
    }
    const start = li.parentElement && li.parentElement.tagName === 'OL' ? (li.parentElement as HTMLOListElement).start || 1 : 1;
    const n = idx + start - 1;
    if (t === 'lower-alpha' || t === 'lower-latin') return String.fromCharCode(96 + n) + '.';
    if (t === 'upper-alpha' || t === 'upper-latin') return String.fromCharCode(64 + n) + '.';
    return n + '.';
  }

  // ── Walk ─────────────────────────────────────────────────────────────────
  function walk(el: Element, parentOpacity: number, parentZ: number, isSlideRoot: boolean) {
    const cs = win.getComputedStyle(el);
    if (cs.display === 'none') return;
    const opacity = parentOpacity * px(cs.opacity === '' ? '1' : cs.opacity);
    if (opacity < 0.01) return;
    const z = zOf(cs, parentZ);
    const visible = cs.visibility === 'visible';

    if (RASTER_TAGS.has(el.tagName.toUpperCase())) {
      if (!visible) return;
      const b = rel(el.getBoundingClientRect());
      if (b.w < 1 || b.h < 1) return;
      const id = `h2p-r${rasterSeq++}`;
      el.setAttribute('data-h2p-id', id);
      push({ kind: 'raster', id, z, x: b.x, y: b.y, w: b.w, h: b.h, mode: 'element', tag: el.tagName.toLowerCase(), opacity });
      return;
    }

    if (visible && cs.display !== 'contents') paintBoxes(el, cs, opacity, z, isSlideRoot);
    if (visible) {
      paintPseudo(el, '::before', opacity, z);
    }

    let marker: MarkerReq | null = null;
    if (cs.display === 'list-item' && visible) {
      const text = markerText(cs, el);
      if (text) {
        marker = { text, style: cs, opacity, liTop: el.getBoundingClientRect().top, outside: cs.listStylePosition !== 'inside', done: false };
        markerStack.push(marker);
      }
    }

    let group: Node[] = [];
    const flush = () => {
      if (group.length) makeText(group, el, cs, opacity, z);
      group = [];
    };
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3) {
        group.push(child);
      } else if (child.nodeType === 1) {
        const ccs = win.getComputedStyle(child as Element);
        if (ccs.display === 'none') continue;
        if ((child as Element).tagName === 'BR' || (isInlineLevel(ccs) && !RASTER_TAGS.has((child as Element).tagName.toUpperCase()))) {
          group.push(child);
        } else {
          flush();
          walk(child as Element, opacity, z, false);
        }
      }
    }
    flush();
    if (visible) paintPseudo(el, '::after', opacity, z);
    if (marker) markerStack.splice(markerStack.indexOf(marker), 1);
  }

  /** Effective opacity of an inline element relative to the enclosing block. */
  function inlineOpacity(node: Element | null, block: Element) {
    let o = 1;
    while (node && node !== block) {
      o *= px(win.getComputedStyle(node).opacity || '1');
      node = node.parentElement;
    }
    return o;
  }

  function hasDecoration(node: Element | null, block: Element, kind: 'underline' | 'line-through') {
    while (node) {
      const d = win.getComputedStyle(node).textDecorationLine || '';
      if (d.includes(kind)) return true;
      if (node === block) break;
      node = node.parentElement;
    }
    return false;
  }

  function applyTransform(ch: string, tt: string, prev: string) {
    if (tt === 'uppercase') return ch.toUpperCase();
    if (tt === 'lowercase') return ch.toLowerCase();
    if (tt === 'capitalize' && (prev === '' || /\s/.test(prev))) return ch.toUpperCase();
    return ch;
  }

  function makeText(group: Node[], block: Element, blockCs: CSSStyleDeclaration, blockOpacity: number, z: number) {
    // Collect text nodes in order; descend into inline elements. Block-level
    // descendants of an inline element are walked separately afterwards.
    const texts: Text[] = [];
    const nested: Element[] = [];
    const collect = (n: Node) => {
      if (n.nodeType === 3) {
        texts.push(n as Text);
        return;
      }
      if (n.nodeType !== 1) return;
      const e = n as Element;
      const ecs = win.getComputedStyle(e);
      if (ecs.display === 'none') return;
      if (e !== block && !isInlineLevel(ecs) && e.tagName !== 'BR') {
        nested.push(e);
        return;
      }
      if (e.tagName !== 'BR' && ecs.visibility === 'visible' && ecs.display === 'inline') {
        paintBoxes(e, ecs, blockOpacity * inlineOpacity(e, block), z, false);
      }
      e.childNodes.forEach(collect);
    };
    group.forEach((n) => {
      if (n.nodeType === 1 && (n as Element).tagName !== 'BR') {
        const e = n as Element;
        const ecs = win.getComputedStyle(e);
        if (ecs.display === 'contents') {
          e.childNodes.forEach(collect);
          return;
        }
      }
      collect(n);
    });

    type Line = { runs: LayoutTextRun[]; left: number; right: number; top: number; bottom: number };
    const lines: Line[] = [];
    let cur: Line | null = null;
    let lastKey = '';
    const range = doc.createRange();
    const fontSizes: number[] = [];
    const lineHeights: number[] = [];

    for (const t of texts) {
      const parent = t.parentElement;
      if (!parent) continue;
      const pcs = win.getComputedStyle(parent);
      if (pcs.visibility !== 'visible') continue;
      const op = blockOpacity * inlineOpacity(parent, block);
      if (op < 0.01) continue;
      const color = parseColor(pcs.color, op);
      if (!color) continue;
      const fam = families(pcs.fontFamily);
      const fontSizePx = px(pcs.fontSize);
      const weight = parseInt(pcs.fontWeight, 10) || (pcs.fontWeight === 'bold' ? 700 : 400);
      const italic = pcs.fontStyle === 'italic' || pcs.fontStyle.startsWith('oblique');
      const underline = hasDecoration(parent, block, 'underline');
      const strike = hasDecoration(parent, block, 'line-through');
      const ls = pcs.letterSpacing === 'normal' ? 0 : px(pcs.letterSpacing);
      const anchor = parent.closest('a[href]') as HTMLAnchorElement | null;
      const href = anchor && block.contains(anchor) && /^(https?:|mailto:)/.test(anchor.href) ? anchor.href : undefined;
      const tt = pcs.textTransform;
      const pre = /^(pre|pre-wrap|break-spaces)$/.test(pcs.whiteSpace);
      const lhRaw = pcs.lineHeight;
      lineHeights.push(lhRaw === 'normal' ? fontSizePx * 1.2 : px(lhRaw));
      fontSizes.push(fontSizePx);

      const s = t.data;
      let prevCh = '';
      for (let i = 0; i < s.length; ) {
        const cp = s.codePointAt(i)!;
        const len = cp > 0xffff ? 2 : 1;
        let ch = s.slice(i, i + len);
        range.setStart(t, i);
        range.setEnd(t, i + len);
        i += len;
        const isWs = /\s/.test(ch);
        if (ch === '\n' && pre) continue;
        const rects = range.getClientRects();
        if (!rects.length) continue;
        const r = rects[0];
        if (isWs && r.width === 0) continue;
        if (r.width === 0 && r.height === 0) continue;
        const mid = (r.top + r.bottom) / 2;
        if (!cur || mid > cur.bottom - 0.5) {
          if (isWs) continue; // never start a line with a space
          cur = { runs: [], left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          lines.push(cur);
          lastKey = '';
        }
        if (isWs) ch = ch === '\t' ? '    ' : ' ';
        else ch = applyTransform(ch, tt, prevCh);
        prevCh = ch;
        cur.left = Math.min(cur.left, r.left);
        cur.right = Math.max(cur.right, r.right);
        cur.top = Math.min(cur.top, r.top);
        cur.bottom = Math.max(cur.bottom, r.bottom);
        const cjk = CJK_RE.test(ch);
        const fontFamily = cjk ? fam.cjk : fam.primary;
        const key = [fontFamily, fontSizePx, weight >= 600, italic, underline, strike, color.hex, color.alpha.toFixed(3), ls, href || ''].join('|');
        if (key === lastKey && cur.runs.length) {
          cur.runs[cur.runs.length - 1].text += ch;
        } else {
          cur.runs.push({ text: ch, fontFamily, fontSizePx, bold: weight >= 600, italic, underline, strike, color, letterSpacingPx: ls, href });
          lastKey = key;
        }
      }
    }
    range.detach();

    // Trim trailing spaces of each line.
    for (const ln of lines) {
      while (ln.runs.length) {
        const last = ln.runs[ln.runs.length - 1];
        last.text = last.text.replace(/\s+$/, '');
        if (last.text) break;
        ln.runs.pop();
      }
    }
    const kept = lines.filter((l) => l.runs.length);
    if (kept.length) {
      const mids = kept.map((l) => (l.top + l.bottom) / 2);
      let lh = kept.length > 1 ? (mids[mids.length - 1] - mids[0]) / (kept.length - 1) : Math.max(...lineHeights, 0);
      if (!lh || lh <= 0) lh = Math.max(...fontSizes) * 1.2;
      const left = Math.min(...kept.map((l) => l.left));
      const right = Math.max(...kept.map((l) => l.right));
      const ta = blockCs.textAlign;
      const align: LayoutText['align'] = ta === 'center' ? 'center' : ta === 'right' || ta === 'end' ? 'right' : 'left';
      const preserve = options.preserveLineBreaks !== false;
      let x = left;
      let w = right - left;
      if (!preserve) {
        const br = block.getBoundingClientRect();
        x = br.left + px(blockCs.paddingLeft) + px(blockCs.borderLeftWidth);
        w = br.width - px(blockCs.paddingLeft) - px(blockCs.paddingRight) - px(blockCs.borderLeftWidth) - px(blockCs.borderRightWidth);
      }
      const top = mids[0] - lh / 2;
      const box = rel({ left: x, top, width: w + 2, height: lh * kept.length });
      if (align === 'right') box.x -= 2;
      if (align === 'center') box.x -= 1;
      const textItem: LayoutText = {
        kind: 'text', z, x: box.x, y: box.y, w: box.w, h: box.h, align, lineHeightPx: lh, wrap: !preserve,
        lines: kept.map((l) => l.runs),
      };
      push(textItem);

      // List marker for the innermost pending list item, placed on its first line.
      const m = markerStack[markerStack.length - 1];
      if (m && !m.done && Math.abs(kept[0].top - m.liTop) < lh * 1.5) {
        m.done = true;
        const mcolor = parseColor(m.style.color, m.opacity);
        const mfam = families(m.style.fontFamily);
        if (mcolor) {
          const fs = px(m.style.fontSize);
          const mw = fs * (m.text.length > 1 ? m.text.length * 0.6 : 0.8);
          const mx = m.outside ? left - mw - fs * 0.4 : left;
          const mb = rel({ left: mx, top, width: mw, height: lh });
          push({
            kind: 'text', z, x: mb.x, y: mb.y, w: mb.w, h: mb.h, align: 'right', lineHeightPx: lh, wrap: false,
            lines: [[{ text: m.text, fontFamily: mfam.primary, fontSizePx: fs, bold: false, italic: false, underline: false, strike: false, color: mcolor, letterSpacingPx: 0 }]],
          });
        }
      }
    }

    for (const n of nested) {
      // An inline element containing a block: walk it on its own.
      walk(n, blockOpacity * inlineOpacity(n.parentElement, block), z, false);
    }
  }

  function backgroundOf(slide: HTMLElement): LayoutColor {
    const chain: Element[] = [];
    let e: Element | null = slide;
    while (e) {
      chain.push(e);
      e = e.parentElement;
    }
    for (const el of chain) {
      const c = parseColor(win.getComputedStyle(el).backgroundColor, 1);
      if (c && c.alpha > 0.99) return c;
    }
    return { hex: 'FFFFFF', alpha: 1 };
  }

  /**
   * Pseudo-elements with text (list dashes, icons, counters rendered as
   * strings) have no DOM box to measure. Replace each with a real span that
   * carries the full computed style, so it lays out in the same place and is
   * then read like any other text. resetAll() removes the spans again.
   */
  function unescapeCss(str: string) {
    return str.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/\\(.)/g, '$1');
  }
  function materializePseudos(root: HTMLElement) {
    const hosts = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
    const jobs: { host: HTMLElement; which: 'before' | 'after'; text: string; style: CSSStyleDeclaration }[] = [];
    for (const host of hosts) {
      if (RASTER_TAGS.has(host.tagName.toUpperCase()) || host.hasAttribute('data-h2p-materialized')) continue;
      for (const which of ['before', 'after'] as const) {
        const ps = win.getComputedStyle(host, '::' + which);
        const m = ps.content.match(/^"((?:[^"\\]|\\.)*)"$/);
        if (!m || ps.display === 'none') continue;
        const text = unescapeCss(m[1]);
        if (!text.trim()) continue;
        jobs.push({ host, which, text, style: ps });
      }
    }
    // Snapshot the styles first: inserting spans changes later computed values.
    const prepared = jobs.map((j) => {
      const decl: string[] = [];
      for (let i = 0; i < j.style.length; i++) {
        const prop = j.style[i];
        if (prop === 'content') continue;
        decl.push(`${prop}:${j.style.getPropertyValue(prop)}`);
      }
      return { ...j, css: decl.join(';') };
    });
    for (const j of prepared) {
      const span = doc.createElement('span');
      span.setAttribute('data-h2p-materialized', j.which);
      span.setAttribute('style', j.css);
      span.textContent = j.text;
      if (j.which === 'before') j.host.insertBefore(span, j.host.firstChild);
      else j.host.appendChild(span);
      const prev = j.host.getAttribute('data-h2p-mat');
      j.host.setAttribute('data-h2p-mat', prev ? `${prev} ${j.which}` : j.which);
    }
  }

  function extractSlide(slide: HTMLElement, index: number): LayoutSlide {
    const r = slide.getBoundingClientRect();
    origin = { x: r.left, y: r.top };
    slideW = options.widthPx || r.width;
    slideH = options.heightPx || r.height;
    items = [];
    seq = 0;
    markerStack = [];
    materializePseudos(slide);
    void slide.offsetHeight;
    walk(slide, 1, 0, true);
    const sorted = items
      .map((it) => it as LayoutItem & { _seq: number })
      .sort((a, b) => a.z - b.z || a._seq - b._seq)
      .map((it) => {
        delete (it as Partial<LayoutItem & { _seq: number }>)._seq;
        return it as LayoutItem;
      });
    return { index, widthPx: slideW, heightPx: slideH, background: backgroundOf(slide), items: sorted };
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  const slides = findSlides();
  const activeClass = detectActiveClass(slides);
  const action = input.action;

  if (action.type === 'reset') {
    resetAll();
    return null;
  }

  if (action.type === 'extract') {
    warnings = [];
    rasterSeq = 0;
    doc.querySelectorAll('[data-h2p-id]').forEach((e) => e.removeAttribute('data-h2p-id'));
    const out: LayoutSlide[] = [];
    slides.forEach((s, i) => {
      activate(slides, i, activeClass);
      out.push(extractSlide(s, i));
    });
    resetAll();
    const first = out[0];
    if (activeClass) warnings.unshift(`slides activated with class "${activeClass}"`);
    return { widthPx: first ? first.widthPx : 0, heightPx: first ? first.heightPx : 0, slides: out, warnings };
  }

  // action.type === 'show'
  resetAll();
  const target = slides[action.slide];
  if (!target) throw new Error(`slide ${action.slide} not found`);
  activate(slides, action.slide, activeClass);
  slides.forEach((s, i) => {
    if (i !== action.slide) s.setAttribute('data-h2p-hidden', '');
  });
  // Bring the slide into the viewport. Decks that move slides with a
  // transformed track get a compensating translate on the slide itself.
  target.scrollIntoView({ block: 'start', inline: 'start' });
  let r = target.getBoundingClientRect();
  if (Math.abs(r.left) > 0.5 || Math.abs(r.top) > 0.5) {
    const prev = target.style.transform;
    target.setAttribute('data-h2p-shift', prev);
    target.style.transform = `translate(${-r.left}px, ${-r.top}px) ${prev}`.trim();
    r = target.getBoundingClientRect();
  }
  if (action.soloId) {
    const el = doc.querySelector(`[data-h2p-id="${action.soloId}"]`);
    if (el) {
      doc.documentElement.classList.add('h2p-solo');
      target.setAttribute('data-h2p-scope', '');
      el.setAttribute('data-h2p-solo', action.soloMode || 'element');
    }
  }
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}
