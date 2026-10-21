/**
 * Layout conversion model.
 *
 * The layout mode does not interpret HTML semantics (headings, lists, tables).
 * It renders the page in a real browser engine, reads where every box, line of
 * text and image actually landed, and records that geometry here. The PPTX
 * generator then places native shapes and text boxes at the same positions, so
 * the deck keeps the HTML's visual design while its text stays editable.
 *
 * All coordinates and sizes are CSS pixels relative to the slide's top-left
 * corner. The generator converts them to inches / points.
 */

export interface LayoutColor {
  /** 6-digit uppercase hex without '#', e.g. 'C9A86A' */
  hex: string;
  /** 0 (transparent) .. 1 (opaque), already multiplied by element opacity */
  alpha: number;
}

export type LayoutDash = 'solid' | 'dash' | 'sysDot';

export interface LayoutStroke {
  color: LayoutColor;
  widthPx: number;
  dash: LayoutDash;
}

interface LayoutItemBase {
  /** Paint order key: effective z-index of the nearest stacking ancestor */
  z: number;
}

/** A filled and/or stroked rectangle (background, card, uniform border). */
export interface LayoutBox extends LayoutItemBase {
  kind: 'box';
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: LayoutColor;
  stroke?: LayoutStroke;
  radiusPx: number;
}

/** A horizontal or vertical line (one side of a non-uniform border). */
export interface LayoutLine extends LayoutItemBase {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: LayoutStroke;
}

export interface LayoutTextRun {
  text: string;
  fontFamily: string;
  fontSizePx: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: LayoutColor;
  letterSpacingPx: number;
  href?: string;
}

/**
 * A block of text. Each entry of `lines` is one visual line exactly as the
 * browser broke it, so the PPTX reproduces the same line breaks even when the
 * viewer substitutes a font with slightly different metrics.
 */
export interface LayoutText extends LayoutItemBase {
  kind: 'text';
  x: number;
  y: number;
  w: number;
  h: number;
  align: 'left' | 'center' | 'right';
  lineHeightPx: number;
  /** false = lines are explicit (no wrapping); true = wrap inside w */
  wrap: boolean;
  lines: LayoutTextRun[][];
}

/**
 * A region that cannot be expressed as native shapes (img, svg, canvas,
 * gradient or url() backgrounds). The environment fills `src` with a PNG data
 * URL: the CLI screenshots the element, the in-app mode uses canvas.
 */
export interface LayoutRaster extends LayoutItemBase {
  kind: 'raster';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * 'element' = the element and its content; 'background' = only its own
   * background; 'before' / 'after' = only that pseudo-element of the element
   */
  mode: 'element' | 'background' | 'before' | 'after';
  tag: string;
  opacity: number;
  src?: string;
  /** Used when no raster can be produced, e.g. the first colour of a gradient */
  fallbackFill?: LayoutColor;
}

export type LayoutItem = LayoutBox | LayoutLine | LayoutText | LayoutRaster;

export interface LayoutSlide {
  index: number;
  widthPx: number;
  heightPx: number;
  background: LayoutColor;
  items: LayoutItem[];
}

export interface LayoutDeck {
  widthPx: number;
  heightPx: number;
  slides: LayoutSlide[];
  warnings: string[];
}

export interface LayoutExtractOptions {
  /** CSS selector for slide roots. Auto-detected when omitted. */
  slideSelector?: string;
  /**
   * Class that marks the visible slide in the source deck (e.g. 'is-active',
   * 'present'). Auto-detected from a list of common names when omitted; pass
   * null to disable class toggling.
   */
  activeClass?: string | null;
  /** Keep the browser's line breaks (default true). */
  preserveLineBreaks?: boolean;
  /** Force slide size in px; defaults to the slide's rendered size. */
  widthPx?: number;
  heightPx?: number;
}
