/**
 * Error handling services for the HTML to PPTX converter
 */

export { ErrorHandler } from './ErrorHandler';
export {
  ErrorHandlerService,
  ConversionError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
  ConversionProcessError,
  HTMLParsingError,
  PptxGenerationError,
  SlideCreationError,
  ValidationError
} from './ErrorHandlerInterface';