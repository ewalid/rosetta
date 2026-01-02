import { describe, it, expect } from 'vitest';
import { cn, formatFileSize, getFileExtension, isValidExcelFile, generateOutputFilename } from './utils';

describe('cn (className utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });
});

describe('getFileExtension', () => {
  it('extracts xlsx extension', () => {
    expect(getFileExtension('document.xlsx')).toBe('xlsx');
  });

  it('extracts xlsm extension', () => {
    expect(getFileExtension('macro-enabled.xlsm')).toBe('xlsm');
  });

  it('handles multiple dots in filename', () => {
    expect(getFileExtension('my.file.name.xlsx')).toBe('xlsx');
  });

  it('returns lowercase extension', () => {
    expect(getFileExtension('FILE.XLSX')).toBe('xlsx');
  });

  it('handles no extension', () => {
    expect(getFileExtension('noextension')).toBe('');
  });

  it('handles hidden files', () => {
    expect(getFileExtension('.hidden')).toBe('');
  });
});

describe('isValidExcelFile', () => {
  it('accepts xlsx files by MIME type', () => {
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(isValidExcelFile(file)).toBe(true);
  });

  it('accepts xlsx files by extension', () => {
    const file = new File(['test'], 'test.xlsx', { type: '' });
    expect(isValidExcelFile(file)).toBe(true);
  });

  it('accepts xlsm files', () => {
    const file = new File(['test'], 'test.xlsm', { type: '' });
    expect(isValidExcelFile(file)).toBe(true);
  });

  it('accepts xltx files', () => {
    const file = new File(['test'], 'template.xltx', { type: '' });
    expect(isValidExcelFile(file)).toBe(true);
  });

  it('accepts xltm files', () => {
    const file = new File(['test'], 'macro-template.xltm', { type: '' });
    expect(isValidExcelFile(file)).toBe(true);
  });

  it('rejects txt files', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    expect(isValidExcelFile(file)).toBe(false);
  });

  it('rejects csv files', () => {
    const file = new File(['test'], 'data.csv', { type: 'text/csv' });
    expect(isValidExcelFile(file)).toBe(false);
  });

  it('rejects old xls format', () => {
    const file = new File(['test'], 'old.xls', { type: 'application/vnd.ms-excel' });
    expect(isValidExcelFile(file)).toBe(false);
  });
});

describe('generateOutputFilename', () => {
  it('appends language code to filename', () => {
    expect(generateOutputFilename('document.xlsx', 'french')).toBe('document_french.xlsx');
  });

  it('handles complex filenames', () => {
    expect(generateOutputFilename('my.complex.file.xlsx', 'spanish')).toBe('my.complex.file_spanish.xlsx');
  });

  it('works with different extensions', () => {
    expect(generateOutputFilename('data.xlsm', 'german')).toBe('data_german.xlsm');
  });
});
