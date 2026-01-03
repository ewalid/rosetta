import { motion } from 'framer-motion';
import { Header, Footer, Container } from '../components/layout';
import {
  AboutRosetta,
  ProfileHeader,
  Publications,
  Timeline,
} from '../components/features/about';
import { useDarkMode } from '../hooks';
import '../components/features/about/About.css';

export function About() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className="app">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="app-main" style={{ alignItems: 'flex-start', paddingTop: '6rem', paddingBottom: '2rem' }}>
        <Container size="xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {/* Section 1: About Rosetta */}
            <AboutRosetta />

            {/* Section 2: Meet the Builder */}
            <section className="builder-section" id="builder">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="builder-section-title"
              >
                Meet the Builder
              </motion.h2>

              <ProfileHeader />

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="profile-intro"
              >
                8 years in Tech, started as a full-stack software engineer at startups (Partoo, Gorgias)
                then moved to enterprise software at Adobe and Radancy where I owned the full sales cycle
                end to end. I built Rosetta to solve a real problem and to showcase what's possible when AI
                meets structured data.
              </motion.p>

              <Timeline />

              <Publications />
            </section>
          </motion.div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default About;
