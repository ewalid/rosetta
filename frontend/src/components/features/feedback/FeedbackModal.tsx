import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Button } from '../../ui';
import { submitFeedback } from '../../../api/client';
import './Feedback.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Rating = 1 | 2 | 3 | 4 | 5 | null;

const ratingEmojis = [
  { value: 1 as const, emoji: '😞', label: 'Very Dissatisfied' },
  { value: 2 as const, emoji: '😕', label: 'Dissatisfied' },
  { value: 3 as const, emoji: '😐', label: 'Neutral' },
  { value: 4 as const, emoji: '😊', label: 'Satisfied' },
  { value: 5 as const, emoji: '😍', label: 'Very Satisfied' },
];

const improvements = [
  'Translation quality',
  'Speed/Performance',
  'User interface',
  'Language options',
  'File format support',
  'Documentation',
];

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState<Rating>(null);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setStep(1);
    setRating(null);
    setSelectedImprovements([]);
    setAdditionalFeedback('');
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    // Reset form after animation completes
    setTimeout(resetForm, 300);
  }, [onClose, resetForm]);

  const handleRatingSelect = useCallback((value: Rating) => {
    setRating(value);
    // Auto-advance after a short delay
    setTimeout(() => setStep(2), 400);
  }, []);

  const toggleImprovement = useCallback((improvement: string) => {
    setSelectedImprovements(prev =>
      prev.includes(improvement)
        ? prev.filter(i => i !== improvement)
        : [...prev, improvement]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await submitFeedback({
        rating: rating!,
        improvements: selectedImprovements,
        additionalFeedback: additionalFeedback || undefined,
      });
      setIsSubmitted(true);
      // Auto-close after success
      setTimeout(handleClose, 2000);
    } catch {
      // Still show success - feedback was attempted
      setIsSubmitted(true);
      setTimeout(handleClose, 2000);
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, selectedImprovements, additionalFeedback, handleClose]);

  const canProceedToStep3 = selectedImprovements.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="feedback-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="feedback-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Close button */}
            <button className="feedback-close" onClick={handleClose}>
              <X />
            </button>

            {/* Progress dots */}
            {!isSubmitted && (
              <div className="feedback-progress">
                {[1, 2, 3].map(s => (
                  <div
                    key={s}
                    className={`feedback-progress-dot ${step >= s ? 'active' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success"
                  className="feedback-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle className="feedback-success-icon" />
                  </motion.div>
                  <h3>Thank you!</h3>
                  <p>Your feedback helps us improve Rosetta.</p>
                </motion.div>
              ) : (
                <>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      className="feedback-step"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <h3 className="feedback-question">
                        How satisfied are you with Rosetta?
                      </h3>
                      <div className="feedback-rating">
                        {ratingEmojis.map(({ value, emoji, label }) => (
                          <button
                            key={value}
                            className={`feedback-emoji ${rating === value ? 'selected' : ''}`}
                            onClick={() => handleRatingSelect(value)}
                            title={label}
                          >
                            <span className="feedback-emoji-icon">{emoji}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      className="feedback-step"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <h3 className="feedback-question">
                        What could we improve?
                      </h3>
                      <p className="feedback-subtitle">Select all that apply</p>
                      <div className="feedback-improvements">
                        {improvements.map(improvement => (
                          <button
                            key={improvement}
                            className={`feedback-chip ${selectedImprovements.includes(improvement) ? 'selected' : ''}`}
                            onClick={() => toggleImprovement(improvement)}
                          >
                            {improvement}
                          </button>
                        ))}
                      </div>
                      <div className="feedback-nav">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(1)}
                          leftIcon={<ChevronLeft />}
                        >
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setStep(3)}
                          disabled={!canProceedToStep3}
                          rightIcon={<ChevronRight />}
                        >
                          Next
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      className="feedback-step"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                    >
                      <h3 className="feedback-question">
                        Any additional feedback?
                      </h3>
                      <p className="feedback-subtitle">Optional</p>
                      <textarea
                        className="feedback-textarea"
                        value={additionalFeedback}
                        onChange={e => setAdditionalFeedback(e.target.value)}
                        placeholder="Tell us more about your experience..."
                        rows={4}
                      />
                      <div className="feedback-nav">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setStep(2)}
                          leftIcon={<ChevronLeft />}
                        >
                          Back
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleSubmit}
                          isLoading={isSubmitting}
                          leftIcon={!isSubmitting ? <Send /> : undefined}
                        >
                          Submit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
