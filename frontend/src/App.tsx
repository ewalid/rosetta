import { motion } from 'framer-motion';
import { Header, Footer, Container } from './components/layout';
import { TranslateForm } from './components/features/translate';
import { useDarkMode } from './hooks';
import './App.css';

function App() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className="app">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="app-main">
        <Container size="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="hero-header">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hero-title"
              >
                Excel Translation
                <span className="hero-title-gradient">Made Simple</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hero-subtitle"
              >
                Instantly translate your Excel spreadsheets to any language while preserving formatting and structure.
              </motion.p>
            </div>

            <TranslateForm />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="features-section"
            >
              <p className="features-text">Supports XLSX and XLS files up to 50MB</p>
              <div className="features-list">
                <Feature icon="🔒" text="Secure Processing" />
                <Feature icon="⚡" text="Fast Translation" />
                <Feature icon="📊" text="Format Preserved" />
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="feature-item">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

export default App;
