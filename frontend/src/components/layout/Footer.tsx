import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Container } from './Container';
import './Layout.css';

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="footer"
    >
      <Container size="xl">
        <div className="footer-content">
          <p className="footer-built">
            Built with
            <Heart className="footer-heart" />
            using Claude AI
          </p>
          <p className="footer-links">
            <a
              href="https://github.com/ewalid/rosetta"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
            <span className="footer-separator">•</span>
            <a
              href="https://pypi.org/project/rosetta-xl/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PyPI Package
            </a>
          </p>
        </div>
      </Container>
    </motion.footer>
  );
}
