import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConversionProgress } from '../../src/components/progress/ConversionProgress';
describe('ConversionProgress', () => {
    const defaultProps = {
        progress: 50,
        status: 'processing',
        currentStep: 'Creating slides',
        message: 'Processing your content...',
        currentStepIndex: 2
    };
    it('should render progress bar with correct percentage', () => {
        render(_jsx(ConversionProgress, { ...defaultProps }));
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '50');
        expect(progressBar).toHaveAttribute('aria-valuemin', '0');
        expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        const percentage = screen.getByText('50%');
        expect(percentage).toBeInTheDocument();
    });
    it('should display current status and message', () => {
        render(_jsx(ConversionProgress, { ...defaultProps }));
        expect(screen.getByText('Converting...')).toBeInTheDocument();
        expect(screen.getByText('Processing your content...')).toBeInTheDocument();
    });
    it('should show steps when showSteps is true', () => {
        const steps = ['Step 1', 'Step 2', 'Step 3'];
        render(_jsx(ConversionProgress, { ...defaultProps, steps: steps, showSteps: true, currentStepIndex: 1 }));
        steps.forEach(step => {
            expect(screen.getByText(step)).toBeInTheDocument();
        });
    });
    it('should hide steps when showSteps is false', () => {
        const steps = ['Step 1', 'Step 2', 'Step 3'];
        render(_jsx(ConversionProgress, { ...defaultProps, steps: steps, showSteps: false }));
        steps.forEach(step => {
            expect(screen.queryByText(step)).not.toBeInTheDocument();
        });
    });
    it('should show cancel button when showCancel is true and status is processing', () => {
        const onCancel = vi.fn();
        render(_jsx(ConversionProgress, { ...defaultProps, showCancel: true, onCancel: onCancel }));
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeInTheDocument();
        fireEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
    it('should not show cancel button when status is completed', () => {
        const onCancel = vi.fn();
        render(_jsx(ConversionProgress, { ...defaultProps, status: "completed", showCancel: true, onCancel: onCancel }));
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
    it('should display success message when status is completed', () => {
        render(_jsx(ConversionProgress, { ...defaultProps, status: "completed", progress: 100 }));
        expect(screen.getByText('Conversion completed!')).toBeInTheDocument();
        expect(screen.getByText('Success: Your presentation has been generated successfully!')).toBeInTheDocument();
    });
    it('should display error message when status is error', () => {
        render(_jsx(ConversionProgress, { ...defaultProps, status: "error", message: "Something went wrong" }));
        expect(screen.getByText('Conversion failed')).toBeInTheDocument();
        expect(screen.getByText('Error: Something went wrong')).toBeInTheDocument();
    });
    it('should apply correct CSS classes based on status', () => {
        const { rerender } = render(_jsx(ConversionProgress, { ...defaultProps, status: "processing" }));
        let container = screen.getByText('Converting...').closest('.conversion-progress');
        expect(container).toHaveClass('processing');
        rerender(_jsx(ConversionProgress, { ...defaultProps, status: "completed" }));
        container = screen.getByText('Conversion completed!').closest('.conversion-progress');
        expect(container).toHaveClass('completed');
        rerender(_jsx(ConversionProgress, { ...defaultProps, status: "error" }));
        container = screen.getByText('Conversion failed').closest('.conversion-progress');
        expect(container).toHaveClass('error');
    });
    it('should handle progress values outside 0-100 range', () => {
        const { rerender } = render(_jsx(ConversionProgress, { ...defaultProps, progress: -10 }));
        let progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '-10');
        rerender(_jsx(ConversionProgress, { ...defaultProps, progress: 150 }));
        progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '150');
    });
    it('should mark steps as completed, active, or failed correctly', () => {
        const steps = ['Step 1', 'Step 2', 'Step 3'];
        render(_jsx(ConversionProgress, { ...defaultProps, steps: steps, currentStepIndex: 1, status: "processing", showSteps: true }));
        // First step should be completed
        const step1 = screen.getByText('Step 1').closest('.progress-step');
        expect(step1).toHaveClass('completed');
        // Second step should be active
        const step2 = screen.getByText('Step 2').closest('.progress-step');
        expect(step2).toHaveClass('active');
        // Third step should be neither completed nor active
        const step3 = screen.getByText('Step 3').closest('.progress-step');
        expect(step3).not.toHaveClass('completed');
        expect(step3).not.toHaveClass('active');
    });
    it('should mark current step as failed when status is error', () => {
        const steps = ['Step 1', 'Step 2', 'Step 3'];
        render(_jsx(ConversionProgress, { ...defaultProps, steps: steps, currentStepIndex: 1, status: "error", showSteps: true }));
        const step2 = screen.getByText('Step 2').closest('.progress-step');
        expect(step2).toHaveClass('failed');
    });
    it('should apply custom className', () => {
        render(_jsx(ConversionProgress, { ...defaultProps, className: "custom-class" }));
        const container = screen.getByText('Converting...').closest('.conversion-progress');
        expect(container).toHaveClass('custom-class');
    });
    it('should have proper accessibility attributes', () => {
        render(_jsx(ConversionProgress, { ...defaultProps }));
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label', 'Conversion progress: 50%');
        // Check for error alert role when status is error
        const { rerender } = render(_jsx(ConversionProgress, { ...defaultProps, status: "error", message: "Error occurred" }));
        rerender(_jsx(ConversionProgress, { ...defaultProps, status: "error", message: "Error occurred" }));
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        // Check for success status role when completed
        rerender(_jsx(ConversionProgress, { ...defaultProps, status: "completed" }));
        const successMessage = screen.getByRole('status');
        expect(successMessage).toBeInTheDocument();
    });
});
//# sourceMappingURL=ConversionProgress.test.js.map