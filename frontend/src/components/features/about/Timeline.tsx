import { motion } from 'framer-motion';
import './About.css';

const timelineData = [
  {
    year: '2026-Now',
    title: 'Solutions Engineer',
    company: 'Storyblok',
    description: 'Senior Solutions Engineerfor Storyblok’s headless CMS. Technical demos, RFP, and POCs across the sales cycle.',
    image: '/storyblok.png',
  },
  {
    year: '2023-2026',
    title: 'Solutions Engineer',
    company: 'Radancy',
    description: 'End-to-end Enterprise pre-sales. Owning the full sales cycle from discovery to deal closing.',
    image: '/radancy.jpeg',
  },
  {
    year: '2022-2023',
    title: 'Solutions Consultant',
    company: 'Adobe',
    description: 'Enterprise pre-sales for Adobe Experience Manager. Technical demos, RFPs, workshops.',
    image: '/adobe.png',
  },
  {
    year: '2021-2022',
    title: 'Full-Stack Engineer',
    company: 'Gorgias',
    description: 'E-commerce helpdesk for 2,500+ businesses. Core team, owned billing system. Python, React.',
    image: '/gorgias.png',
  },
  {
    year: '2019-2021',
    title: 'Full-Stack Developer',
    company: 'Partoo',
    description: 'Local SEO platform serving 40,000+ locations. React, Python, PostgreSQL, MongoDB.',
    image: '/partoo.png',
  },
  {
    year: '2017-2019',
    title: 'Full-Stack Developer',
    company: 'Infotel',
    description: 'Web applications for banks. First professional dev role. Inhouse JS framework, Java.',
    image: '/infotel.png',
  },
];

export function Timeline() {
  return (
    <div className="experience-section">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="experience-title"
      >
        Experience & Education
      </motion.h3>

      <div className="experience-grid">
        {timelineData.map((item, index) => {
          return (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="experience-card"
            >
              <div className="experience-card-header">
                {item.image ? (
                  <div className="experience-card-image-wrapper">
                    <img
                      src={item.image}
                      alt={`${item.company} logo`}
                      className="experience-card-image"
                      loading="lazy"
                    />
                  </div>
                ) : null}
                <div className="experience-card-meta">
                  <h4 className="experience-card-title">{item.title}</h4>
                  <span className="experience-card-year">{item.year}</span>
                </div>
              </div>
              <p className="experience-card-company">{item.company}</p>
              <p className="experience-card-description">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
