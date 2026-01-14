import { useState } from 'react';
import { FeedbackModal } from '../features/feedback';

export function Footer() {
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-900 dark:bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>
                Built by{' '}
                <a
                  href="/about#builder"
                  className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
                >
                  Walid
                </a>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                Feedback
              </button>
              <span className="text-gray-600">•</span>
              <a
                href="https://github.com/ewalid/rosetta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
              >
                GitHub
              </a>
              <span className="text-gray-600">•</span>
              <a
                href="https://pypi.org/project/rosetta-xl/"
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

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
