import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from './ProgressIndicator';

describe('ProgressIndicator', () => {
  it('does not render when status is idle', () => {
    const { container } = render(<ProgressIndicator status="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render when status is error', () => {
    const { container } = render(<ProgressIndicator status="error" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when status is uploading', () => {
    render(<ProgressIndicator status="uploading" />);
    expect(screen.getByText('Uploading file')).toBeInTheDocument();
  });

  it('renders when status is translating', () => {
    render(<ProgressIndicator status="translating" />);
    expect(screen.getByText('Translating content')).toBeInTheDocument();
  });

  it('renders when status is success', () => {
    render(<ProgressIndicator status="success" />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('shows all three stages', () => {
    render(<ProgressIndicator status="uploading" />);
    expect(screen.getByText('Uploading file')).toBeInTheDocument();
    expect(screen.getByText('Translating content')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('highlights current stage as active', () => {
    render(<ProgressIndicator status="translating" />);

    const uploadingStage = screen.getByText('Uploading file').closest('.progress-stage');
    const translatingStage = screen.getByText('Translating content').closest('.progress-stage');
    const completeStage = screen.getByText('Complete').closest('.progress-stage');

    expect(uploadingStage).toHaveClass('complete');
    expect(translatingStage).toHaveClass('active');
    expect(completeStage).not.toHaveClass('active');
    expect(completeStage).not.toHaveClass('complete');
  });

  it('marks all stages complete on success', () => {
    render(<ProgressIndicator status="success" />);

    const uploadingStage = screen.getByText('Uploading file').closest('.progress-stage');
    const translatingStage = screen.getByText('Translating content').closest('.progress-stage');
    const completeStage = screen.getByText('Complete').closest('.progress-stage');

    expect(uploadingStage).toHaveClass('complete');
    expect(translatingStage).toHaveClass('complete');
    expect(completeStage).toHaveClass('complete');
  });

  it('shows hint text during translation', () => {
    render(<ProgressIndicator status="translating" />);
    expect(screen.getByText(/Translation time depends on file size/)).toBeInTheDocument();
  });

  it('does not show hint text during upload', () => {
    render(<ProgressIndicator status="uploading" />);
    expect(screen.queryByText(/Translation time depends/)).not.toBeInTheDocument();
  });

  it('does not show hint text on success', () => {
    render(<ProgressIndicator status="success" />);
    expect(screen.queryByText(/Translation time depends/)).not.toBeInTheDocument();
  });
});
