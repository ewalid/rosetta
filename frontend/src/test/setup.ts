import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: 'div',
      button: 'button',
      footer: 'footer',
      label: 'label',
      span: 'span',
      p: 'p',
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
