import { HTMLContent, ConversionConfig, Section, SlideElement, SlideLayout } from '../../models';
import { SlideCreatorService, SlideCreationError } from './SlideCreatorInterface';
import { PptxGeneratorService } from '../pptx/PptxGeneratorInterface';

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
  
  /**
   * Constructor
   * 
   * @param pptxGenerator - The PPTX generator service
   */
  constructor(pptxGenerator: PptxGeneratorService) {
    this.pptxGenerator = pptxGenerator;
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
      
      // Create a new presentation with the specified theme
      const presentation = this.pptxGenerator.createPresentation(config.theme);
      
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
   * @param presentation - The presentation instance
   * @param section - The section to create a slide from
   * @param config - Conversion configuration
   * @returns The created slide
   */
  async createSlideFromSection(presentation: any, section: Section, config: ConversionConfig): Promise<any> {
    try {
      // Create a new slide with the section title and specified layout
      const slide = this.pptxGenerator.addSlide(presentation, section.title, config.slideLayout);
      
      // Apply layout-specific positioning based on the selected layout
      const layoutPositions = this.getLayoutPositions(config.slideLayout);
      
      // Process each element in the section with layout-specific positioning
      for (const element of section.elements) {
        await this.addElementToSlide(slide, element, config, layoutPositions);
      }
      
      return slide;
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
    // Define default positions
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
   * Add an element to a slide
   * 
   * @param slide - The slide to add the element to
   * @param element - The element to add
   * @param config - Conversion configuration
   * @param layoutPositions - Layout-specific positions for elements
   */
  private async addElementToSlide(
    slide: any, 
    element: SlideElement, 
    config: ConversionConfig,
    layoutPositions?: Record<string, any>
  ): Promise<void> {
    try {
      // Get layout-specific positions if not provided
      const positions = layoutPositions || this.getLayoutPositions(config.slideLayout);
      
      // Process the element based on its type
      switch (element.type) {
        case 'text':
          this.pptxGenerator.addTextElement(
            slide, 
            element.content, 
            { ...positions.text, ...element.style }
          );
          break;
          
        case 'image':
          // Only add images if includeImages is true in the configuration
          if (config.includeImages) {
            // Apply image processing options if available
            const imageOptions = {
              ...positions.image,
              ...element.style
            };
            
            // Apply image processing options from config if available
            if (config.imageOptions) {
              if (config.imageOptions.maxWidth) {
                imageOptions.w = Math.min(
                  element.content.width / 100, 
                  config.imageOptions.maxWidth / 100
                );
              }
              
              if (config.imageOptions.maxHeight) {
                imageOptions.h = Math.min(
                  element.content.height / 100, 
                  config.imageOptions.maxHeight / 100
                );
              }
              
              // Preserve aspect ratio if specified
              if (config.imageOptions.preserveAspectRatio) {
                const aspectRatio = element.content.width / element.content.height;
                if (imageOptions.w && !imageOptions.h) {
                  imageOptions.h = imageOptions.w / aspectRatio;
                } else if (imageOptions.h && !imageOptions.w) {
                  imageOptions.w = imageOptions.h * aspectRatio;
                }
              }
            }
            
            this.pptxGenerator.addImageElement(slide, element.content, imageOptions);
          }
          break;
          
        case 'table':
          this.pptxGenerator.addTableElement(
            slide, 
            element.content, 
            { ...positions.table, ...element.style }
          );
          break;
          
        case 'list':
          this.pptxGenerator.addListElement(
            slide, 
            element.content, 
            { ...positions.list, ...element.style }
          );
          break;
          
        case 'link':
          // Only add links if preserveLinks is true in the configuration
          if (config.preserveLinks) {
            this.pptxGenerator.addLinkElement(
              slide, 
              element.content, 
              { ...positions.link, ...element.style }
            );
          }
          break;
          
        default:
          console.warn(`Unknown element type: ${(element as any).type}`);
      }
    } catch (error) {
      throw new SlideCreationError(
        `Failed to add element to slide: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  // Note: The calculateElementPosition method has been removed as it was unused.
  // It could be implemented in the future for more advanced slide layout functionality.
}