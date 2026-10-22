import { HTMLContent, ConversionConfig, Section, SlideElement, SlideLayout } from '../../models';
import { SlideCreatorService, SlideCreationError } from './SlideCreatorInterface';
import { PptxGeneratorService } from '../pptx/PptxGeneratorInterface';
import { ImageHandlerService } from './ImageHandlerInterface';
import { TableHandlerService } from './TableHandlerInterface';
import { ListHandlerService } from './ListHandlerInterface';
import { LinkHandlerService } from './LinkHandlerInterface';
import { ThemeHandlerService } from './ThemeHandlerInterface';
import {
  FLOW_BOTTOM_MARGIN_IN,
  FLOW_GAP_IN,
  FLOW_TOP_NO_TITLE_IN,
  FLOW_TOP_WITH_TITLE_IN,
  MIN_FONT_PT,
  estimateListHeightIn,
  estimateListItemHeightsIn,
  estimateTableRowHeightsIn,
  estimateTextHeightIn,
  fitFontSize,
  plainText,
  resolveWidthIn,
  slideSizeFor,
  textResourceFontPt
} from './SemanticFlowLayout';

/**
 * One element prepared for the vertical flow: how tall it will be, how to draw
 * it at a given offset, and (optionally) how to shrink it or split it when it
 * does not fit the space left on a slide.
 */
interface FlowBlock {
  /** Estimated rendered height, inches. */
  height: number;
  /** Draw the block with its top at `y` and a box height of `h` (inches). */
  render(slide: any, y: number, h: number): void;
  /** A smaller version that fits `maxH` as well as it can (smaller font, scaled image). */
  fitTo?(maxH: number): FlowBlock;
  /** Split into a head that fits `maxH` and a tail for the next slide; null if no head fits. */
  splitAt?(maxH: number): [FlowBlock, FlowBlock] | null;
  /** The element carries its own explicit `y`: draw it there, outside the flow. */
  fixed?: boolean;
}

/**
 * Slide Creator Service Implementation
 * 
 * This service creates slides from HTML content based on the provided configuration.
 * 
 * Requirements:
 * - 2.2: Allow the user to specify slide layout preferences
 * - 3.1: Use PptxGenJS to convert HTML content to PPTX format
 */
export class SlideCreator implements SlideCreatorService {
  private pptxGenerator: PptxGeneratorService;
  private imageHandler: ImageHandlerService;
  private tableHandler: TableHandlerService;
  private listHandler: ListHandlerService;
  private linkHandler: LinkHandlerService;
  private themeHandler: ThemeHandlerService;
  
  /**
   * Constructor
   * 
   * @param pptxGenerator - The PPTX generator service
   * @param imageHandler - The image handler service
   * @param tableHandler - The table handler service
   * @param listHandler - The list handler service
   * @param linkHandler - The link handler service
   * @param themeHandler - The theme handler service
   */
  constructor(
    pptxGenerator: PptxGeneratorService, 
    imageHandler: ImageHandlerService,
    tableHandler: TableHandlerService,
    listHandler: ListHandlerService,
    linkHandler: LinkHandlerService,
    themeHandler: ThemeHandlerService
  ) {
    this.pptxGenerator = pptxGenerator;
    this.imageHandler = imageHandler;
    this.tableHandler = tableHandler;
    this.listHandler = listHandler;
    this.linkHandler = linkHandler;
    this.themeHandler = themeHandler;
  }
  
  /**
   * Create slides from HTML content
   * 
   * @param htmlContent - Parsed HTML content
   * @param config - Conversion configuration
   * @returns The created presentation instance
   */
  async createSlides(htmlContent: HTMLContent, config: ConversionConfig): Promise<any> {
    try {
      // Initialize the PPTX generator
      await this.pptxGenerator.initialize();
      
      // Create a new presentation
      const presentation = this.pptxGenerator.createPresentation();
      
      // Apply the specified theme
      this.themeHandler.applyTheme(presentation, config.theme);
      
      // If there are no sections, create a single slide with the entire content
      if (!htmlContent.sections || htmlContent.sections.length === 0) {
        const defaultSection: Section = {
          title: 'Untitled',
          content: htmlContent.raw,
          elements: this.extractElementsFromResources(htmlContent)
        };
        await this.createSlideFromSection(presentation, defaultSection, config);
      } else {
        // Create slides from sections
        for (const section of htmlContent.sections) {
          await this.createSlideFromSection(presentation, section, config);
        }
      }
      
      return presentation;
    } catch (error) {
      throw new SlideCreationError(
        `Failed to create slides: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Extract elements from HTML content resources
   * 
   * @param htmlContent - The HTML content with resources
   * @returns Array of slide elements
   */
  private extractElementsFromResources(htmlContent: HTMLContent): SlideElement[] {
    const elements: SlideElement[] = [];
    
    // Add text elements
    if (htmlContent.resources.texts && htmlContent.resources.texts.length > 0) {
      htmlContent.resources.texts.forEach(text => {
        elements.push({
          type: 'text',
          content: text
        });
      });
    }
    
    // Add image elements
    if (htmlContent.resources.images && htmlContent.resources.images.length > 0) {
      htmlContent.resources.images.forEach(image => {
        elements.push({
          type: 'image',
          content: image
        });
      });
    }
    
    // Add table elements
    if (htmlContent.resources.tables && htmlContent.resources.tables.length > 0) {
      htmlContent.resources.tables.forEach(table => {
        elements.push({
          type: 'table',
          content: table
        });
      });
    }
    
    // Add list elements
    if (htmlContent.resources.lists && htmlContent.resources.lists.length > 0) {
      htmlContent.resources.lists.forEach(list => {
        elements.push({
          type: 'list',
          content: list
        });
      });
    }
    
    // Add link elements
    if (htmlContent.resources.links && htmlContent.resources.links.length > 0) {
      htmlContent.resources.links.forEach(link => {
        elements.push({
          type: 'link',
          content: link
        });
      });
    }
    
    return elements;
  }
  
  /**
   * Create a slide from a section
   *
   * Elements are stacked top to bottom below the title, each at its estimated
   * height. When a slide fills up, the rest of the section continues on a new
   * slide titled "<title> (cont.)"; lists and tables are split across slides,
   * text and images too tall for an empty slide are shrunk to fit.
   * 
   * @param presentation - The presentation instance
   * @param section - The section to create a slide from
   * @param config - Conversion configuration
   * @returns The first slide created for the section
   */
  async createSlideFromSection(presentation: any, section: Section, config: ConversionConfig): Promise<any> {
    try {
      const layoutPositions = this.getLayoutPositions(config.slideLayout);
      const size = slideSizeFor(presentation?.layout);
      const hasTitle = !!section.title && section.title !== 'Untitled';
      const top = hasTitle ? FLOW_TOP_WITH_TITLE_IN : FLOW_TOP_NO_TITLE_IN;
      const bottom = size.h - FLOW_BOTTOM_MARGIN_IN;
      
      // Create a new slide with the section title and specified layout
      const firstSlide = this.pptxGenerator.addSlide(presentation, section.title, config.slideLayout);
      let slide = firstSlide;
      let cursor = top;
      let placedOnSlide = 0;
      const nextSlide = () => {
        const title = hasTitle ? `${section.title} (cont.)` : section.title;
        slide = this.pptxGenerator.addSlide(presentation, title, config.slideLayout);
        cursor = top;
        placedOnSlide = 0;
      };
      const place = (block: FlowBlock, h: number) => {
        block.render(slide, cursor, h);
        cursor += h + FLOW_GAP_IN;
        placedOnSlide++;
      };
      
      const queue: FlowBlock[] = [];
      for (const element of section.elements) {
        const block = await this.prepareElement(element, config, layoutPositions, size.w);
        if (block) queue.push(block);
      }
      
      while (queue.length > 0) {
        const block = queue.shift() as FlowBlock;
        if (block.fixed) {
          block.render(slide, NaN, NaN);
          continue;
        }
        const avail = bottom - cursor;
        if (block.height <= avail) {
          place(block, block.height);
          continue;
        }
        const parts = block.splitAt ? block.splitAt(avail) : null;
        if (parts) {
          place(parts[0], parts[0].height);
          queue.unshift(parts[1]);
          nextSlide();
          continue;
        }
        if (placedOnSlide > 0) {
          // Try again on an empty slide before shrinking anything
          queue.unshift(block);
          nextSlide();
          continue;
        }
        // Taller than an empty slide and not splittable: shrink to fit
        const fitted = block.fitTo ? block.fitTo(avail) : block;
        place(fitted, Math.min(fitted.height, avail));
      }
      
      return firstSlide;
    } catch (error) {
      throw new SlideCreationError(
        `Failed to create slide from section: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Get layout-specific positioning for elements
   * 
   * @param layout - The slide layout
   * @returns Layout positions object
   */
  private getLayoutPositions(layout: SlideLayout): Record<string, any> {
    // Define default positions (y is a fallback only: the flow sets it)
    const defaultPositions = {
      title: { x: 0.5, y: 0.5, w: '90%', h: 1 },
      text: { x: 0.5, y: 1.5, w: '90%' },
      image: { x: 1, y: 2, w: '80%' },
      table: { x: 0.5, y: 2, w: '90%' },
      list: { x: 0.5, y: 2, w: '90%' },
      link: { x: 0.5, y: 2, w: '90%' }
    };
    
    // Adjust positions based on layout
    switch (layout) {
      case SlideLayout.STANDARD: // 4:3 layout
        return {
          ...defaultPositions,
          image: { x: 1, y: 2, w: '80%' }
        };
        
      case SlideLayout.WIDE: // 16:9 layout
        return {
          ...defaultPositions,
          image: { x: 1, y: 2, w: '85%' }
        };
        
      case SlideLayout.CUSTOM:
        // For custom layouts, we could allow more specific positioning
        // This could be extended to support custom layouts defined in the configuration
        return {
          ...defaultPositions,
          title: { x: 0.5, y: 0.5, w: '95%', h: 1 },
          text: { x: 0.5, y: 1.5, w: '95%' },
          image: { x: 0.5, y: 2, w: '90%' },
          table: { x: 0.5, y: 2, w: '95%' },
          list: { x: 0.5, y: 2, w: '95%' },
          link: { x: 0.5, y: 2, w: '95%' }
        };
        
      default:
        return defaultPositions;
    }
  }
  
  /**
   * Turn one section element into a flow block (or null when the configuration
   * leaves it out, e.g. images with includeImages=false).
   * 
   * @param element - The element to prepare
   * @param config - Conversion configuration
   * @param positions - Layout-specific positions for elements
   * @param slideW - Slide width in inches
   */
  private async prepareElement(
    element: SlideElement, 
    config: ConversionConfig,
    positions: Record<string, any>,
    slideW: number
  ): Promise<FlowBlock | null> {
    const fixed = element.style?.y !== undefined;
    try {
      switch (element.type) {
        case 'text':
          return this.textBlock(element, { ...positions.text, ...element.style }, slideW, fixed);
          
        case 'image':
          // Only add images if includeImages is true in the configuration
          if (!config.includeImages) return null;
          return await this.imageBlock(element, config, { ...positions.image, ...element.style }, slideW, fixed);
          
        case 'table':
          return this.tableBlock(element, positions, slideW, fixed);
          
        case 'list':
          return this.listBlock(element, positions, slideW, fixed);
          
        case 'link':
          // Only add links if preserveLinks is true in the configuration
          if (!config.preserveLinks) return null;
          return this.linkBlock(element, positions, slideW, fixed);
          
        default:
          console.warn(`Unknown element type: ${(element as any).type}`);
          return null;
      }
    } catch (error) {
      throw new SlideCreationError(
        `Failed to add element to slide: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  private textBlock(element: SlideElement, options: Record<string, any>, slideW: number, fixed: boolean): FlowBlock {
    const widthIn = resolveWidthIn(options.w, slideW);
    const text = plainText(element.content?.content);
    const make = (fontPt: number | undefined): FlowBlock => {
      const size = fontPt ?? (typeof options.fontSize === 'number' ? options.fontSize : textResourceFontPt(element.content?.format));
      const height = estimateTextHeightIn(text, size, widthIn);
      return {
        height,
        fixed,
        render: (slide, y, h) => {
          const opts: Record<string, any> = fixed ? { ...options } : { ...options, y, h, valign: 'top' };
          if (fontPt !== undefined) opts.fontSize = fontPt;
          this.pptxGenerator.addTextElement(slide, element.content, opts);
        },
        fitTo: (maxH) => make(fitFontSize(text, size, widthIn, maxH))
      };
    };
    return make(undefined);
  }
  
  private async imageBlock(
    element: SlideElement,
    config: ConversionConfig,
    options: Record<string, any>,
    slideW: number,
    fixed: boolean
  ): Promise<FlowBlock> {
    let image = element.content;
    try {
      // Process the image with the image handler
      image = await this.imageHandler.processImage(element.content, config.imageOptions);
    } catch (error) {
      console.warn(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
      // Fall back to the original image if processing fails
    }
    
    // Pixels to inches (approximate), capped to the content width
    const maxW = resolveWidthIn(options.w, slideW);
    let w = (image?.width || 300) / 100;
    let h = (image?.height || 200) / 100;
    if (w > maxW) {
      h *= maxW / w;
      w = maxW;
    }
    const make = (wIn: number, hIn: number): FlowBlock => ({
      height: hIn,
      fixed,
      render: (slide, y) => {
        const opts = fixed ? { ...options, w: wIn, h: hIn } : { ...options, y, w: wIn, h: hIn };
        this.pptxGenerator.addImageElement(slide, image, opts);
      },
      fitTo: (maxH) => (hIn <= maxH ? make(wIn, hIn) : make(wIn * (maxH / hIn), maxH))
    });
    return make(w, h);
  }
  
  private tableBlock(element: SlideElement, positions: Record<string, any>, slideW: number, fixed: boolean): FlowBlock {
    try {
      // Process the table with the table handler
      const processedTable = this.tableHandler.processTable(element.content);
      
      // Get table styling options and merge with position options
      const tableOptions = this.tableHandler.applyTableStyling(processedTable);
      const mergedOptions = { ...positions.table, ...tableOptions, ...element.style };
      
      // Format headers and rows
      const formattedHeaders = this.tableHandler.formatHeaders(processedTable.headers);
      const formattedRows = this.tableHandler.formatRows(processedTable.rows);
      const headerRows = formattedHeaders.length > 0 ? [formattedHeaders] : [];
      
      const widthIn = resolveWidthIn(mergedOptions.w, slideW);
      const rowHeights = estimateTableRowHeightsIn([...headerRows, ...formattedRows], widthIn);
      const headerH = headerRows.length > 0 ? rowHeights[0] : 0;
      const bodyHeights = rowHeights.slice(headerRows.length);
      
      const make = (rows: any[][], heights: number[]): FlowBlock => ({
        height: headerH + heights.reduce((a, b) => a + b, 0),
        fixed,
        render: (slide, y) => {
          const opts = fixed ? mergedOptions : { ...mergedOptions, y };
          this.pptxGenerator.addTableElement(
            slide,
            {
              ...processedTable,
              _formattedData: [...headerRows, ...rows] // Add formatted data for PptxGenerator
            },
            opts
          );
        },
        splitAt: (maxH) => {
          // Repeat the header row on every slide the table spans
          let used = headerH;
          let n = 0;
          while (n < rows.length && used + heights[n] <= maxH) used += heights[n++];
          if (n === 0 || n === rows.length) return null;
          return [make(rows.slice(0, n), heights.slice(0, n)), make(rows.slice(n), heights.slice(n))];
        }
      });
      return make(formattedRows, bodyHeights);
    } catch (error) {
      console.warn(`Failed to process table: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to original table if processing fails
      const options = { ...positions.table, ...element.style };
      const table = element.content || {};
      const rows = [...(table.headers?.length ? [table.headers] : []), ...(table.rows || [])];
      const height = estimateTableRowHeightsIn(rows, resolveWidthIn(options.w, slideW)).reduce((a, b) => a + b, 0);
      return {
        height,
        fixed,
        render: (slide, y) => {
          this.pptxGenerator.addTableElement(slide, element.content, fixed ? options : { ...options, y });
        }
      };
    }
  }
  
  private listBlock(element: SlideElement, positions: Record<string, any>, slideW: number, fixed: boolean): FlowBlock {
    let list: any;
    let options: Record<string, any>;
    let items: any[];
    try {
      // Process the list with the list handler
      const processedList = this.listHandler.processList(element.content);
      
      // Get list styling options and merge with position options
      const listOptions = this.listHandler.applyListStyling(processedList);
      options = { ...positions.list, ...listOptions, ...element.style };
      
      // Format list items, handling nested lists if present
      const formattedItems = this.listHandler.formatListItems(processedList.items, processedList.ordered);
      items = this.listHandler.handleNestedLists(formattedItems);
      list = processedList;
    } catch (error) {
      console.warn(`Failed to process list: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to original list if processing fails
      list = element.content;
      options = { ...positions.list, ...element.style };
      items = element.content?.items || [];
    }
    
    const widthIn = resolveWidthIn(options.w, slideW);
    const baseFont = typeof options.fontSize === 'number' ? options.fontSize : 18;
    const startAt = parseInt(String(options.bullet?.startAt ?? list?.style?.start ?? '1'), 10) || 1;
    
    const make = (part: any[], offset: number, fontPt: number): FlowBlock => {
      const heights = estimateListItemHeightsIn(part, fontPt, widthIn);
      return {
        height: estimateListHeightIn(part, fontPt, widthIn),
        fixed,
        render: (slide, y, h) => {
          const opts: Record<string, any> = fixed ? { ...options } : { ...options, y, h, valign: 'top' };
          opts.fontSize = fontPt;
          let partList = { ...list, items: part, _formattedItems: part };
          if (offset > 0 && list?.ordered) {
            // Keep numbering going on a continuation slide
            if (opts.bullet) opts.bullet = { ...opts.bullet, startAt: startAt + offset };
            partList = { ...partList, style: { ...(list.style || {}), start: String(startAt + offset) } };
          }
          // Add formatted items for PptxGenerator
          this.pptxGenerator.addListElement(slide, partList, opts);
        },
        splitAt: (maxH) => {
          let used = estimateListHeightIn([], fontPt, widthIn);
          let n = 0;
          while (n < part.length && used + heights[n] <= maxH) used += heights[n++];
          if (n === 0 || n === part.length) return null;
          return [make(part.slice(0, n), offset, fontPt), make(part.slice(n), offset + n, fontPt)];
        },
        fitTo: (maxH) => {
          let size = fontPt;
          while (size > MIN_FONT_PT && estimateListHeightIn(part, size, widthIn) > maxH) size -= 1;
          return make(part, offset, size);
        }
      };
    };
    return make(items, 0, baseFont);
  }
  
  private linkBlock(element: SlideElement, positions: Record<string, any>, slideW: number, fixed: boolean): FlowBlock {
    let link = element.content;
    let options: Record<string, any>;
    try {
      // Process the link with the link handler
      link = this.linkHandler.processLink(element.content);
      
      // Get link styling options and merge with position options
      const linkOptions = this.linkHandler.applyLinkStyling(link);
      options = { ...positions.link, ...linkOptions, ...element.style };
    } catch (error) {
      console.warn(`Failed to process link: ${error instanceof Error ? error.message : String(error)}`);
      
      // Fallback to original link if processing fails
      link = element.content;
      options = { ...positions.link, ...element.style };
    }
    const fontPt = typeof options.fontSize === 'number' ? options.fontSize : 18;
    const height = estimateTextHeightIn(plainText(link?.text), fontPt, resolveWidthIn(options.w, slideW));
    return {
      height,
      fixed,
      render: (slide, y, h) => {
        this.pptxGenerator.addLinkElement(slide, link, fixed ? options : { ...options, y, h, valign: 'top' });
      }
    };
  }
}
