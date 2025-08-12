import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DownloadButton } from '../../src/components/download/DownloadButton';
// Mock the DownloadService
vi.mock('../../src/services/download', () => ({
    DownloadService: vi.fn().mockImplementation(() => ({
        downloadPptx: vi.fn().mockReturnValue({
            filename: 'test.pptx',
            size: 1024,
            downloadUrl: 'blob:mock-url',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            preparedAt: new Date(),
            autoTriggered: false
        }),
        triggerDownload: vi.fn().mockResolvedValue(undefined),
        cleanupDownload: vi.fn(),
        isDownloadSupported: vi.fn().mockReturnValue(true)
    })),
    DownloadError: class DownloadError extends Error {
        constructor(message, code = 'DOWNLOAD_ERROR') {
            super(message);
            this.name = 'DownloadError';
            this.code = code;
        }
    }
}));
describe('DownloadButton', () => {
    let mockBlob;
    beforeEach(() => {
        mockBlob = new Blob(['test content'], {
            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        });
        Object.defineProperty(mockBlob, 'size', { value: 1024 });
    });
    it('should render download button with default text', () => {
        render(_jsx(DownloadButton, { blob: mockBlob }));
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByText('Download PPTX')).toBeInTheDocument();
    });
    it('should render custom button text', () => {
        render(_jsx(DownloadButton, { blob: mockBlob, children: "Custom Download Text" }));
        expect(screen.getByText('Custom Download Text')).toBeInTheDocument();
    });
    it('should be disabled when no blob is provided', () => {
        render(_jsx(DownloadButton, {}));
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
    it('should be disabled when explicitly disabled', () => {
        render(_jsx(DownloadButton, { blob: mockBlob, disabled: true }));
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });
    it('should show download icon by default', () => {
        render(_jsx(DownloadButton, { blob: mockBlob }));
        const icon = screen.getByText('⬇');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('download-icon');
    });
    it('should hide download icon when showIcon is false', () => {
        render(_jsx(DownloadButton, { blob: mockBlob, showIcon: false }));
        expect(screen.queryByText('⬇')).not.toBeInTheDocument();
    });
    it('should apply correct CSS classes for variant and size', () => {
        render(_jsx(DownloadButton, { blob: mockBlob, variant: "secondary", size: "large", className: "custom-class" }));
        const button = screen.getByRole('button');
        expect(button).toHaveClass('download-button');
        expect(button).toHaveClass('secondary');
        expect(button).toHaveClass('large');
        expect(button).toHaveClass('custom-class');
    });
    it('should trigger download when clicked', async () => {
        const onDownloadStart = vi.fn();
        const onDownloadComplete = vi.fn();
        render(_jsx(DownloadButton, { blob: mockBlob, onDownloadStart: onDownloadStart, onDownloadComplete: onDownloadComplete }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(onDownloadStart).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(onDownloadComplete).toHaveBeenCalledTimes(1);
        });
    });
    it('should show downloading state during download', async () => {
        // Mock a slow download
        const { DownloadService } = await import('../../src/services/download');
        const mockService = new DownloadService();
        mockService.triggerDownload = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        render(_jsx(DownloadButton, { blob: mockBlob }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        // Should show downloading state
        expect(screen.getByText('Downloading...')).toBeInTheDocument();
        expect(screen.getByText('⟳')).toBeInTheDocument();
        expect(button).toHaveClass('downloading');
        // Wait for download to complete
        await waitFor(() => {
            expect(screen.getByText('Download PPTX')).toBeInTheDocument();
        });
    });
    it('should handle download errors', async () => {
        const onDownloadError = vi.fn();
        // Mock download service to throw error
        const { DownloadService, DownloadError } = await import('../../src/services/download');
        const mockService = new DownloadService();
        mockService.triggerDownload = vi.fn().mockRejectedValue(new DownloadError('Download failed', 'TRIGGER_FAILED'));
        render(_jsx(DownloadButton, { blob: mockBlob, onDownloadError: onDownloadError }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        await waitFor(() => {
            expect(onDownloadError).toHaveBeenCalledTimes(1);
            expect(onDownloadError).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Download failed'),
                code: expect.any(String)
            }));
        });
    });
    it('should not trigger download when disabled', () => {
        const onDownloadStart = vi.fn();
        render(_jsx(DownloadButton, { blob: mockBlob, disabled: true, onDownloadStart: onDownloadStart }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(onDownloadStart).not.toHaveBeenCalled();
    });
    it('should not trigger download when already downloading', async () => {
        const onDownloadStart = vi.fn();
        // Mock a slow download
        const { DownloadService } = await import('../../src/services/download');
        const mockService = new DownloadService();
        mockService.triggerDownload = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        render(_jsx(DownloadButton, { blob: mockBlob, onDownloadStart: onDownloadStart }));
        const button = screen.getByRole('button');
        // First click
        fireEvent.click(button);
        expect(onDownloadStart).toHaveBeenCalledTimes(1);
        // Second click while downloading
        fireEvent.click(button);
        expect(onDownloadStart).toHaveBeenCalledTimes(1); // Should not be called again
    });
    it('should have proper accessibility attributes', () => {
        render(_jsx(DownloadButton, { blob: mockBlob }));
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Download PPTX file');
        expect(button).toHaveAttribute('title', 'Click to download PPTX file');
    });
    it('should update accessibility attributes when downloading', async () => {
        // Mock a slow download
        const { DownloadService } = await import('../../src/services/download');
        const mockService = new DownloadService();
        mockService.triggerDownload = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        render(_jsx(DownloadButton, { blob: mockBlob }));
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(button).toHaveAttribute('aria-label', 'Downloading...');
        expect(button).toHaveAttribute('title', 'Downloading...');
    });
    it('should show not available message when download is not supported', () => {
        // Mock download service to return false for isDownloadSupported
        const { DownloadService } = require('../../src/services/download');
        const mockService = new DownloadService();
        mockService.isDownloadSupported = vi.fn().mockReturnValue(false);
        render(_jsx(DownloadButton, { blob: mockBlob }));
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('title', 'Download not available');
    });
});
//# sourceMappingURL=DownloadButton.test.js.map