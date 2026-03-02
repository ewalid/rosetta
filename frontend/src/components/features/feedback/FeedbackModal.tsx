import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronRight, ChevronLeft, CheckCircle, Star } from 'lucide-react';
import { Button } from '../../ui';
import { submitFeedback } from '../../../api/client';
import './Feedback.css';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Rating = 1 | 2 | 3 | 4 | 5 | null;

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
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = useCallback(() => {
    setStep(1);
    setRating(null);
    setSelectedImprovements([]);
    setAdditionalFeedback('');
    setEmail('');
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
        email: email.trim() || undefined,
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
  }, [rating, selectedImprovements, additionalFeedback, email, handleClose]);

  const canProceedToStep3 = true;

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
                      <div className="feedback-stars" role="group" aria-label="Rate 1 to 5 stars">
                        {[1, 2, 3, 4, 5].map(value => (
                          <button
                            key={value}
                            type="button"
                            className={`feedback-star ${rating !== null && value <= rating ? 'filled' : ''}`}
                            onClick={() => handleRatingSelect(value as Rating)}
                            title={`${value} star${value === 1 ? '' : 's'} out of 5`}
                            aria-label={`${value} star${value === 1 ? '' : 's'} out of 5`}
                            aria-pressed={rating === value}
                          >
                            <Star
                              size={32}
                              strokeWidth={1.5}
                              fill={rating !== null && value <= rating ? 'currentColor' : 'none'}
                            />
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
                      <label className="feedback-email-label" htmlFor="feedback-email">
                        Email (optional)
                      </label>
                      <p className="feedback-subtitle feedback-email-hint">
                        So we can get back to you about your feedback.
                      </p>
                      <input
                        id="feedback-email"
                        type="email"
                        className="feedback-email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
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
