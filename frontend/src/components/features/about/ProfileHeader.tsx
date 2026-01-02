import { motion } from 'framer-motion';
import { MapPin, Linkedin, Github, Mail } from 'lucide-react';
import './About.css';

export function ProfileHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="profile-header"
    >
      <div className="profile-avatar">
        <img src="/walid.jpeg" alt="Walid El M'selmi" className="profile-avatar-img" />
      </div>

      <div className="profile-info">
        <h3 className="profile-name">Walid El M'selmi</h3>
        <p className="profile-title">Solutions Engineer · Full-Stack Dev · AI Builder</p>
        <div className="profile-meta">
          <span className="profile-location">
            <MapPin className="profile-meta-icon" />
            Paris, France
          </span>
          <span className="profile-cta">Open to AI opportunities</span>
        </div>
      </div>

      <div className="profile-links">
        <a
          href="https://www.linkedin.com/in/walid-elmselmi/"
          target="_blank"
          rel="noopener noreferrer"
          className="profile-link profile-link-linkedin"
          aria-label="LinkedIn"
        >
          <Linkedin />
          <span>LinkedIn</span>
        </a>
        <a
          href="https://github.com/ewalid"
          target="_blank"
          rel="noopener noreferrer"
          className="profile-link profile-link-github"
          aria-label="GitHub"
        >
          <Github />
          <span>GitHub</span>
        </a>
        <a
          href="mailto:w.elmselmi@gmail.com"
          className="profile-link profile-link-email"
          aria-label="Email"
        >
          <Mail />
          <span>Email</span>
        </a>
      </div>
    </motion.div>
  );
}
