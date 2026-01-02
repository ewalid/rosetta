import { motion } from 'framer-motion';
import { Languages, Github, Moon, Sun } from 'lucide-react';
import { Container } from './Container';
import { Button } from '../ui';
import './Layout.css';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="header"
    >
      <Container size="xl">
        <div className="header-container">
          <motion.a
            href="/"
            className="header-logo"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="header-logo-icon">
              <Languages />
            </div>
            <span className="header-logo-text">Rosetta</span>
          </motion.a>

          <div className="header-actions">
            <a href="/about" className="header-about-link">
              About
            </a>

            <Button
              variant="ghost"
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <motion.div
                initial={false}
                animate={{ rotate: isDarkMode ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="header-icon-btn"
              >
                {isDarkMode ? <Sun /> : <Moon />}
              </motion.div>
            </Button>

            <Button
              variant="ghost"
              onClick={() => window.open('https://github.com/ewalid/rosetta', '_blank')}
              aria-label="View on GitHub"
            >
              <div className="header-icon-btn">
                <Github />
              </div>
            </Button>
          </div>
        </div>
      </Container>
    </motion.header>
  );
}
