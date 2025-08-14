import { HTMLContent, ConversionConfig, Section } from '../../models';

/**
 * Interface for the slide creator service
 * 
 * This service is responsible for creating slides from HTML content based on the provided configuration.
 */
export interface SlideCreatorService {
  /**
   * Create slides from HTML content
   * 
   * @param htmlContent - Parsed HTML content
   * @param config - Conversion configuration
   * @returns The created presentation instance
   */
  createSlides(htmlContent: HTMLContent, config: ConversionConfig): Promise<any>;
  
  /**
   * Create a slide from a section
   * 
   * @param presentation - The presentation instance
   * @param section - The section to create a slide from
   * @param config - Conversion configuration
   * @returns The created slide
   */
  createSlideFromSection(presentation: any, section: Section, config: ConversionConfig): Promise<any>;
}

/**
 * Slide creation error class
 * 
 * Custom error class for slide creation errors
 */
export class SlideCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SlideCreationError';
  }
}