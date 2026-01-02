import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Languages, Sparkles } from 'lucide-react';
import { Card, CardContent, Button, FileDropzone } from '../../ui';
import { LanguageSelector } from './LanguageSelector';
import { ResultDisplay } from './ResultDisplay';
import { useTranslate } from '../../../hooks/useTranslate';
import type { FileInfo } from '../../../types';
import './Translate.css';

export function TranslateForm() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');

  const { status, error, filename, translate, downloadResult, reset } = useTranslate();

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
    });
  }, [selectedFile, targetLanguage, sourceLanguage, translate]);

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
