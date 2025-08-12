import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import FileUpload from '../../src/components/upload/FileUpload';
// Mock react-dropzone
vi.mock('react-dropzone', () => {
    return {
        useDropzone: ({ onDropAccepted, onDropRejected }) => {
            // Store the callbacks for direct access in tests
            global.mockDropzoneCallbacks = { onDropAccepted, onDropRejected };
            return {
                getRootProps: () => ({
                    onClick: vi.fn(),
                    'data-testid': 'dropzone',
                }),
                getInputProps: () => ({
                    'data-testid': 'file-input',
                }),
                isDragActive: false,
            };
        },
    };
});
describe('FileUpload Component', () => {
    const onFileAcceptedMock = vi.fn();
    const onErrorMock = vi.fn();
    beforeEach(() => {
        onFileAcceptedMock.mockReset();
        onErrorMock.mockReset();
    });
    test('renders the file upload component', () => {
        render(_jsx(FileUpload, { onFileAccepted: onFileAcceptedMock, onError: onErrorMock }));
        expect(screen.getByText(/Drag and drop your HTML file here/i)).toBeInTheDocument();
        expect(screen.getByText(/Only .html and .htm files are accepted/i)).toBeInTheDocument();
    });
    test('handles file size validation', async () => {
        // Mock File and FileReader
        const file = new File(['<html><body>Test</body></html>'], 'test.html', { type: 'text/html' });
        Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB (exceeds limit)
        // Mock the text method
        file.text = vi.fn().mockResolvedValue('<html><body>Test</body></html>');
        render(_jsx(FileUpload, { onFileAccepted: onFileAcceptedMock, onError: onErrorMock }));
        // Directly call the onDropRejected callback with a file size error
        global.mockDropzoneCallbacks.onDropRejected([{
                file,
                errors: [{ code: 'file-too-large', message: 'File is too large' }]
            }]);
        await waitFor(() => {
            expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('File size exceeds'));
        });
    });
    test('handles file type validation', async () => {
        // Mock File with incorrect type
        const file = new File(['not html content'], 'test.txt', { type: 'text/plain' });
        render(_jsx(FileUpload, { onFileAccepted: onFileAcceptedMock, onError: onErrorMock }));
        // Directly call the handleFileRead function by simulating a drop
        global.mockDropzoneCallbacks.onDropAccepted([file]);
        await waitFor(() => {
            expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('valid HTML file'));
        });
    });
    test('handles HTML content validation', async () => {
        // Mock File with non-HTML content
        const file = new File(['not html content'], 'test.html', { type: 'text/html' });
        // Mock the text method
        file.text = vi.fn().mockResolvedValue('not html content');
        render(_jsx(FileUpload, { onFileAccepted: onFileAcceptedMock, onError: onErrorMock }));
        // Directly call the handleFileRead function by simulating a drop
        global.mockDropzoneCallbacks.onDropAccepted([file]);
        await waitFor(() => {
            expect(onErrorMock).toHaveBeenCalledWith(expect.stringContaining('valid HTML content'));
        });
    });
    test('accepts valid HTML file', async () => {
        // Mock valid HTML file
        const validHTML = '<html><body><h1>Test</h1></body></html>';
        const file = new File([validHTML], 'test.html', { type: 'text/html' });
        // Mock the text method
        file.text = vi.fn().mockResolvedValue(validHTML);
        render(_jsx(FileUpload, { onFileAccepted: onFileAcceptedMock, onError: onErrorMock }));
        // Directly call the handleFileRead function by simulating a drop
        global.mockDropzoneCallbacks.onDropAccepted([file]);
        await waitFor(() => {
            expect(onFileAcceptedMock).toHaveBeenCalledWith(validHTML);
        });
    });
});
//# sourceMappingURL=FileUpload.test.js.map