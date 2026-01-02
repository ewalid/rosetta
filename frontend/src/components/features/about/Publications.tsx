import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';
import './About.css';

const publications = [
  {
    title: 'High tissue-specificity of lncRNAs maximises the prediction of tissue of origin of circulating DNA',
    journal: 'bioRxiv',
    year: '2023',
    url: 'https://www.biorxiv.org/content/10.1101/2023.01.19.524838v1',
  },
  {
    title: 'Integrative systems toxicology to predict human biological systems affected by exposure to environmental chemicals',
    journal: 'Toxicology and Applied Pharmacology',
    year: '2020',
    url: 'https://www.sciencedirect.com/science/article/pii/S0041008X20303367',
  },
];

export function Publications() {
  return (
    <section className="publications-section">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="publications-title"
      >
        Scientific Publications
      </motion.h3>

      <div className="publications-grid">
        {publications.map((pub, index) => (
          <motion.a
            key={pub.url}
            href={pub.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="publication-card"
          >
            <div className="publication-icon">
              <FileText />
            </div>
            <div className="publication-content">
              <h4 className="publication-card-title">{pub.title}</h4>
              <p className="publication-meta">
                {pub.journal} · {pub.year}
              </p>
            </div>
            <ExternalLink className="publication-link-icon" />
          </motion.a>
        ))}
      </div>
    </section>
  );
}
