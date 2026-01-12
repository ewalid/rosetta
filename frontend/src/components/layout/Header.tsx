import { Link, useLocation } from 'react-router-dom';
import { Github, Moon, Sun } from 'lucide-react';
import logo from '../../assets/logo.svg';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ isDarkMode, onToggleDarkMode }: HeaderProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 dark:bg-gray-950/80 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={logo} alt="Rosetta" className="w-10 h-10 transition-transform group-hover:scale-110" />
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              Rosetta
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`relative px-4 py-2 transition-all ${
                isActive('/')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full" />
              )}
            </Link>

            <Link
              to="/about"
              className={`relative px-4 py-2 transition-all ${
                isActive('/about')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              About
              {isActive('/about') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full" />
              )}
            </Link>

            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              onClick={() => window.open('https://github.com/ewalid/rosetta', '_blank')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="View on GitHub"
            >
              <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
