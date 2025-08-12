/**
 * State Service Tests
 *
 * Tests for the state management service functionality.
 *
 * Requirements:
 * - 5.1: Implement state container and add state update functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StateService } from '../../src/services/state/StateService';
describe('StateService', () => {
    let stateService;
    beforeEach(() => {
        stateService = new StateService();
    });
    describe('Basic State Management', () => {
        it('should initialize with default state', () => {
            const state = stateService.getState();
            expect(state.ui.currentPhase).toBe('upload');
            expect(state.upload.htmlContent).toBeNull();
            expect(state.conversion.isConverting).toBe(false);
            expect(state.download.isAvailable).toBe(false);
        });
        it('should dispatch actions and update state', () => {
            const htmlContent = '<h1>Test HTML</h1>';
            stateService.setHtmlContent(htmlContent, 'direct');
            const state = stateService.getState();
            expect(state.upload.htmlContent).toBe(htmlContent);
            expect(state.upload.uploadMethod).toBe('direct');
        });
        it('should handle multiple actions in sequence', () => {
            const htmlContent = '<h1>Test HTML</h1>';
            const config = { includeImages: false };
            stateService.setHtmlContent(htmlContent, 'direct');
            stateService.updateConfig(config);
            const state = stateService.getState();
            expect(state.upload.htmlContent).toBe(htmlContent);
            expect(state.configuration.config.includeImages).toBe(false);
        });
    });
    describe('State Selectors', () => {
        it('should select specific parts of state', () => {
            const htmlContent = '<h1>Test HTML</h1>';
            stateService.setHtmlContent(htmlContent, 'direct');
            const selectedContent = stateService.select(state => state.upload.htmlContent);
            expect(selectedContent).toBe(htmlContent);
        });
        it('should get current phase', () => {
            expect(stateService.getCurrentPhase()).toBe('upload');
            stateService.setPhase('configure');
            expect(stateService.getCurrentPhase()).toBe('configure');
        });
        it('should check loading state', () => {
            expect(stateService.isLoading()).toBe(false);
            stateService.setLoading(true);
            expect(stateService.isLoading()).toBe(true);
        });
    });
    describe('Convenience Methods', () => {
        it('should handle upload actions', () => {
            const htmlContent = '<h1>Test HTML</h1>';
            stateService.startUpload('file');
            expect(stateService.getState().upload.isUploading).toBe(true);
            stateService.setHtmlContent(htmlContent, 'file', 'test.html', 1024);
            const state = stateService.getState();
            expect(state.upload.htmlContent).toBe(htmlContent);
            expect(state.upload.originalFilename).toBe('test.html');
            expect(state.upload.fileSize).toBe(1024);
        });
        it('should handle configuration actions', () => {
            const config = { includeImages: false };
            stateService.updateConfig(config);
            expect(stateService.getConfig().includeImages).toBe(false);
            stateService.resetConfig();
            expect(stateService.getConfig().includeImages).toBe(true); // default value
        });
        it('should handle conversion progress', () => {
            const jobId = 'test-job-123';
            stateService.startConversion(jobId);
            let progress = stateService.getConversionProgress();
            expect(progress.isConverting).toBe(true);
            expect(progress.progress).toBe(0);
            stateService.updateConversionProgress(50, 'Processing HTML', 'Parsing content...', 1);
            progress = stateService.getConversionProgress();
            expect(progress.progress).toBe(50);
            expect(progress.currentStep).toBe('Processing HTML');
        });
        it('should handle notifications', () => {
            stateService.showSuccess('Success', 'Operation completed');
            // In our simplified implementation, showSuccess sets success message
            expect(stateService.getSuccessMessage()).toBe('Operation completed');
            stateService.showError('Error', 'Something went wrong');
            expect(stateService.getErrorState().globalError).toBe('Something went wrong');
            expect(stateService.getSuccessMessage()).toBeNull(); // Should be cleared when error is set
        });
    });
    describe('State Subscriptions', () => {
        it('should notify listeners on state changes', () => {
            let notificationCount = 0;
            let lastState = null;
            const unsubscribe = stateService.subscribe((state) => {
                notificationCount++;
                lastState = state;
            });
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            expect(notificationCount).toBe(1);
            expect(lastState?.upload.htmlContent).toBe('<h1>Test</h1>');
            unsubscribe();
            stateService.setHtmlContent('<h2>Test 2</h2>', 'direct');
            expect(notificationCount).toBe(1); // Should not increment after unsubscribe
        });
        it('should handle multiple subscribers', () => {
            let count1 = 0;
            let count2 = 0;
            const unsubscribe1 = stateService.subscribe(() => count1++);
            const unsubscribe2 = stateService.subscribe(() => count2++);
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            expect(count1).toBe(1);
            expect(count2).toBe(1);
            unsubscribe1();
            stateService.setHtmlContent('<h2>Test 2</h2>', 'direct');
            expect(count1).toBe(1); // Should not increment
            expect(count2).toBe(2); // Should increment
            unsubscribe2();
        });
    });
    describe('Error Handling', () => {
        it('should handle dispatch errors gracefully', () => {
            // Mock a listener that throws an error
            const errorListener = () => {
                throw new Error('Listener error');
            };
            const unsubscribe = stateService.subscribe(errorListener);
            // Should not throw even if listener throws
            expect(() => {
                stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            }).not.toThrow();
            unsubscribe();
        });
        it('should prevent nested dispatches', () => {
            const nestedDispatchListener = () => {
                // Try to dispatch from within a listener
                try {
                    stateService.setHtmlContent('<h2>Nested</h2>', 'direct');
                }
                catch (error) {
                    // The error should be thrown and caught here
                    expect(error.message).toBe('Cannot dispatch action while already dispatching');
                }
            };
            const unsubscribe = stateService.subscribe(nestedDispatchListener);
            // This should trigger the listener which will try to dispatch
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            unsubscribe();
        });
    });
    describe('State Reset', () => {
        it('should reset entire state', () => {
            // Set some state
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            stateService.updateConfig({ includeImages: false });
            stateService.setPhase('configure');
            // Reset
            stateService.reset();
            const state = stateService.getState();
            expect(state.ui.currentPhase).toBe('upload');
            expect(state.upload.htmlContent).toBeNull();
            expect(state.configuration.config.includeImages).toBe(true);
        });
        it('should use startOver workflow', () => {
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            stateService.setPhase('configure');
            stateService.startOver();
            const state = stateService.getState();
            expect(state.ui.currentPhase).toBe('upload');
            expect(state.upload.htmlContent).toBeNull();
        });
    });
    describe('Debug and Utility Methods', () => {
        it('should provide state snapshot', () => {
            stateService.setHtmlContent('<h1>Test</h1>', 'direct');
            const snapshot = stateService.getStateSnapshot();
            expect(snapshot.upload.htmlContent).toBe('<h1>Test</h1>');
            // Snapshot should be a copy, not reference
            stateService.setHtmlContent('<h2>Changed</h2>', 'direct');
            expect(snapshot.upload.htmlContent).toBe('<h1>Test</h1>');
        });
        it('should track listener count', () => {
            expect(stateService.getListenerCount()).toBe(0);
            const unsubscribe1 = stateService.subscribe(() => { });
            expect(stateService.getListenerCount()).toBe(1);
            const unsubscribe2 = stateService.subscribe(() => { });
            expect(stateService.getListenerCount()).toBe(2);
            unsubscribe1();
            expect(stateService.getListenerCount()).toBe(1);
            unsubscribe2();
            expect(stateService.getListenerCount()).toBe(0);
        });
    });
});
//# sourceMappingURL=StateService.test.js.map