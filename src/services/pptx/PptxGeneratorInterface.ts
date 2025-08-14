import { SlideLayout, PresentationTheme, ImageResource, TableResource, ListResource, LinkResource, TextResource } from '../../models';

/**
 * Interface for the PPTX generator service
 * 
 * This service is responsible for generating PPTX presentations using the PptxGenJS library.
 * It provides methods for creating slides, adding elements to slides, and saving the presentation.
 */
export interface PptxGeneratorService {
  /**
   * Initialize the PPTX generator
   * 
   * @returns Promise that resolves when initialization is complete
   */
  initialize(): Promise<void>;
  
  /**
   * Create a new presentation
   * 
   * @param theme - Theme to apply to the presentation
   * @returns The created presentation instance
   */
  createPresentation(theme?: PresentationTheme): any;
  
  /**
   * Add a new slide to the presentation
   * 
   * @param presentation - The presentation instance
   * @param title - Title of the slide
   * @param layout - Layout to apply to the slide
   * @returns The created slide
   */
  addSlide(presentation: any, title: string, layout?: SlideLayout): any;
  
  /**
   * Add a text element to a slide
   * 
   * @param slide - The slide to add the text element to
   * @param text - The text resource to add
   * @param options - Options for the text element
   */
  addTextElement(slide: any, text: TextResource, options?: any): void;
  
  /**
   * Add an image element to a slide
   * 
   * @param slide - The slide to add the image element to
   * @param image - The image resource to add
   * @param options - Options for the image element
   */
  addImageElement(slide: any, image: ImageResource, options?: any): void;
  
  /**
   * Add a table element to a slide
   * 
   * @param slide - The slide to add the table element to
   * @param table - The table resource to add
   * @param options - Options for the table element
   */
  addTableElement(slide: any, table: TableResource, options?: any): void;
  
  /**
   * Add a list element to a slide
   * 
   * @param slide - The slide to add the list element to
   * @param list - The list resource to add
   * @param options - Options for the list element
   */
  addListElement(slide: any, list: ListResource, options?: any): void;
  
  /**
   * Add a hyperlink element to a slide
   * 
   * @param slide - The slide to add the hyperlink element to
   * @param link - The link resource to add
   * @param options - Options for the hyperlink element
   */
  addLinkElement(slide: any, link: LinkResource, options?: any): void;
  
  /**
   * Save the presentation as a PPTX file
   * 
   * @param presentation - The presentation instance
   * @param fileName - Name of the file to save
   * @returns Promise that resolves with the generated PPTX blob
   */
  savePresentation(presentation: any, fileName?: string): Promise<Blob>;
}

/**
 * PPTX generation error class
 * 
 * Custom error class for PPTX generation errors
 */
export class PptxGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PptxGenerationError';
  }
}