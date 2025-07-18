import pptxgen from 'pptxgenjs';
import { SlideLayout, PresentationTheme, ImageResource, TableResource, ListResource, LinkResource, TextResource } from '../../models';
import { PptxGeneratorService, PptxGenerationError } from './PptxGeneratorInterface';

/**
 * PPTX Generator Service Implementation
 * 
 * This service provides functionality to generate PPTX presentations using the PptxGenJS library.
 * 
 * Requirements:
 * - 3.1: Use PptxGenJS to convert HTML content to PPTX format
 * - 3.7: Provide meaningful error messages for conversion errors
 */
export class PptxGenerator implements PptxGeneratorService {
  /**
   * Initialize the PPTX generator
   * 
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      // PptxGenJS doesn't require explicit initialization
      // This method is provided for consistency with the interface
      // and to allow for future initialization needs
      return Promise.resolve();
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to initialize PptxGenJS: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Create a new presentation
   * 
   * @param theme - Theme to apply to the presentation
   * @returns The created presentation instance
   */
  createPresentation(theme?: PresentationTheme): any {
    try {
      // Create a new instance of PptxGenJS
      const pres = new pptxgen();
      
      // Set presentation properties
      pres.layout = 'LAYOUT_16x9';
      pres.author = 'HTML to PPTX Converter';
      pres.company = 'HTML to PPTX Converter';
      pres.subject = 'Generated from HTML content';
      
      // Apply theme if specified
      if (theme) {
        this.applyTheme(pres, theme);
      }
      
      return pres;
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to create presentation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Apply a theme to the presentation
   * 
   * @param presentation - The presentation instance
   * @param theme - Theme to apply
   */
  applyTheme(presentation: any, theme: PresentationTheme): void {
    try {
      // Define theme properties based on the selected theme
      switch (theme) {
        case PresentationTheme.PROFESSIONAL:
          presentation.theme = {
            title: 'PROFESSIONAL',
            headingColor: '0F3C5F',
            bodyColor: '333333',
            backgroundColor: 'FFFFFF'
          };
          break;
        case PresentationTheme.CREATIVE:
          presentation.theme = {
            title: 'CREATIVE',
            headingColor: '6B5B95',
            bodyColor: '333333',
            backgroundColor: 'F9F9F9'
          };
          break;
        case PresentationTheme.MINIMAL:
          presentation.theme = {
            title: 'MINIMAL',
            headingColor: '333333',
            bodyColor: '333333',
            backgroundColor: 'FFFFFF'
          };
          break;
        case PresentationTheme.DEFAULT:
        default:
          // Use default theme
          break;
      }
      
      // Define slide masters for the theme
      presentation.defineSlideMaster({
        title: theme.toString(),
        background: { color: presentation.theme?.backgroundColor || 'FFFFFF' }
      });
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to apply theme: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Add a new slide to the presentation
   * 
   * @param presentation - The presentation instance
   * @param title - Title of the slide
   * @param layout - Layout to apply to the slide
   * @returns The created slide
   */
  addSlide(presentation: any, title: string, layout?: SlideLayout): any {
    try {
      // Determine the slide layout
      let slideLayout = 'LAYOUT_16x9';
      if (layout) {
        switch (layout) {
          case SlideLayout.STANDARD:
            slideLayout = 'LAYOUT_4x3';
            break;
          case SlideLayout.WIDE:
            slideLayout = 'LAYOUT_16x9';
            break;
          case SlideLayout.CUSTOM:
            slideLayout = 'LAYOUT_16x9'; // Default to wide for custom layouts
            break;
        }
      }
      
      // Create a new slide
      const slide = presentation.addSlide();
      slide.layout = slideLayout;
      
      // Add title to the slide if it's not "Untitled"
      if (title && title !== 'Untitled') {
        slide.addText(title, {
          x: 0.5,
          y: 0.5,
          w: '90%',
          h: 1,
          fontSize: 24,
          bold: true,
          color: '333333',
          align: 'center',
          valign: 'middle'
        });
      }
      
      return slide;
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add slide: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Add a text element to a slide
   * 
   * @param slide - The slide to add the text element to
   * @param text - The text resource to add
   * @param options - Options for the text element
   */
  addTextElement(slide: any, text: TextResource, options?: any): void {
    try {
      // Extract text content (remove HTML tags if present)
      const content = this.stripHtmlTags(text.content);
      
      // Determine font size based on heading level
      let fontSize = 18;
      if (text.format.headingLevel) {
        switch (text.format.headingLevel) {
          case 1:
            fontSize = 24;
            break;
          case 2:
            fontSize = 20;
            break;
          case 3:
            fontSize = 18;
            break;
          default:
            fontSize = 16;
        }
      } else if (text.format.fontSize) {
        // Extract numeric value from fontSize string (e.g., "18px" -> 18)
        const fontSizeMatch = text.format.fontSize.match(/(\d+)/);
        if (fontSizeMatch && fontSizeMatch[1]) {
          fontSize = parseInt(fontSizeMatch[1], 10);
        }
      }
      
      // Convert color format if needed (e.g., "#FF0000" -> "FF0000")
      let color = text.format.color || '333333';
      if (color.startsWith('#')) {
        color = color.substring(1);
      }
      
      // Prepare text options
      const textOptions = {
        x: options?.x || 0.5,
        y: options?.y || 1.5,
        w: options?.w || '90%',
        h: options?.h || 1,
        fontSize: fontSize,
        color: color,
        fontFace: text.format.fontFamily || 'Arial',
        bold: text.format.bold || text.format.headingLevel ? true : false,
        italic: text.format.italic || false,
        underline: text.format.underline || false,
        strike: text.format.strikethrough || false,
        superscript: text.format.superscript || false,
        subscript: text.format.subscript || false,
        align: this.convertAlignment(text.format.alignment),
        valign: 'middle',
        ...options
      };
      
      // Add text to slide
      slide.addText(content, textOptions);
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add text element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Strip HTML tags from text content
   * 
   * @param html - HTML content to strip tags from
   * @returns Text content without HTML tags
   */
  private stripHtmlTags(html: string): string {
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
  }
  
  /**
   * Convert alignment from CSS to PptxGenJS format
   * 
   * @param alignment - CSS alignment value
   * @returns PptxGenJS alignment value
   */
  private convertAlignment(alignment?: 'left' | 'center' | 'right' | 'justify'): string {
    switch (alignment) {
      case 'center':
        return 'center';
      case 'right':
        return 'right';
      case 'justify':
        return 'justify';
      case 'left':
      default:
        return 'left';
    }
  }
  
  /**
   * Add an image element to a slide
   * 
   * @param slide - The slide to add the image element to
   * @param image - The image resource to add
   * @param options - Options for the image element
   */
  addImageElement(slide: any, image: ImageResource, options?: any): void {
    try {
      // Prepare image options
      const imageOptions = {
        x: options?.x || 1,
        y: options?.y || 2,
        w: options?.w || image.width / 100, // Convert pixels to inches (approximate)
        h: options?.h || image.height / 100, // Convert pixels to inches (approximate)
        ...options
      };
      
      // Use data URL if available, otherwise use the source URL
      const imageData = image.dataUrl || image.src;
      
      // Add image to slide
      slide.addImage({ path: imageData, ...imageOptions });
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add image element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Add a table element to a slide
   * 
   * @param slide - The slide to add the table element to
   * @param table - The table resource to add
   * @param options - Options for the table element
   */
  addTableElement(slide: any, table: TableResource, options?: any): void {
    try {
      // Check if the table has pre-formatted data
      let tableData;
      
      if ('_formattedData' in table) {
        // Use pre-formatted data if available
        tableData = table._formattedData;
      } else {
        // Prepare table data
        tableData = [];
        
        // Add headers if present
        if (table.headers && table.headers.length > 0) {
          tableData.push(table.headers.map(header => ({
            text: header,
            bold: true,
            color: '333333',
            fill: 'EEEEEE'
          })));
        }
        
        // Add rows
        table.rows.forEach(row => {
          tableData.push(row.map(cell => ({
            text: cell
          })));
        });
      }
      
      // Prepare table options
      const tableOptions = {
        x: options?.x || 0.5,
        y: options?.y || 2,
        w: options?.w || '90%',
        colW: options?.colW || Array(table.headers.length).fill(1),
        border: { pt: table.style?.border ? 1 : 0, color: '666666' },
        ...options
      };
      
      // Add table to slide
      slide.addTable(tableData, tableOptions);
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add table element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Add a list element to a slide
   * 
   * @param slide - The slide to add the list element to
   * @param list - The list resource to add
   * @param options - Options for the list element
   */
  addListElement(slide: any, list: ListResource, options?: any): void {
    try {
      // Prepare list items
      const listItems = list.items.map(item => {
        // Strip HTML tags from list items
        return this.stripHtmlTags(item);
      });
      
      // Determine bullet type based on list style
      let bullet: any = { type: 'bullet', code: '•' };
      if (list.ordered) {
        bullet = { type: 'number' };
        
        // Handle different list types (A, B, C or 1, 2, 3)
        if (list.style?.type) {
          if (list.style.type === 'A') {
            bullet.numberType = 'upperLetter';
          } else if (list.style.type === 'a') {
            bullet.numberType = 'lowerLetter';
          } else if (list.style.type === 'I') {
            bullet.numberType = 'upperRoman';
          } else if (list.style.type === 'i') {
            bullet.numberType = 'lowerRoman';
          }
        }
        
        // Handle start attribute
        if (list.style?.start && list.style.start !== '1') {
          bullet.startAt = parseInt(list.style.start, 10);
        }
      }
      
      // Prepare list options
      const listOptions = {
        x: options?.x || 0.5,
        y: options?.y || 2,
        w: options?.w || '90%',
        h: options?.h || 2,
        fontSize: 18,
        fontFace: list.style?.fontFamily || 'Arial',
        color: list.style?.color || '333333',
        bullet: bullet,
        ...options
      };
      
      // Add list to slide
      slide.addText(listItems, listOptions);
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add list element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Add a hyperlink element to a slide
   * 
   * @param slide - The slide to add the hyperlink element to
   * @param link - The link resource to add
   * @param options - Options for the hyperlink element
   */
  addLinkElement(slide: any, link: LinkResource, options?: any): void {
    try {
      // Prepare link options
      const linkOptions = {
        x: options?.x || 0.5,
        y: options?.y || 2,
        w: options?.w || '90%',
        h: options?.h || 0.5,
        fontSize: options?.fontSize || 18,
        color: '0000FF',
        underline: true,
        hyperlink: { url: link.href },
        ...options
      };
      
      // Add link to slide
      slide.addText(link.text, linkOptions);
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to add link element: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Save the presentation as a PPTX file
   * 
   * @param presentation - The presentation instance
   * @param fileName - Name of the file to save
   * @returns Promise that resolves with the generated PPTX blob
   */
  async savePresentation(presentation: any, fileName?: string): Promise<Blob> {
    try {
      // Generate a default file name if not provided
      const outputFileName = fileName || `presentation_${new Date().toISOString().replace(/[:.]/g, '-')}.pptx`;
      
      // Save the presentation as a blob
      const blob = await presentation.writeFile({ outputType: 'blob', fileName: outputFileName });
      
      return blob;
    } catch (error) {
      throw new PptxGenerationError(
        `Failed to save presentation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}