import { motion } from 'framer-motion';
import { Sparkles, Shield, Zap, FileCheck } from 'lucide-react';
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
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Powered by Claude AI</span>
                </div>

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

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <TranslateForm />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 text-center"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Supports XLSX files up to 50MB
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Feature icon={Shield} text="Secure Processing" />
                <Feature icon={Zap} text="Fast Translation" />
                <Feature icon={FileCheck} text="Format Preserved" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <span>{text}</span>
    </div>
  );
}

export default App;
