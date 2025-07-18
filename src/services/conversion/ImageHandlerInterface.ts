import { ImageResource, ImageProcessingOptions } from '../../models';

/**
 * Interface for the image handler service
 * 
 * This service is responsible for processing and optimizing images for PPTX slides.
 */
export interface ImageHandlerService {
  /**
   * Process an image for PPTX output
   * 
   * @param image - The image resource to process
   * @param options - Image processing options
   * @returns Processed image resource
   */
  processImage(image: ImageResource, options?: ImageProcessingOptions): Promise<ImageResource>;
  
  /**
   * Load image data from URL
   * 
   * @param imageUrl - URL of the image to load
   * @returns Promise that resolves with the loaded image
   */
  loadImageFromUrl(imageUrl: string): Promise<HTMLImageElement>;
  
  /**
   * Convert image to data URL
   * 
   * @param image - The image to convert
   * @param options - Image processing options
   * @returns Data URL of the image
   */
  convertToDataUrl(image: HTMLImageElement, options?: ImageProcessingOptions): string;
  
  /**
   * Resize an image
   * 
   * @param image - The image to resize
   * @param maxWidth - Maximum width of the resized image
   * @param maxHeight - Maximum height of the resized image
   * @param preserveAspectRatio - Whether to preserve the aspect ratio
   * @returns Resized image data URL
   */
  resizeImage(
    image: HTMLImageElement, 
    maxWidth?: number, 
    maxHeight?: number, 
    preserveAspectRatio?: boolean
  ): string;
  
  /**
   * Calculate optimal image dimensions
   * 
   * @param width - Original width
   * @param height - Original height
   * @param maxWidth - Maximum width
   * @param maxHeight - Maximum height
   * @param preserveAspectRatio - Whether to preserve the aspect ratio
   * @returns Optimal dimensions object with width and height
   */
  calculateOptimalDimensions(
    width: number, 
    height: number, 
    maxWidth?: number, 
    maxHeight?: number, 
    preserveAspectRatio?: boolean
  ): { width: number; height: number };
}

/**
 * Image handling error class
 * 
 * Custom error class for image handling errors
 */
export class ImageHandlingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageHandlingError';
  }
}