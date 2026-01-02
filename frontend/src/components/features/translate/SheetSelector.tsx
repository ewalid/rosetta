import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Layers } from 'lucide-react';
import { cn } from '../../../lib/utils';
import './Translate.css';

interface SheetSelectorProps {
  sheets: string[];
  selectedSheets: string[];
  onChange: (sheets: string[]) => void;
  disabled?: boolean;
}

export function SheetSelector({
  sheets,
  selectedSheets,
  onChange,
  disabled = false,
}: SheetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleSheet = (sheet: string) => {
    if (selectedSheets.includes(sheet)) {
      onChange(selectedSheets.filter((s) => s !== sheet));
    } else {
      onChange([...selectedSheets, sheet]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === sheets.length) {
      onChange([]);
    } else {
      onChange([...sheets]);
    }
  };

  const getDisplayText = () => {
    if (selectedSheets.length === 0 || selectedSheets.length === sheets.length) {
      return 'All sheets';
    }
    if (selectedSheets.length === 1) {
      return selectedSheets[0];
    }
    return `${selectedSheets.length} sheets selected`;
  };

  return (
    <div className="sheet-selector" ref={dropdownRef}>
      <label className="sheet-selector-label">
        <Layers className="sheet-selector-label-icon" />
        Sheets to Translate
        <span className="sheet-selector-optional">(optional)</span>
      </label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn('sheet-selector-trigger', disabled && 'sheet-selector-disabled')}
      >
        <span className="sheet-selector-value">{getDisplayText()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="sheet-selector-chevron" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="sheet-selector-menu"
          >
            <button
              type="button"
              onClick={handleSelectAll}
              className="sheet-selector-option sheet-selector-select-all"
            >
              <span className="sheet-selector-option-content">
                {selectedSheets.length === sheets.length || selectedSheets.length === 0
                  ? 'Deselect All'
                  : 'Select All'}
              </span>
            </button>
            <div className="sheet-selector-divider" />
            {sheets.map((sheet) => (
              <button
                key={sheet}
                type="button"
                onClick={() => handleToggleSheet(sheet)}
                className={cn(
                  'sheet-selector-option',
                  selectedSheets.includes(sheet) && 'sheet-selector-option-selected'
                )}
              >
                <span className="sheet-selector-checkbox">
                  {selectedSheets.includes(sheet) && <Check />}
                </span>
                <span className="sheet-selector-option-content">{sheet}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
