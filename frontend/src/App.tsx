import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { Header, Footer } from './components/layout';
import { TranslateForm } from './components/features/translate';
import { useDarkMode } from './hooks';

function App() {
  const [isDarkMode, toggleDarkMode] = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col">
      <Header isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
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

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Powered by Claude AI</span>
                </div> */}

                <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white">
                  Excel Translation
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                    Without Breaking It!
                  </span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
                  Formulas, formatting, structure. All preserved.
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                  Translate Excel. Keep everything intact.
                </p>
              </motion.div>
            </div>

            {/* Translation Form */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-3xl mx-auto"
                data-upload-section
              >
                <TranslateForm />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                What Makes Rosetta Different?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Translation that preserves your spreadsheet's integrity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Preserves all formulas', description: 'Complex formulas stay intact and fully functional throughout translation' },
                { title: 'Maintains formatting', description: 'Colors, fonts, and styles remain completely unchanged after processing' },
                { title: 'Keeps dropdown menus', description: 'Data validation and dropdown menus work perfectly in translated files' },
                { title: 'Retains structure', description: 'Sheet organization and layout are preserved exactly as original' },
                { title: 'No data loss', description: 'Every cell and value translated accurately with zero information loss' },
                { title: 'Fast processing', description: 'Quick translation without compromising quality or accuracy' }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/30"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 to-teal-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to translate your Excel files?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Experience seamless translation that preserves everything you care about
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 bg-white text-emerald-600 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
