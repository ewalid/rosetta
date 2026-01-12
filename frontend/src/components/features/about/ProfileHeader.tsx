import { motion } from 'framer-motion';
import { Linkedin, Github, Mail } from 'lucide-react';
import './About.css';

export function ProfileHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="profile-card-wrapper"
    >
      <div className="profile-card-gradient">
        <div className="profile-card">
          <div className="profile-card-content">
            <div className="profile-image-wrapper">
              <div className="profile-image-glow" />
              <img 
                src="/walid.jpeg" 
                alt="Walid El M'selmi" 
                className="profile-image" 
              />
            </div>
            
            <div className="profile-card-info">
              <h3 className="profile-card-name">Walid El M'selmi</h3>
              <p className="profile-card-title">Solutions Engineer · Full-Stack Dev · AI Builder</p>
              <p className="profile-card-description">
                8 years in Tech, started as a full-stack software engineer at startups (Partoo, Gorgias)
                then moved to enterprise Solutions Engineering at Adobe and Radancy where I owned the full sales cycle
                end to end. I built Rosetta to solve a real problem and to showcase what's possible when AI
                meets structured data.
              </p>
              
              <div className="profile-badges">
                <span className="profile-badge profile-badge-emerald">AI Enthusiast</span>
                <span className="profile-badge profile-badge-teal">Research Scientist</span>
                <span className="profile-badge profile-badge-emerald">Full-Stack Developer</span>
              </div>

              <div className="profile-card-buttons">
                <a
                  href="https://www.linkedin.com/in/walid-elmselmi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-button profile-button-primary"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                </a>
                <a
                  href="mailto:w.elmselmi@gmail.com"
                  className="profile-button profile-button-secondary"
                >
                  <Mail className="w-5 h-5" />
                  Contact
                </a>
                <a
                  href="https://github.com/ewalid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-button profile-button-github"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
