import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Container } from './Container';
import { FeedbackModal } from '../features/feedback';
import './Layout.css';
import '../features/feedback/Feedback.css';

export function Footer() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="footer"
      >
        <Container size="xl">
          <div className="footer-content">
            <p className="footer-built">
              Built by{' '}
              <a
                href="/about#builder"
                className="footer-author-link"
              >
                Walid
              </a>
              <span className="footer-separator">·</span>
              Powered by Claude AI
            </p>
            <div className="footer-right">
              <button
                className="footer-feedback-btn"
                onClick={() => setIsFeedbackOpen(true)}
              >
                <MessageCircle />
                Feedback
              </button>
              <span className="footer-separator">•</span>
              <a
                href="https://github.com/ewalid/rosetta"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <span className="footer-separator">•</span>
              <a
                href="https://pypi.org/project/rosetta-xl/"
                target="_blank"
                rel="noopener noreferrer"
              >
                PyPI
              </a>
            </div>
          </div>
        </Container>
      </motion.footer>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
