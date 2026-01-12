import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, Globe, Shield, Sparkles, ArrowRight, Check, Github, Package, MessageSquare } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { Button } from './ui/button';
import { ProgressBar } from './ProgressBar';
import { StickyCard } from './StickyCard';

export function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStep, setTranslationStep] = useState<'uploading' | 'translating' | 'complete'>('uploading');
  const [progress, setProgress] = useState(0);

  const uploadSectionRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 1]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
  ];

  const features = [
    'Preserves all formulas',
    'Maintains formatting',
    'Keeps dropdown menus',
    'Retains structure',
    'No data loss',
    'Fast processing'
  ];

  useEffect(() => {
    if (isTranslating) {
      const interval = setInterval(() => {
        setProgress(prev => prev + 1);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isTranslating]);

  return (
    <div className="min-h-screen pt-16 relative">
      {/* Sticky Social Card */}
      <StickyCard />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgb(16 185 129 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(16 185 129 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
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
              
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
                Excel Translation
                <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Without Breaking It!
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
                Formulas, formatting, and structure — preserved.
              </p>
              <p className="text-gray-500 dark:text-gray-500">
                Translate Excel, keep everything intact.
              </p>
            </motion.div>
          </div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
            data-upload-section
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Translate Your Excel Files
                </h2>
                
                {/* File Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                      {file ? (
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    
                    {file ? (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Drag and drop your Excel file
                        </p>
                        <p className="text-sm text-gray-500">
                          or click to browse (XLSX, XLS supported)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Source Language
                    </label>
                    <select
                      value={sourceLanguage}
                      onChange={(e) => setSourceLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="auto">Auto-detect</option>
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Target Language
                    </label>
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select language</option>
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Translate Button */}
                <Button
                  disabled={!file || !targetLanguage}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-6 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Translate File
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Supports files up to 50MB • Fast Translation • Format Preserved
                </p>
              </div>

              {/* Features Bar */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-center gap-8 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Secure Processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Fast Translation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Format Preserved</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Makes Rosetta Different?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Translation that preserves your spreadsheet's integrity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
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
                  <h3 className="font-semibold text-lg mb-1">{feature}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your Excel files remain fully functional after translation
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
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-6 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Built by <span className="text-emerald-400 font-medium">Walid</span></span>
              <span className="text-gray-600">•</span>
              <span>Powered by Claude AI</span>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="https://forms.gle/yourfeedbackform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Feedback
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://github.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                GitHub
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://pypi.org/project/yourpackage"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                PyPI
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}