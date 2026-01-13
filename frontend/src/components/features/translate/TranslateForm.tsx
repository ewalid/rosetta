import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Sparkles, ArrowRight, Shield, Settings2, MessageSquare, ChevronDown } from 'lucide-react';
import { Button, Recaptcha, FloatingFeedbackButton, type RecaptchaRef } from '../../ui';
import { SheetSelector } from './SheetSelector';
import { ResultDisplay } from './ResultDisplay';
import { ProgressIndicator } from './ProgressIndicator';
import { useTranslate } from '../../../hooks/useTranslate';
import { getSheets } from '../../../api/client';
import { languages } from '../../../lib/languages';
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
  const [isDragging, setIsDragging] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<RecaptchaRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Reset reCAPTCHA when file changes
    if (fileInfo !== selectedFile) {
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  }, [status, reset, selectedFile]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      const extension = file.name.split('.').pop()?.toLowerCase() as 'xlsx' | 'xlsm' | 'xltx' | 'xltm' | undefined;
      handleFileSelect({
        file,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: extension || 'xlsx'
      });
    }
  }, [handleFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase() as 'xlsx' | 'xlsm' | 'xltx' | 'xltm' | undefined;
      handleFileSelect({
        file,
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: extension || 'xlsx'
      });
    }
  }, [handleFileSelect]);

  const isTranslating = status === 'uploading' || status === 'translating';
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  // reCAPTCHA is required only if site key is configured
  const recaptchaRequired = !!recaptchaSiteKey;

  const handleTranslate = useCallback(async () => {
    if (!selectedFile || !targetLanguage) return;

    // If reCAPTCHA is configured, execute it first (invisible mode)
    if (recaptchaRequired && !recaptchaToken) {
      try {
        if (recaptchaRef.current) {
          recaptchaRef.current.execute();
          return; // Wait for onChange callback to proceed
        } else {
          // reCAPTCHA ref not available, proceed without it (fallback)
          console.warn('reCAPTCHA ref not available, proceeding without verification');
        }
      } catch (error) {
        console.error('reCAPTCHA execution error:', error);
        // Continue without reCAPTCHA on error
      }
    }

    // Proceed with translation (token already obtained from reCAPTCHA onChange, or no reCAPTCHA)
    await translate({
      file: selectedFile.file,
      targetLanguage,
      sourceLanguage: sourceLanguage || undefined,
      context: context || undefined,
      sheets: selectedSheets.length > 0 && selectedSheets.length < sheets.length
        ? selectedSheets
        : undefined,
      recaptchaToken: recaptchaToken || undefined,
    });
  }, [selectedFile, targetLanguage, sourceLanguage, context, selectedSheets, sheets.length, recaptchaToken, recaptchaRequired, translate]);

  // Handle reCAPTCHA token received (for invisible mode)
  const handleRecaptchaChange = useCallback((token: string | null) => {
    setRecaptchaToken(token);
    // If we have a token and form is ready, proceed with translation
    if (token && selectedFile && targetLanguage) {
      translate({
        file: selectedFile.file,
        targetLanguage,
        sourceLanguage: sourceLanguage || undefined,
        context: context || undefined,
        sheets: selectedSheets.length > 0 && selectedSheets.length < sheets.length
          ? selectedSheets
          : undefined,
        recaptchaToken: token,
      });
    }
  }, [selectedFile, targetLanguage, sourceLanguage, context, selectedSheets, sheets.length, translate]);

  const handleRetry = useCallback(() => {
    reset();
    recaptchaRef.current?.reset();
    setRecaptchaToken(null);
  }, [reset]);

  // For invisible reCAPTCHA, button is enabled when form is ready (reCAPTCHA executes on click)
  const canTranslate = selectedFile && targetLanguage && !isTranslating;

  return (
    <div ref={containerRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden relative">
      <FloatingFeedbackButton containerRef={containerRef} />
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
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
            disabled={isTranslating}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
              {selectedFile ? (
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Upload className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>

            {selectedFile ? (
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedFile.size}
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
              disabled={isTranslating}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Auto-detect</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
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
              disabled={isTranslating}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select language</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Advanced Options - only show when file is selected */}
        {selectedFile && (
          <div className="mt-6">
            <motion.button
              type="button"
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
              onClick={() => setShowAdvanced(!showAdvanced)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <motion.div
                animate={{ rotate: showAdvanced ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Settings2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </motion.div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Advanced Options
              </span>
              <motion.span
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-auto text-gray-500 dark:text-gray-400"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </motion.button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/10 dark:via-gray-900 dark:to-teal-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-6 space-y-6 shadow-sm">
                    {/* Sheet Selector */}
                    {sheets.length > 1 && (
                      <div className="space-y-2">
                        <SheetSelector
                          sheets={sheets}
                          selectedSheets={selectedSheets}
                          onChange={setSelectedSheets}
                          disabled={isTranslating || loadingSheets}
                        />
                      </div>
                    )}

                    {/* Context Input */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Context for AI
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="e.g., This is a financial report, use formal language. Technical terms should remain in English."
                        disabled={isTranslating}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Provide domain-specific context to help the AI understand your document better for more accurate translations.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Invisible reCAPTCHA - hidden but always rendered when site key is available */}
        {recaptchaSiteKey && (
          <div style={{ display: 'none' }}>
            <Recaptcha
              ref={recaptchaRef}
              siteKey={recaptchaSiteKey}
              onChange={handleRecaptchaChange}
            />
          </div>
        )}

        {/* Translate Button */}
        <Button
          disabled={!canTranslate || isTranslating}
          onClick={handleTranslate}
          className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-6 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isTranslating ? (
            <>
              {status === 'uploading' ? 'Uploading...' : 'Translating...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Translate File
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Supports files up to 50MB
        </p>

        {/* Progress Indicator */}
        <AnimatePresence>
          {isTranslating && <ProgressIndicator status={status} />}
        </AnimatePresence>

        {/* Result Display */}
        <ResultDisplay
          status={status}
          filename={filename}
          error={error}
          onDownload={downloadResult}
          onRetry={handleRetry}
        />
      </div>

      {/* Features Bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Secure Processing</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Fast Translation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Format Preserved</span>
          </div>
        </div>
      </div>
    </div>
  );
}
