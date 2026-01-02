import { motion } from 'framer-motion';
import { Languages, GraduationCap, Building2, MapPin, ShoppingCart, Palette, Briefcase } from 'lucide-react';
import './About.css';

const timelineData = [
  {
    year: '2014-2017',
    title: 'Bioinformatics Research',
    company: 'Paris Diderot / Institut Curie / Inserm',
    description: "Master's in Bioinformatics. Published 2 scientific papers on systems toxicology and circulating DNA.",
    icon: GraduationCap,
    color: 'blue',
  },
  {
    year: '2017-2019',
    title: 'Full-Stack Developer',
    company: 'Infotel',
    description: 'Web applications for banks. First professional dev role.',
    icon: Building2,
    color: 'slate',
  },
  {
    year: '2019-2021',
    title: 'Full-Stack Developer',
    company: 'Partoo',
    description: 'Local SEO platform serving 40,000+ locations. React, Python, PostgreSQL, MongoDB.',
    icon: MapPin,
    color: 'green',
  },
  {
    year: '2021-2022',
    title: 'Full-Stack Engineer',
    company: 'Gorgias',
    description: 'E-commerce helpdesk for 2,500+ businesses. Core team, owned billing system. Python, React.',
    icon: ShoppingCart,
    color: 'yellow',
  },
  {
    year: '2022-2023',
    title: 'Solutions Consultant',
    company: 'Adobe',
    description: 'Enterprise pre-sales for Adobe Experience Manager. Technical demos, RFPs, workshops.',
    icon: Palette,
    color: 'red',
  },
  {
    year: '2023-Now',
    title: 'Solutions Engineer',
    company: 'Radancy',
    description: 'End-to-end enterprise sales. ~€600k TCV closed in Q3-Q4 2025. Discovery to deal closing.',
    icon: Briefcase,
    color: 'purple',
  },
  {
    year: '2024',
    title: 'AI Builder',
    company: 'Rosetta',
    description: 'Building the Excel translation API for AI-first workflows.',
    icon: Languages,
    color: 'accent',
  },
];

export function Timeline() {
  return (
    <div className="timeline-container">
      <div className="timeline-grid">
        {timelineData.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={`timeline-card timeline-card-${item.color}`}
            >
              <div className="timeline-card-header">
                <div className={`timeline-card-icon timeline-icon-${item.color}`}>
                  <Icon />
                </div>
                <span className="timeline-card-year">{item.year}</span>
              </div>
              <h4 className="timeline-card-title">{item.title}</h4>
              <p className="timeline-card-company">{item.company}</p>
              <p className="timeline-card-description">{item.description}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
