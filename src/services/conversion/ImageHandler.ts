import { ImageResource, ImageProcessingOptions } from '../../models';
import { ImageHandlerService, ImageHandlingError } from './ImageHandlerInterface';

/**
 * Image Handler Service Implementation
 * 
 * This service processes and optimizes images for PPTX slides.
 * 
 * Requirements:
 * - 2.3: Allow the user to choose whether to include images from the HTML
 * - 3.3: Include images from the HTML in the PPTX output if specified in the configuration
 */
export class ImageHandler implements ImageHandlerService {
  /**
   * Process an image for PPTX output
   * 
   * @param image - The image resource to process
   * @param options - Image processing options
   * @returns Processed image resource
   */
  async processImage(image: ImageResource, options?: ImageProcessingOptions): Promise<ImageResource> {
    try {
      // If the image already has a data URL, use it
      if (image.dataUrl) {
        return this.processDataUrlImage(image, options);
      }
      
      // Load the image from URL
      const imgElement = await this.loadImageFromUrl(image.src);
      
      // Convert to data URL with processing options
      const dataUrl = this.convertToDataUrl(imgElement, options);
      
      // Calculate optimal dimensions
      const { width, height } = this.calculateOptimalDimensions(
        imgElement.naturalWidth,
        imgElement.naturalHeight,
        options?.maxWidth,
        options?.maxHeight,
        options?.preserveAspectRatio ?? true
      );
      
      // Return processed image
      return {
        ...image,
        dataUrl,
        width,
        height
      };
    } catch (error) {
      throw new ImageHandlingError(
        `Failed to process image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Process an image that already has a data URL
   * 
   * @param image - The image resource to process
   * @param options - Image processing options
   * @returns Processed image resource
   */
  private async processDataUrlImage(image: ImageResource, options?: ImageProcessingOptions): Promise<ImageResource> {
    try {
      // Create an image element from the data URL
      const imgElement = new Image();
      
      // Wait for the image to load
      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => resolve();
        imgElement.onerror = () => reject(new Error('Failed to load image from data URL'));
        imgElement.src = image.dataUrl!;
      });
      
      // Calculate optimal dimensions
      const { width, height } = this.calculateOptimalDimensions(
        imgElement.naturalWidth,
        imgElement.naturalHeight,
        options?.maxWidth,
        options?.maxHeight,
        options?.preserveAspectRatio ?? true
      );
      
      // If resizing is needed, create a new data URL
      if (
        (options?.maxWidth && width !== imgElement.naturalWidth) ||
        (options?.maxHeight && height !== imgElement.naturalHeight)
      ) {
        const dataUrl = this.resizeImage(
          imgElement,
          options?.maxWidth,
          options?.maxHeight,
          options?.preserveAspectRatio
        );
        
        return {
          ...image,
          dataUrl,
          width,
          height
        };
      }
      
      // No resizing needed, return the original image
      return {
        ...image,
        width,
        height
      };
    } catch (error) {
      throw new ImageHandlingError(
        `Failed to process data URL image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  /**
   * Load image data from URL
   * 
   * @param imageUrl - URL of the image to load
   * @returns Promise that resolves with the loaded image
   */
  async loadImageFromUrl(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new ImageHandlingError(`Failed to load image from URL: ${imageUrl}`));
      
      // Set crossOrigin to anonymous to avoid CORS issues when loading from external URLs
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    });
  }
  
  /**
   * Convert image to data URL
   * 
   * @param image - The image to convert
   * @param options - Image processing options
   * @returns Data URL of the image
   */
  convertToDataUrl(image: HTMLImageElement, options?: ImageProcessingOptions): string {
    try {
      // If resizing is needed, use the resize method
      if (
        (options?.maxWidth && options.maxWidth < image.naturalWidth) ||
        (options?.maxHeight && options.maxHeight < image.naturalHeight)
      ) {
        return this.resizeImage(
          image,
          options?.maxWidth,
          options?.maxHeight,
          options?.preserveAspectRatio
        );
      }
      
      // No resizing needed, convert directly to data URL
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new ImageHandlingError('Failed to get canvas context');
      }
      
      // Draw the image on the canvas
      ctx.drawImage(image, 0, 0);
      
      // Convert to data URL with quality option
      const quality = options?.quality !== undefined ? options.quality / 100 : 0.8;
      return canvas.toDataURL('image/jpeg', quality);
    } catch (error) {
      throw new ImageHandlingError(
        `Failed to convert image to data URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
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
    preserveAspectRatio = true
  ): string {
    try {
      // Calculate dimensions
      const { width, height } = this.calculateOptimalDimensions(
        image.naturalWidth,
        image.naturalHeight,
        maxWidth,
        maxHeight,
        preserveAspectRatio
      );
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new ImageHandlingError('Failed to get canvas context');
      }
      
      // Draw the image on the canvas with the new dimensions
      ctx.drawImage(image, 0, 0, width, height);
      
      // Convert to data URL
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (error) {
      throw new ImageHandlingError(
        `Failed to resize image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
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
    preserveAspectRatio = true
  ): { width: number; height: number } {
    // If no max dimensions are provided, return original dimensions
    if (!maxWidth && !maxHeight) {
      return { width, height };
    }
    
    let newWidth = width;
    let newHeight = height;
    
    // Apply max width if provided
    if (maxWidth && width > maxWidth) {
      newWidth = maxWidth;
      
      // Adjust height to maintain aspect ratio if needed
      if (preserveAspectRatio) {
        newHeight = Math.round((newWidth / width) * height);
      }
    }
    
    // Apply max height if provided
    if (maxHeight && newHeight > maxHeight) {
      newHeight = maxHeight;
      
      // Adjust width to maintain aspect ratio if needed
      if (preserveAspectRatio) {
        newWidth = Math.round((newHeight / height) * width);
      }
    }
    
    return { width: newWidth, height: newHeight };
  }
}