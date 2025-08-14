/**
 * Download services for the HTML to PPTX converter
 */

export { DownloadService } from './DownloadService';
export { DownloadErrorHandler } from './DownloadErrorHandler';
export type {
  DownloadService as DownloadServiceInterface,
  DownloadOptions,
  DownloadResult,
  FileInfo
} from './DownloadServiceInterface';
export {
  DownloadError
} from './DownloadServiceInterface';