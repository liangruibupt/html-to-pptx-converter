/**
 * Error handling services for the HTML to PPTX converter
 */

export { ErrorHandler } from './ErrorHandler';
export type {
  ErrorHandlerService,
  ConversionError,
  ErrorContext
} from './ErrorHandlerInterface';
export {
  ErrorSeverity,
  ErrorCategory,
  ConversionProcessError,
  HTMLParsingError,
  PptxGenerationError,
  SlideCreationError,
  ValidationError
} from './ErrorHandlerInterface';