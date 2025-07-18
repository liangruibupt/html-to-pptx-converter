import { HTMLContent, ConversionConfig, Section, SlideElement, SlideLayout } from '../../models';
import { SlideCreatorService, SlideCreationError } from './SlideCreatorInterface';
import { PptxGeneratorService } from '../pptx/PptxGeneratorInterface';
import { ImageHandlerService } from './ImageHandlerInterface';
import { TableHandlerService } from './TableHandlerInterface';
import { ListHandlerService } from './ListHandlerInterface';
import { LinkHandlerService } from './LinkHandlerInterface';

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
  
  /**
   * Constructor
   * 
   * @param pptxGenerator - The PPTX generator service
   * @param imageHandler - The image handler service
   * @param tableHandler - The table handler service
   * @param listHandler - The list handler service
   * @param linkHandler - The link handler service
   */
  constructor(
    pptxGenerator: PptxGeneratorService, 
    imageHandler: ImageHandlerService,
    tableHandler: TableHandlerService,
    listHandler: ListHandlerService,
    linkHandler: LinkHandlerService
  ) {
    this.pptxGenerator = pptxGenerator;
    this.imageHandler = imageHandler;
    this.tableHandler = tableHandler;
    this.listHandler = listHandler;
    this.linkHandler = linkHandler;
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
            // Prepare image options for positioning
            const imageOptions = {
              ...positions.image,
              ...element.style
            };
            
            try {
              // Process the image with the image handler
              const processedImage = await this.imageHandler.processImage(element.content, config.imageOptions);
              
              // Update the image options with the processed dimensions
              imageOptions.w = processedImage.width / 100; // Convert pixels to inches
              imageOptions.h = processedImage.height / 100; // Convert pixels to inches
              
              // Add the processed image to the slide
              this.pptxGenerator.addImageElement(slide, processedImage, imageOptions);
            } catch (error) {
              console.warn(`Failed to process image: ${error instanceof Error ? error.message : String(error)}`);
              
              // Fallback to original image if processing fails
              this.pptxGenerator.addImageElement(slide, element.content, imageOptions);
            }
          }
          break;
          
        case 'table':
          try {
            // Process the table with the table handler
            const processedTable = this.tableHandler.processTable(element.content);
            
            // Get table styling options
            const tableOptions = this.tableHandler.applyTableStyling(processedTable);
            
            // Merge with position options
            const mergedOptions = {
              ...positions.table,
              ...tableOptions,
              ...element.style
            };
            
            // Format headers and rows
            const formattedHeaders = this.tableHandler.formatHeaders(processedTable.headers);
            const formattedRows = this.tableHandler.formatRows(processedTable.rows);
            
            // Create formatted table data
            const tableData = [
              ...formattedHeaders.length > 0 ? [formattedHeaders] : [],
              ...formattedRows
            ];
            
            // Add the table to the slide with the processed data and options
            this.pptxGenerator.addTableElement(
              slide, 
              {
                ...processedTable,
                _formattedData: tableData // Add formatted data for PptxGenerator
              }, 
              mergedOptions
            );
          } catch (error) {
            console.warn(`Failed to process table: ${error instanceof Error ? error.message : String(error)}`);
            
            // Fallback to original table if processing fails
            this.pptxGenerator.addTableElement(
              slide, 
              element.content, 
              { ...positions.table, ...element.style }
            );
          }
          break;
          
        case 'list':
          try {
            // Process the list with the list handler
            const processedList = this.listHandler.processList(element.content);
            
            // Get list styling options
            const listOptions = this.listHandler.applyListStyling(processedList);
            
            // Merge with position options
            const mergedOptions = {
              ...positions.list,
              ...listOptions,
              ...element.style
            };
            
            // Format list items
            const formattedItems = this.listHandler.formatListItems(
              processedList.items,
              processedList.ordered
            );
            
            // Handle nested lists if present
            const processedItems = this.listHandler.handleNestedLists(formattedItems);
            
            // Add the list to the slide with the processed data and options
            this.pptxGenerator.addListElement(
              slide, 
              {
                ...processedList,
                items: processedItems,
                _formattedItems: processedItems // Add formatted items for PptxGenerator
              }, 
              mergedOptions
            );
          } catch (error) {
            console.warn(`Failed to process list: ${error instanceof Error ? error.message : String(error)}`);
            
            // Fallback to original list if processing fails
            this.pptxGenerator.addListElement(
              slide, 
              element.content, 
              { ...positions.list, ...element.style }
            );
          }
          break;
          
        case 'link':
          // Only add links if preserveLinks is true in the configuration
          if (config.preserveLinks) {
            try {
              // Process the link with the link handler
              const processedLink = this.linkHandler.processLink(element.content);
              
              // Get link styling options
              const linkOptions = this.linkHandler.applyLinkStyling(processedLink);
              
              // Merge with position options
              const mergedOptions = {
                ...positions.link,
                ...linkOptions,
                ...element.style
              };
              
              // Add the link to the slide with the processed data and options
              this.pptxGenerator.addLinkElement(
                slide, 
                processedLink, 
                mergedOptions
              );
            } catch (error) {
              console.warn(`Failed to process link: ${error instanceof Error ? error.message : String(error)}`);
              
              // Fallback to original link if processing fails
              this.pptxGenerator.addLinkElement(
                slide, 
                element.content, 
                { ...positions.link, ...element.style }
              );
            }
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