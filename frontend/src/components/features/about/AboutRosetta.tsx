import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Bot, Shield, Zap, Globe } from 'lucide-react';
import './About.css';

export function AboutRosetta() {
  return (
    <section className="about-section">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="about-section-title"
      >
        Why Rosetta Exists
      </motion.h2>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Row 1: Three equal cards - Problem, Result, Built for AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bento-card bento-card-problem"
        >
          <div className="bento-icon-wrapper bento-icon-red">
            <AlertTriangle className="bento-icon" />
          </div>
          <h3 className="bento-card-title">The Problem</h3>
          <p className="bento-card-text">
            Excel files are fragile. Translate them with standard tools or AI, and you'll break
            formulas, destroy formatting, and corrupt cell references. Businesses lose hours
            fixing what should have been simple.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bento-card bento-card-result"
        >
          <div className="bento-icon-wrapper bento-icon-green">
            <CheckCircle className="bento-icon" />
          </div>
          <h3 className="bento-card-title">The Result</h3>
          <p className="bento-card-text">
            You get back an identical file, just in a different language. Formulas work.
            Formatting intact. Merged cells preserved. Nothing breaks. Ever.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bento-card bento-card-ai"
        >
          <div className="bento-icon-wrapper bento-icon-purple">
            <Bot className="bento-icon" />
          </div>
          <h3 className="bento-card-title">Built for AI</h3>
          <p className="bento-card-text">
            Designed as infrastructure for AI. When ChatGPT, Claude, or any AI assistant needs
            to translate Excel, Rosetta handles it safely via API or MCP.
          </p>
        </motion.div>

        {/* Row 2: Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bento-card bento-card-feature"
        >
          <div className="bento-icon-wrapper bento-icon-blue">
            <Shield className="bento-icon-sm" />
          </div>
          <h4 className="bento-feature-title">Structure Preserved</h4>
          <p className="bento-feature-text">Formulas, formatting, references stay intact</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bento-card bento-card-feature"
        >
          <div className="bento-icon-wrapper bento-icon-yellow">
            <Zap className="bento-icon-sm" />
          </div>
          <h4 className="bento-feature-title">API-First</h4>
          <p className="bento-feature-text">Built for developers and AI integrations</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bento-card bento-card-feature"
        >
          <div className="bento-icon-wrapper bento-icon-teal">
            <Globe className="bento-icon-sm" />
          </div>
          <h4 className="bento-feature-title">Any Language</h4>
          <p className="bento-feature-text">Powered by Claude for accurate translation</p>
        </motion.div>
      </div>
    </section>
  );
}
