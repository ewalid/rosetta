import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackModal } from './FeedbackModal';

// Mock the API client
vi.mock('../../../api/client', () => ({
  submitFeedback: vi.fn(),
}));

import { submitFeedback } from '../../../api/client';

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open', () => {
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('How satisfied are you with Rosetta?')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<FeedbackModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('How satisfied are you with Rosetta?')).not.toBeInTheDocument();
  });

  it('shows rating emojis on step 1', () => {
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Check for emoji buttons (5 ratings)
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    expect(emojiButtons).toHaveLength(5);
  });

  it('advances to step 2 when rating is selected', async () => {
    const user = userEvent.setup();
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Click the "Very Satisfied" emoji (last one)
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[4]);

    // Wait for step 2 to appear
    await waitFor(() => {
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });
  });

  it('shows improvement chips on step 2', async () => {
    const user = userEvent.setup();
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Select a rating to advance
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[2]);

    await waitFor(() => {
      expect(screen.getByText('Translation quality')).toBeInTheDocument();
      expect(screen.getByText('Speed/Performance')).toBeInTheDocument();
      expect(screen.getByText('User interface')).toBeInTheDocument();
    });
  });

  it('allows selecting multiple improvements', async () => {
    const user = userEvent.setup();
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Select rating
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[3]);

    await waitFor(() => {
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    // Select improvements
    await user.click(screen.getByText('Translation quality'));
    await user.click(screen.getByText('User interface'));

    // Both should be selected
    expect(screen.getByText('Translation quality').closest('button')).toHaveClass('selected');
    expect(screen.getByText('User interface').closest('button')).toHaveClass('selected');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('submits feedback successfully', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.mocked(submitFeedback).mockResolvedValueOnce({ success: true });

    render(<FeedbackModal isOpen={true} onClose={onClose} />);

    // Step 1: Select rating
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[4]);

    // Step 2: Select improvements
    await waitFor(() => {
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Translation quality'));
    await user.click(screen.getByText('Next'));

    // Step 3: Add feedback and submit
    await waitFor(() => {
      expect(screen.getByText('Any additional feedback?')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/Tell us more/);
    await user.type(textarea, 'Great tool!');

    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith({
        rating: 5,
        improvements: ['Translation quality'],
        additionalFeedback: 'Great tool!',
      });
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    vi.mocked(submitFeedback).mockResolvedValueOnce({ success: true });

    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Complete the flow
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[4]);

    await waitFor(() => screen.getByText('What could we improve?'));
    await user.click(screen.getByText('Speed/Performance'));
    await user.click(screen.getByText('Next'));

    await waitFor(() => screen.getByText('Any additional feedback?'));
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });
  });

  it('allows navigating back between steps', async () => {
    const user = userEvent.setup();
    render(<FeedbackModal isOpen={true} onClose={() => {}} />);

    // Go to step 2
    const emojiButtons = screen.getAllByRole('button').filter(
      btn => btn.classList.contains('feedback-emoji')
    );
    await user.click(emojiButtons[2]);

    await waitFor(() => screen.getByText('What could we improve?'));
    await user.click(screen.getByText('User interface'));
    await user.click(screen.getByText('Next'));

    // Go to step 3
    await waitFor(() => screen.getByText('Any additional feedback?'));

    // Go back to step 2
    await user.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(screen.getByText('What could we improve?')).toBeInTheDocument();
    });

    // Go back to step 1
    await user.click(screen.getByText('Back'));
    await waitFor(() => {
      expect(screen.getByText('How satisfied are you with Rosetta?')).toBeInTheDocument();
    });
  });
});
