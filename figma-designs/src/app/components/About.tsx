import { motion } from 'motion/react';
import { Linkedin, Github, Mail, Award, Briefcase, GraduationCap, MessageSquare, Package, Target, Lightbulb, Globe, Code } from 'lucide-react';
import { Button } from './ui/button';
import profileImage from 'figma:asset/cdc7be7fb841e5a875d72434352edf5d6ee0db90.png';

export function About() {
  const experience = [
    {
      icon: Briefcase,
      title: 'Full-Stack Developer',
      company: 'Tech Innovation Labs',
      period: '2020 - Present',
      description: 'Led development of enterprise translation solutions using AI and cloud technologies',
      position: { top: '0%', left: '0%' }
    },
    {
      icon: Code,
      title: 'Backend Developer',
      company: 'DataFlow Systems',
      period: '2018 - 2020',
      description: 'Built scalable APIs and data processing pipelines for international clients',
      position: { top: '15%', left: '50%' }
    },
    {
      icon: GraduationCap,
      title: 'Computer Science',
      company: 'University of Technology',
      period: '2014 - 2018',
      description: 'Specialized in Machine Learning and Natural Language Processing',
      position: { top: '30%', left: '25%' }
    }
  ];

  const publications = [
    {
      title: 'Title: Preservation of credibility measures in a predicted impact of disease or computing data',
      journal: 'Scientific Publications',
      year: '2023'
    },
    {
      title: 'Integrating large language models with complex data structures',
      journal: 'AI Research Conference',
      year: '2024'
    }
  ];

  return (
    <div className="min-h-screen pt-16 relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950 py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgb(16 185 129 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(16 185 129 / 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Why <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Rosetta</span> Exists
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Born from a PhD need to share research data across borders without breaking the intricate structure of scientific Excel spreadsheets
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">The Problem</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Excel files lose their structure, formulas, and formatting during translation. Research data becomes unusable.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">The Solution</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Rosetta uses AI and smart file processing to translate while preserving every formula, dropdown, and style.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Built for AI</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Designed specifically for AI-driven language models. Claude AI ensures accurate, context-aware translations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Meet the Builder Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Meet the Builder</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Combining PhD research experience with AI innovation
            </p>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-1 shadow-2xl">
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full blur-2xl opacity-30" />
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="relative w-48 h-48 lg:w-64 lg:h-64 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                    />
                  </div>
                  
                  <div className="flex-1 text-center lg:text-left">
                    <h3 className="text-3xl lg:text-4xl font-bold mb-2">Walid El Masaid</h3>
                    <p className="text-xl text-emerald-600 dark:text-emerald-400 mb-4">PhD & Software Engineer</p>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
                      I created Rosetta to solve a real problem I faced during my PhD research. 
                      When collaborating with international partners, I needed to share complex Excel files 
                      filled with formulas, data validations, and intricate formatting. Traditional translation 
                      tools would destroy the structure, making the data unusable.
                    </p>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-6">
                      <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                        AI Enthusiast
                      </span>
                      <span className="px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full text-sm font-medium">
                        Research Scientist
                      </span>
                      <span className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">
                        Full-Stack Developer
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Linkedin className="w-4 h-4 mr-2" />
                        LinkedIn
                      </Button>
                      <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Experience & Education - Compact Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h3 className="text-3xl font-bold mb-8 text-center">Experience & Education</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experience.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{item.period}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{item.company}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Publications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold mb-8 text-center">Scientific Publications</h3>
            <div className="space-y-4">
              {publications.map((pub, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{pub.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{pub.journal} • {pub.year}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Social Links - Only visible on mobile */}
      <section className="lg:hidden py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Github className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">GitHub</span>
            </a>
            
            <a
              href="https://pypi.org/project/yourpackage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Package className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">PyPI</span>
            </a>
            
            <a
              href="https://forms.gle/yourfeedbackform"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium">Feedback</span>
            </a>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
            Built by Walid • Powered by Claude AI
          </p>
        </div>
      </section>
    </div>
  );
}