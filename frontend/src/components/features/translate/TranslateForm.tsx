import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Sparkles, Settings2, MessageSquare } from 'lucide-react';
import { Card, CardContent, Button, FileDropzone } from '../../ui';
import { LanguageSelector } from './LanguageSelector';
import { SheetSelector } from './SheetSelector';
import { ResultDisplay } from './ResultDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { useTranslate } from '../../../hooks/useTranslate';
import { getSheets } from '../../../api/client';
import type { FileInfo } from '../../../types';
import './Translate.css';
import './Progress.css';

export function TranslateForm() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [context, setContext] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loadingSheets, setLoadingSheets] = useState(false);

  const { status, error, filename, translate, downloadResult, reset } = useTranslate();

  // Fetch sheets when file is selected
  useEffect(() => {
    async function fetchSheets() {
      if (!selectedFile) {
        setSheets([]);
        setSelectedSheets([]);
        return;
      }

      setLoadingSheets(true);
      const response = await getSheets(selectedFile.file);
      setLoadingSheets(false);

      if (response.success && response.sheets) {
        setSheets(response.sheets);
        setSelectedSheets([]); // Start with all sheets (empty = all)
      } else {
        setSheets([]);
      }
    }

    fetchSheets();
  }, [selectedFile]);

  const handleFileSelect = useCallback((fileInfo: FileInfo | null) => {
    setSelectedFile(fileInfo);
    if (status !== 'idle') {
      reset();
    }
  }, [status, reset]);

  const handleTranslate = useCallback(async () => {
    if (!selectedFile || !targetLanguage) return;

    await translate({
      file: selectedFile.file,
      targetLanguage,
      sourceLanguage: sourceLanguage || undefined,
      context: context || undefined,
      sheets: selectedSheets.length > 0 && selectedSheets.length < sheets.length
        ? selectedSheets
        : undefined,
    });
  }, [selectedFile, targetLanguage, sourceLanguage, context, selectedSheets, sheets.length, translate]);

  const handleRetry = useCallback(() => {
    reset();
  }, [reset]);

  const isTranslating = status === 'uploading' || status === 'translating';
  const canTranslate = selectedFile && targetLanguage && !isTranslating;

  return (
    <Card>
      <CardContent>
        <div className="translate-form-content">
          <div className="translate-form-header">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="translate-form-badge"
            >
              <Sparkles />
              <span>Powered by Claude AI</span>
            </motion.div>
            <h2 className="translate-form-title">Translate Your Excel Files</h2>
            <p className="translate-form-subtitle">
              Upload your spreadsheet and select your target language
            </p>
          </div>

          <FileDropzone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={isTranslating}
          />

          <div className="translate-form-languages">
            <LanguageSelector
              value={sourceLanguage}
              onChange={setSourceLanguage}
              label="Source Language"
              includeAutoDetect
              disabled={isTranslating}
            />
            <LanguageSelector
              value={targetLanguage}
              onChange={setTargetLanguage}
              label="Target Language"
              disabled={isTranslating}
            />
          </div>

          {/* Advanced Options - only show when file is selected */}
          {selectedFile && (
            <div className="translate-advanced-options">
              <button
                type="button"
                className="translate-advanced-header"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings2 />
                <span>Advanced Options</span>
                <motion.span
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ marginLeft: 'auto' }}
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="translate-advanced-content"
                  >
                    {/* Sheet Selector */}
                    {sheets.length > 1 && (
                      <SheetSelector
                        sheets={sheets}
                        selectedSheets={selectedSheets}
                        onChange={setSelectedSheets}
                        disabled={isTranslating || loadingSheets}
                      />
                    )}

                    {/* Context Input */}
                    <div className="context-input">
                      <label className="context-input-label">
                        <MessageSquare className="context-input-label-icon" />
                        Context for AI
                        <span className="context-input-optional">(optional)</span>
                      </label>
                      <textarea
                        className="context-input-textarea"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="e.g., This is a financial report, use formal language. Technical terms should remain in English."
                        disabled={isTranslating}
                      />
                      <p className="context-input-hint">
                        Help the AI understand your document better for more accurate translations.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="translate-form-button"
              onClick={handleTranslate}
              disabled={!canTranslate}
              isLoading={isTranslating}
              leftIcon={!isTranslating ? <Languages /> : undefined}
            >
              {isTranslating
                ? status === 'uploading'
                  ? 'Uploading...'
                  : 'Translating...'
                : 'Translate File'}
            </Button>
          </motion.div>

          <AnimatePresence>
            {isTranslating && <ProgressIndicator status={status} />}
          </AnimatePresence>

          <ResultDisplay
            status={status}
            filename={filename}
            error={error}
            onDownload={downloadResult}
            onRetry={handleRetry}
          />
        </div>
      </CardContent>
    </Card>
  );
}
