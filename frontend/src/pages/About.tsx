import { motion } from 'framer-motion';
import { Header, Footer } from '../components/layout';
import {
  AboutRosetta,
  ProfileHeader,
  Publications,
  Timeline,
} from '../components/features/about';
import { useDarkMode } from '../hooks';

export function About() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 pt-20 pb-10">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgb(16 185 129 / 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgb(16 185 129 / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
                Why <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Rosetta</span> Exists
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Translating Excel files without breaking them
              </p>
            </motion.div>

            {/* About Rosetta Bento Grid */}
            <AboutRosetta />
          </div>
        </section>

        {/* Meet the Builder Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 pt-10 pb-20" id="builder">
          {/* Animated background grid */}
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgb(16 185 129 / 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgb(16 185 129 / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Meet the Builder
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Combining years of technical experience with AI innovation
              </p>
            </motion.div>

            <ProfileHeader />

            <Timeline />

            <Publications />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;
