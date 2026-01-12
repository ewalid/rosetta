import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Layers, CheckSquare, Square } from 'lucide-react';
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
    return `${selectedSheets.length} of ${sheets.length} sheets`;
  };

  const allSelected = selectedSheets.length === sheets.length;
  const someSelected = selectedSheets.length > 0 && selectedSheets.length < sheets.length;

  return (
    <div className="sheet-selector" ref={dropdownRef}>
      <label className="sheet-selector-label">
        <Layers className="sheet-selector-label-icon" />
        Sheets to Translate
        <span className="sheet-selector-optional">(optional)</span>
      </label>

      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn('sheet-selector-trigger', disabled && 'sheet-selector-disabled')}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <span className="sheet-selector-value">{getDisplayText()}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="sheet-selector-chevron" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="sheet-selector-menu"
          >
            <motion.button
              type="button"
              onClick={handleSelectAll}
              className="sheet-selector-option sheet-selector-select-all"
              whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{ scale: allSelected ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                {allSelected ? (
                  <CheckSquare className="sheet-selector-checkbox-icon" />
                ) : someSelected ? (
                  <div className="sheet-selector-checkbox-indeterminate" />
                ) : (
                  <Square className="sheet-selector-checkbox-icon" />
                )}
              </motion.div>
              <span className="sheet-selector-option-content">
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </motion.button>
            <div className="sheet-selector-divider" />
            {sheets.map((sheet, index) => {
              const isSelected = selectedSheets.includes(sheet);
              return (
                <motion.button
                  key={sheet}
                  type="button"
                  onClick={() => handleToggleSheet(sheet)}
                  className={cn(
                    'sheet-selector-option',
                    isSelected && 'sheet-selector-option-selected'
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <motion.div
                    animate={{ 
                      scale: isSelected ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {isSelected ? (
                      <CheckSquare className="sheet-selector-checkbox-icon sheet-selector-checkbox-checked" />
                    ) : (
                      <Square className="sheet-selector-checkbox-icon" />
                    )}
                  </motion.div>
                  <span className="sheet-selector-option-content">{sheet}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
